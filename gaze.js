/**
 * VideoASD Gaze Tracker — vanilla JS port from VIDEOASD-Web React probe.
 *
 * - MediaPipe FaceLandmarker (locally hosted wasm + model)
 * - Extracts 8 eye-look blendshapes per frame, reduces to (x_bs, y_bs) in [-1, 1]
 * - 9-point calibration → affine map to screen [0, 1]
 * - Persists model in localStorage
 */

import {
  FaceLandmarker,
  FilesetResolver,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/+esm';

const WASM_BASE = 'assets/mediapipe';
const MODEL_URL = 'assets/mediapipe/face_landmarker.task';
const STORAGE_KEY = 'videoasd.gaze.calibration.v1';

/* --------- Linear algebra ----------------------------------------------- */
function inverse3x3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const det = a*(e*i - f*h) - b*(d*i - f*g) + c*(d*h - e*g);
  if (Math.abs(det) < 1e-12) return null;
  return [
    [(e*i - f*h)/det, (c*h - b*i)/det, (b*f - c*e)/det],
    [(f*g - d*i)/det, (a*i - c*g)/det, (c*d - a*f)/det],
    [(d*h - e*g)/det, (b*g - a*h)/det, (a*e - b*d)/det],
  ];
}
function matVec3(m, v) {
  return [
    m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
    m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
    m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2],
  ];
}

/* --------- Calibration math --------------------------------------------- */
export function fitAffine2D(samples) {
  if (samples.length < 4) return null;
  let sxx=0, sxy=0, sx1=0, syy=0, sy1=0, s11=0;
  let txx=0, txy=0, tx1=0;
  let tyx=0, tyy=0, ty1=0;
  for (const s of samples) {
    sxx += s.x_bs*s.x_bs; sxy += s.x_bs*s.y_bs; sx1 += s.x_bs;
    syy += s.y_bs*s.y_bs; sy1 += s.y_bs; s11 += 1;
    txx += s.x_bs*s.x_screen; txy += s.y_bs*s.x_screen; tx1 += s.x_screen;
    tyx += s.x_bs*s.y_screen; tyy += s.y_bs*s.y_screen; ty1 += s.y_screen;
  }
  const ata = [[sxx,sxy,sx1],[sxy,syy,sy1],[sx1,sy1,s11]];
  const inv = inverse3x3(ata);
  if (!inv) return null;
  const [ax,bx,cx] = matVec3(inv, [txx,txy,tx1]);
  const [ay,by,cy] = matVec3(inv, [tyx,tyy,ty1]);
  // RMSE
  let ex2=0, ey2=0;
  for (const s of samples) {
    const px = ax*s.x_bs + bx*s.y_bs + cx;
    const py = ay*s.x_bs + by*s.y_bs + cy;
    ex2 += (px - s.x_screen)**2;
    ey2 += (py - s.y_screen)**2;
  }
  return {
    ax, bx, cx, ay, by, cy,
    fittedAt: Date.now(),
    n: samples.length,
    rmseScreen: { x: Math.sqrt(ex2/samples.length), y: Math.sqrt(ey2/samples.length) },
  };
}

export function applyCalibration(model, x_bs, y_bs) {
  return {
    x: model.ax*x_bs + model.bx*y_bs + model.cx,
    y: model.ay*x_bs + model.by*y_bs + model.cy,
  };
}

/* --------- Blendshape → gaze direction ---------------------------------- */
function getBlendshapeMap(result) {
  const map = new Map();
  if (!result || !result.faceBlendshapes || result.faceBlendshapes.length === 0) return map;
  for (const c of result.faceBlendshapes[0].categories) map.set(c.categoryName, c.score);
  return map;
}

function gazeFromResult(result) {
  const bs = getBlendshapeMap(result);
  if (bs.size === 0) return null;
  // Combined left/right/up/down gaze signals from the 8 eye-look blendshapes
  const lookLeft  = ((bs.get('eyeLookOutLeft')  ?? 0) + (bs.get('eyeLookInRight')  ?? 0)) / 2;
  const lookRight = ((bs.get('eyeLookInLeft')   ?? 0) + (bs.get('eyeLookOutRight') ?? 0)) / 2;
  const lookUp    = ((bs.get('eyeLookUpLeft')   ?? 0) + (bs.get('eyeLookUpRight')  ?? 0)) / 2;
  const lookDown  = ((bs.get('eyeLookDownLeft') ?? 0) + (bs.get('eyeLookDownRight')?? 0)) / 2;
  const SCALE = 2.0;
  return {
    x_bs: Math.max(-1, Math.min(1, (lookRight - lookLeft) * SCALE)),
    y_bs: Math.max(-1, Math.min(1, (lookUp - lookDown) * SCALE)),
  };
}

/* --------- GazeTracker class -------------------------------------------- */
export class GazeTracker {
  constructor() {
    this.landmarker = null;
    this.delegate = null;
    this.video = null;
    this.stream = null;
    this.running = false;
    this.lastBs = { x_bs: 0, y_bs: 0 };
    this.model = this.loadCalibration();
    this.onFrameCallbacks = [];
  }

  loadCalibration() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  saveCalibration(model) {
    this.model = model;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(model)); } catch {}
  }

  clearCalibration() {
    this.model = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  hasCalibration() {
    return this.model !== null;
  }

  async init(videoEl) {
    this.video = videoEl;
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    try {
      this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      this.delegate = 'GPU';
    } catch (gpuErr) {
      console.warn('[gaze] GPU delegate failed, trying CPU:', gpuErr);
      this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      this.delegate = 'CPU';
    }
    console.log(`[gaze] FaceLandmarker ready (${this.delegate})`);
  }

  async startCamera() {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
  }

  _loop() {
    if (!this.running) return;
    if (this.landmarker && this.video && this.video.readyState >= 2) {
      try {
        const result = this.landmarker.detectForVideo(this.video, performance.now());
        const gaze = gazeFromResult(result);
        if (gaze) {
          this.lastBs = gaze;
          for (const cb of this.onFrameCallbacks) cb(gaze);
        }
      } catch (e) {
        console.warn('[gaze] detect error:', e);
      }
    }
    requestAnimationFrame(() => this._loop());
  }

  onFrame(cb) {
    this.onFrameCallbacks.push(cb);
  }

  getRawSignal() {
    return this.lastBs;
  }

  /** Returns gaze position in [0,1] screen coords, or null if no calibration. */
  getScreenGaze() {
    if (!this.model) return null;
    return applyCalibration(this.model, this.lastBs.x_bs, this.lastBs.y_bs);
  }
}
