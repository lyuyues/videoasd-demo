#!/usr/bin/env python3
"""Precompute AOI tracks (face / eyes / mouth / body boxes per sampled frame) for
every clip in clips.js, so the caregiver report can score gaze points instantly.

Output per clip, in assets/aoi/:
  <construct>__<segment>.json       {fps_sampled, repT, src, sha, frames: [{t, boxes: [{kind, c, b}]}]}
  <construct>__<segment>_frame.jpg  still at repT (the frame with the most detections)
segment = context | action_<opt> | reaction_<opt>; b = [x0, y0, x1, y1] in [0, 1].
sha = sha256 of the clip the boxes were computed from, so a re-cut clip is detected.

  python tools/make_aoi.py --check       list clips whose AOI is missing or stale (no deps)
  python tools/make_aoi.py --stale       regenerate only those
  python tools/make_aoi.py [--only ID]   regenerate all (or one construct)
  python tools/make_aoi.py --precommit   git pre-commit hook (tools/hooks/pre-commit):
                                         regenerate + stage AOI for committed clips

Generating needs mediapipe + opencv-python-headless (~/.venvs/videoasd-aoi).
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

try:   # only needed to generate; --check / --precommit with nothing stale run without them
    import cv2
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
except ImportError:
    cv2 = None

ROOT = Path(__file__).resolve().parent.parent
CLIPS_JS = ROOT / 'clips.js'
CLIP_DIR = ROOT / 'assets/videos/clips'
OUT_DIR = ROOT / 'assets/aoi'
DEFAULT_MODELS = ROOT.parent / 'VIDEOASD-backend/mp_models'

FPS = 5
FRAME_W = 720
NUM = 4   # max faces / poses per frame
# The face detector is tuned for large, near faces and misses the small / turned
# cartoon faces, so faces are also searched in overlapping crops upscaled 2x.
# (x0, x1, y0, y1) as fractions of the frame; the full frame goes first.
CROPS = [(0, 1, 0, 1), (0, .55, 0, .8), (.225, .775, 0, .8), (.45, 1, 0, .8),
         (0, .55, .2, 1), (.45, 1, .2, 1)]

# MediaPipe Face Mesh landmark sets (same as VIDEOASD-backend/annotate_v3.py)
EYES_LM = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
           263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
LIPS_LM = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14,
           87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415]
POSE_BODY_LM = list(range(11, 33))   # shoulders down; head is covered by the face box

CLIP_RE = re.compile(r"CB \+ '(\w+)/((context|action_([a-z])|reaction_([a-z]))[^']*\.mp4)'")


def clip_list():
    """[(construct, segment, path)] from clips.js, deduplicated."""
    seen, out = set(), []
    for m in CLIP_RE.finditer(CLIPS_JS.read_text()):
        construct, fname, seg = m.group(1), m.group(2), m.group(3)
        seg = seg.replace('-', '')
        if (construct, seg) in seen:
            continue
        seen.add((construct, seg))
        out.append((construct, seg, CLIP_DIR / construct / fname))
    return out


def bbox(lms, idx, pad):
    xs = [lms[i].x for i in idx if i < len(lms)]
    ys = [lms[i].y for i in idx if i < len(lms)]
    if not xs:
        return None
    b = [min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad]
    b = [round(min(1.0, max(0.0, v)), 4) for v in b]
    return b if b[2] > b[0] and b[3] > b[1] else None


def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union else 0


def dedupe(bs, thresh=0.5):
    """Drop boxes overlapping an earlier one (pose often fires twice on one character)."""
    keep = []
    for b in sorted(bs, key=lambda b: -(b[2] - b[0]) * (b[3] - b[1])):
        if all(iou(b, k) < thresh for k in keep):
            keep.append(b)
    return sorted(keep, key=lambda b: b[0])


def detect_faces(face_lm, img):
    """Face landmark lists (frame coords) from the full frame + upscaled crops, one per face."""
    H, W = img.shape[:2]
    found = []   # [(face box, landmarks)]
    for x0, x1, y0, y1 in CROPS:
        crop = img[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)]
        if (x1 - x0) < 1:
            crop = cv2.resize(crop, None, fx=2, fy=2)
        rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        for lms in face_lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)).face_landmarks or []:
            lms = [SimpleNamespace(x=x0 + (x1 - x0) * p.x, y=y0 + (y1 - y0) * p.y) for p in lms]
            b = bbox(lms, range(len(lms)), 0)
            if b and all(iou(b, k) < 0.3 for k, _ in found):
                found.append((b, lms))
    return sorted((lms for _, lms in found), key=lambda l: l[1].x)


def plausible_body(b, face_centers):
    """Pose misfires show up as wide boxes (benches) or boxes spanning two characters."""
    if not b or (b[2] - b[0]) > (b[3] - b[1]):
        return False
    return sum(b[0] <= x <= b[2] and b[1] <= y <= b[3] for x, y in face_centers) < 2


def make_landmarkers(models):
    face = mp_vision.FaceLandmarker.create_from_options(mp_vision.FaceLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(models / 'face_landmarker.task')),
        running_mode=mp_vision.RunningMode.IMAGE, num_faces=NUM,
        min_face_detection_confidence=0.3, min_face_presence_confidence=0.3))
    pose = mp_vision.PoseLandmarker.create_from_options(mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(models / 'pose_landmarker_full.task')),
        running_mode=mp_vision.RunningMode.VIDEO, num_poses=NUM,
        min_pose_detection_confidence=0.3))
    return face, pose


def annotate(path, models):
    face_lm, pose_lm = make_landmarkers(models)   # fresh per clip: pose VIDEO mode needs rising timestamps
    cap = cv2.VideoCapture(str(path))
    vfps = cap.get(cv2.CAP_PROP_FPS) or 24
    step = max(1, round(vfps / FPS))
    frames, stills, i = [], {}, 0
    while True:
        ok, img = cap.read()
        if not ok:
            break
        if i % step == 0:
            t = round(i / vfps, 2)
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mpi = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            ts = int(i * 1000 / vfps)
            boxes = []
            faces = detect_faces(face_lm, img)
            for c, lms in enumerate(faces):
                for kind, idx, pad in (('face', range(len(lms)), 0.01),
                                       ('eyes', EYES_LM, 0.008), ('mouth', LIPS_LM, 0.008)):
                    b = bbox(lms, list(idx), pad)
                    if b:
                        boxes.append({'kind': kind, 'c': c, 'b': b})
            poses = sorted(pose_lm.detect_for_video(mpi, ts).pose_landmarks or [], key=lambda l: l[0].x)
            centers = [(l[1].x, l[1].y) for l in faces]
            bodies = dedupe([b for b in (bbox(l, POSE_BODY_LM, 0.015) for l in poses) if plausible_body(b, centers)])
            boxes += [{'kind': 'body', 'c': c, 'b': b} for c, b in enumerate(bodies)]
            frames.append({'t': t, 'boxes': boxes})
            stills[t] = img
        i += 1
    cap.release()
    face_lm.close(); pose_lm.close()
    if not frames:
        return None, None
    # representative still: most face detections, ties → closest to the middle
    mid = frames[len(frames) // 2]['t']
    best = max(frames, key=lambda f: (sum(b['kind'] == 'face' for b in f['boxes']),
                                      len(f['boxes']), -abs(f['t'] - mid)))
    img = stills[best['t']]
    h = round(img.shape[0] * FRAME_W / img.shape[1])
    return {'fps_sampled': FPS, 'repT': best['t'], 'frames': frames}, cv2.resize(img, (FRAME_W, h))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def aoi_files(slug):
    return OUT_DIR / f'{slug}.json', OUT_DIR / f'{slug}_frame.jpg'


def is_stale(slug, path):
    js, jpg = aoi_files(slug)
    if not (js.exists() and jpg.exists()):
        return True
    try:
        return json.loads(js.read_text()).get('sha') != sha256(path)
    except ValueError:
        return True


def generate(construct, seg, path, models):
    if cv2 is None:
        sys.exit('make_aoi: mediapipe/opencv missing - run with ~/.venvs/videoasd-aoi/bin/python')
    aoi, still = annotate(path, models)
    if aoi is None:
        print(f'  UNREADABLE {path.relative_to(ROOT)}')
        return False
    aoi['src'] = str(path.relative_to(ROOT))
    aoi['sha'] = sha256(path)
    slug = f'{construct}__{seg}'
    js, jpg = aoi_files(slug)
    js.write_text(json.dumps(aoi, separators=(',', ':')))
    cv2.imwrite(str(jpg), still, [cv2.IMWRITE_JPEG_QUALITY, 80])
    hit = sum(1 for f in aoi['frames'] if any(b['kind'] == 'face' for b in f['boxes']))
    print(f'{slug:45s} {len(aoi["frames"]):3d} frames, face in {hit:3d}, repT {aoi["repT"]}')
    return True


def git(*args, text=True):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=text, check=True).stdout


def staged_bytes(rel):
    """Content of rel as it will be committed (None if not in the index)."""
    try:
        return git('show', f':{rel}', text=False)
    except subprocess.CalledProcessError:
        return None


def precommit(models):
    """Invariant: every AOI in the commit was computed from exactly the clip in the commit.
    A clip may go without AOI (the report then says no analysis), never with stale AOI."""
    clips = [(c, s, p) for c, s, p in clip_list() if p.exists()]
    staged = set(git('diff', '--cached', '--name-only').split())
    unstaged = set(git('diff', '--name-only').split())
    rel = lambda f: str(f.relative_to(ROOT))
    # clips this commit touches: the video or its AOI is staged
    touched = [(c, s, p) for c, s, p in clips
               if rel(p) in staged or any(rel(f) in staged for f in aoi_files(f'{c}__{s}'))]
    for c, s, p in touched:
        slug = f'{c}__{s}'
        if rel(p) in unstaged:   # boxes would come from the working copy, not the commit
            sys.exit(f'make_aoi: {rel(p)} has unstaged changes - stage or revert it first')
        if is_stale(slug, p):
            print(f'make_aoi: {slug} is stale, regenerating')
            if not generate(c, s, p, models):
                sys.exit(1)
        git('add', '--', *map(rel, aoi_files(slug)))
    if touched:
        print(f'make_aoi: AOI staged for {len(touched)} clip(s)')
    # verify the invariant over the whole commit, not just what was touched
    bad = []
    for c, s, p in clips:
        js = staged_bytes(rel(aoi_files(f'{c}__{s}')[0]))
        video = staged_bytes(rel(p))
        if js is None or video is None:
            continue
        if json.loads(js).get('sha') != hashlib.sha256(video).hexdigest():
            bad.append(f'{c}__{s}')
    if bad:
        sys.exit('make_aoi: AOI does not match the committed clip:\n  ' + '\n  '.join(bad))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='construct id, e.g. park_make_friends')
    ap.add_argument('--models', type=Path, default=DEFAULT_MODELS)
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument('--check', action='store_true', help='list stale AOI, exit 1 if any')
    mode.add_argument('--stale', action='store_true', help='regenerate stale AOI only')
    mode.add_argument('--precommit', action='store_true', help='git pre-commit hook mode')
    args = ap.parse_args()
    OUT_DIR.mkdir(exist_ok=True)
    if args.precommit:
        return precommit(args.models)
    bad = 0
    for construct, seg, path in clip_list():
        if args.only and construct != args.only:
            continue
        if not path.exists():
            print(f'  MISSING {path.relative_to(ROOT)}')
            continue
        slug = f'{construct}__{seg}'
        if args.check or args.stale:
            if not is_stale(slug, path):
                continue
            if args.check:
                print(f'stale: {slug}')
                bad += 1
                continue
        generate(construct, seg, path, args.models)
    if args.check:
        print(f'{bad} stale' if bad else 'all AOI match their clips')
        sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
