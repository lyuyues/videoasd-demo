/* Calibration dots flow (2026-11-02), shared by index.html (PRR) and baseline.html so
 * both conditions calibrate exactly the same way.
 *
 *  1. 9 fit dots: look at the yellow dot, tap it. Each dot takes the median of the
 *     frames just before the tap (gaze.dotSignal); if the face was not seen, the dot
 *     stays and asks for another tap. (Before: one single frame per dot -> 20-28 %
 *     fit error in the 11-02 self-test.)
 *  2. Affine fit (fitAffine2D).
 *  3. 2 validation dots not used in the fit -> real error (validate). Over
 *     VAL_MAX_ERR on either axis: the grown-up chooses 重新校准 or 仍然使用.
 *
 * The page supplies the DOM, a note(result, extra) logger for gaze_calibration events,
 * and onDone(model, info) for what happens after success. The model carries its raw
 * samples, the validation result and whether it was accepted automatically or by
 * override, so a fit can be re-done offline from the saved session file.
 */
import { CAL_POINTS, VAL_POINTS, fitAffine2D, validate } from './gaze.js?v=20261102';

export function createCalFlow({ gaze, $dots, $instr, $progress, hint, note, onDone }) {
  const DOTS = CAL_POINTS.concat(VAL_POINTS);
  const NFIT = CAL_POINTS.length;
  let idx = 0, calS = [], valS = [], model = null, misses = 0, busy = false;

  const say = (html, faded = false) => { $instr.innerHTML = html; $instr.classList.toggle('faded', faded); };

  function render() {
    $dots.innerHTML = '';
    const inVal = idx >= NFIT;
    DOTS.forEach(([x, y], i) => {
      if (inVal ? i < NFIT : i >= NFIT) return;   // fit dots first, then only the 2 check dots
      const d = document.createElement('div');
      d.className = 'cal-dot' + (i < idx ? ' done' : '') + (i === idx ? ' current' : '');
      d.style.left = `${x * 100}%`;
      d.style.top = `${y * 100}%`;
      d.addEventListener('click', () => click(i));
      $dots.appendChild(d);
    });
    $progress.textContent = inVal ? `检查 ${idx - NFIT} / ${VAL_POINTS.length}` : `${idx} / ${NFIT}`;
    if (idx > 0 && idx < DOTS.length && idx !== NFIT) $instr.classList.add('faded');
  }

  function reset() {
    idx = 0; calS = []; valS = []; model = null; misses = 0; busy = false;
    render();
  }

  function finish(accepted) {
    model.accepted = accepted;   // 'auto' | 'override'
    const v = model.validation;
    onDone(model, {
      points: calS.length, screen: [window.innerWidth, window.innerHeight],
      rmseX: +model.rmseScreen.x.toFixed(4), rmseY: +model.rmseScreen.y.toFixed(4),
      valErrX: v.errX, valErrY: v.errY, accepted, dotMisses: misses,
    });
  }

  function click(i) {
    if (busy || i !== idx) return;   // must tap the current one
    const sig = gaze.dotSignal();
    if (!sig) {
      misses++;
      say('<span style="color:#ffd49a">没看清眼睛 — 请看着<strong>黄色圆点</strong>，停一下再点。</span>');
      return;
    }
    const [x, y] = DOTS[i];
    (i < NFIT ? calS : valS).push({ ...sig, x_screen: x, y_screen: y });
    idx++;
    if (idx === NFIT) {
      model = fitAffine2D(calS);
      if (!model) {
        note('failed', { dotMisses: misses });
        say('<span style="color:#ff8888">校准失败：采样数据异常，请重试</span>');
        busy = true;
        setTimeout(() => { reset(); say(hint); }, 1500);
        return;
      }
      model.samples = calS;
      say('再看 <strong>2 个圆点</strong>，检查一下准不准。');
      render();
      return;
    }
    if (idx < DOTS.length) { render(); return; }
    // all dots done
    model.validation = validate(model, valS);
    render();
    const v = model.validation;
    const pct = (e) => `${(e * 100).toFixed(0)}%`;
    if (v.ok) { finish('auto'); return; }
    busy = true;
    say(`<span style="color:#ffd49a">校准误差偏大（横 ${pct(v.errX)} · 纵 ${pct(v.errY)}，目标 12% 以内）。</span><br>
      建议坐正、脸对着平板、头别动，再校准一次。<br>
      <span style="display:inline-flex;gap:12px;margin-top:12px">
        <button type="button" data-cal="redo" style="font:inherit;padding:8px 18px;border-radius:14px;border:none;background:#ffd049;color:#222;cursor:pointer">重新校准</button>
        <button type="button" data-cal="keep" style="font:inherit;padding:8px 18px;border-radius:14px;border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff;cursor:pointer">仍然使用</button>
      </span>`);
    $instr.querySelector('[data-cal="redo"]').onclick = () => {
      note('rejected', { valErrX: v.errX, valErrY: v.errY, dotMisses: misses });
      reset(); say(hint);
    };
    $instr.querySelector('[data-cal="keep"]').onclick = () => { busy = false; finish('override'); };
  }

  return { reset, render };
}
