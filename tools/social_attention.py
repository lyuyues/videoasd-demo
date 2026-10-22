#!/usr/bin/env python3
"""Social attention ratio from saved session files (session_data/*.json).

Each on-video gaze point [vx, vy, t] is classified against the clip's AOI track
(assets/aoi/, same rule as classifyPoint in index.html: eyes > mouth > face > body > bg,
nearest sampled frame). Per clip and per session:

  on_video  = on / (on + off)                       share of samples on the video
  SAR       = (eyes + mouth + face + body) / on     social attention ratio (characters vs. background)
  face      = (eyes + mouth + face) / on            face-only ratio
  eyes_mouth = eyes / (eyes + mouth)                eyes vs. mouth among face-feature looks

Legacy "|outcome" keys (no option) have no AOI and are skipped.

  python tools/social_attention.py session_data/*.json [--csv out.csv]
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AOI_DIR = ROOT / 'assets/aoi'
KINDS = ('eyes', 'mouth', 'face', 'body', 'bg')
_aoi_cache = {}


def aoi_slug(key):
    loc, _, clip = key.partition('|')
    seg = re.sub(r'^outcome_', 'reaction_', re.sub(r'^baseline-', '', clip))
    return f'{loc}__{seg}' if re.fullmatch(r'context|(action|reaction)_[a-z]', seg) else None


def load_aoi(key):
    slug = aoi_slug(key)
    if slug not in _aoi_cache:
        p = AOI_DIR / f'{slug}.json'
        _aoi_cache[slug] = json.loads(p.read_text()) if slug and p.exists() else None
    return _aoi_cache[slug]


def classify(aoi, x, y, t):
    f = min(aoi['frames'], key=lambda fr: abs(fr['t'] - (t or 0)))
    inside = lambda b: b[0] <= x <= b[2] and b[1] <= y <= b[3]
    for kind in ('eyes', 'mouth', 'face', 'body'):
        if any(bx['kind'] == kind and inside(bx['b']) for bx in f['boxes']):
            return kind
    return 'bg'


def ratios(c, on, off):
    social = c['eyes'] + c['mouth'] + c['face'] + c['body']
    div = lambda a, b: round(a / b, 3) if b else None
    return {'n_on': on, 'n_off': off, 'on_video': div(on, on + off),
            'SAR': div(social, sum(c.values())), 'face_ratio': div(c['eyes'] + c['mouth'] + c['face'], sum(c.values())),
            'eyes_mouth': div(c['eyes'], c['eyes'] + c['mouth']), **c}


def analyse(path):
    d = json.loads(Path(path).read_text())
    rows, tot, tot_on, tot_off = [], dict.fromkeys(KINDS, 0), 0, 0
    for key, g in (d.get('gaze') or {}).items():
        aoi = load_aoi(key)
        if not aoi:
            continue
        c = dict.fromkeys(KINDS, 0)
        for vx, vy, *t in g.get('pts', []):
            c[classify(aoi, vx, vy, t[0] if t else 0)] += 1
        on, off = g.get('on', 0), g.get('off', 0)
        rows.append({'clip': key, **ratios(c, on, off)})
        for k in KINDS:
            tot[k] += c[k]
        tot_on, tot_off = tot_on + on, tot_off + off
    meta = {'file': Path(path).name, 'participant': d.get('participantId'), 'condition': d.get('condition')}
    return meta, rows, (ratios(tot, tot_on, tot_off) if rows else None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='+')
    ap.add_argument('--csv')
    a = ap.parse_args()
    out = []
    for f in a.files:
        meta, rows, total = analyse(f)
        if not total:
            print(f"{meta['file']}: no gaze points with AOI", file=sys.stderr)
            continue
        print(f"\n{meta['participant']} · {meta['condition']} · {meta['file']}")
        for r in rows + [{'clip': 'TOTAL', **total}]:
            print(f"  {r['clip']:<45} n={r['n_on']:<4} on_video={r['on_video']}  SAR={r['SAR']}  "
                  f"face_ratio={r['face_ratio']}  eyes/mouth={r['eyes_mouth']}")
            out.append({**meta, **r})
    if a.csv and out:
        with open(a.csv, 'w', newline='') as fh:
            w = csv.DictWriter(fh, fieldnames=list(out[0]))
            w.writeheader()
            w.writerows(out)


if __name__ == '__main__':
    main()
