/* Prediction feedback (2026-10-20).
 *
 * When Sam's reaction clip ends, the child's predicted feeling is checked against
 * what the clip shows: a match gets a chime + star burst ("猜对了！"), anything
 * else a soft two-note "Nice try!". Clips without an entry here (studio-authored
 * cases) get no feedback.
 *
 * ACCEPT lists which buttons count as right per topic and option. It follows the
 * emotion each reaction was generated with (VIDEOASD-backend/gen_topic.py SPECS):
 * a = happy, b = calm/neutral, c = surprised (make_friends, join_activity) or sad
 * (comfort_friend). The grid has no "surprised", so for c any upset feeling counts.
 */

export const ACCEPT = {
  make_friends:   { a: ['happy'], b: ['neutral', 'happy'], c: ['sad', 'angry', 'confused', 'scared'] },
  join_activity:  { a: ['happy'], b: ['neutral', 'happy'], c: ['sad', 'angry', 'confused', 'scared'] },
  comfort_friend: { a: ['happy'], b: ['neutral', 'sad'],   c: ['sad'] },
};

const CSS = `
.pfb { position: fixed; inset: 0; z-index: 110; display: flex; align-items: center; justify-content: center;
       background: rgba(255, 250, 242, .55); pointer-events: auto; animation: pfb-in .25s ease both; }
.pfb .pfb-card { position: relative; text-align: center; padding: 34px 64px 28px; border-radius: 32px; background: #fff;
       box-shadow: 0 14px 40px rgba(90, 60, 30, .25);
       font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif; }
.pfb .pfb-icon { font-size: 110px; line-height: 1; display: inline-block; }
.pfb .pfb-msg { font-size: 42px; font-weight: 800; margin-top: 8px; }
.pfb .pfb-sub { font-size: 20px; color: #8a7a68; margin-top: 4px; }
.pfb.right .pfb-msg { color: #e8804f; }
.pfb.right .pfb-icon { animation: pfb-pop .7s cubic-bezier(.2,1.5,.4,1) both, pfb-spin 1.2s .2s ease both; }
.pfb.right .pfb-card { animation: pfb-pop .55s cubic-bezier(.2,1.5,.4,1) both; }
.pfb.try .pfb-msg { color: #5b8fd1; }
.pfb.try .pfb-icon { animation: pfb-pop .6s cubic-bezier(.2,1.4,.4,1) both, pfb-wave 1s .5s ease-in-out 2; }
.pfb.try .pfb-card { animation: pfb-pop .5s ease both; }
.pfb .pfb-spark { position: absolute; left: 50%; top: 50%; font-size: 34px; pointer-events: none;
       animation: pfb-burst 1s ease-out forwards; }
.pfb.out { animation: pfb-out .3s ease forwards; }
@keyframes pfb-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes pfb-out { to { opacity: 0 } }
@keyframes pfb-pop { from { transform: scale(.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }
@keyframes pfb-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
@keyframes pfb-wave { 0%,100% { transform: rotate(0) } 30% { transform: rotate(-14deg) } 70% { transform: rotate(14deg) } }
@keyframes pfb-burst { from { transform: translate(-50%, -50%) scale(.4); opacity: 1 }
       to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.2); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .pfb, .pfb * { animation: none !important; } }
`;

// Web Audio, so there's no sound file to load. The context is created on a tap
// (unlockSound) because iPad Safari only lets audio start from a user gesture.
let ac = null;
export function unlockSound() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch (e) { ac = null; }
}
function tone(freq, start, dur, type = 'sine', vol = 0.25) {
  const t = ac.currentTime + start, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}
function playSound(right) {
  if (!ac) return;
  try {
    if (right) [523, 659, 784, 1047].forEach((f, i) => { tone(f, i * 0.1, 0.4, 'triangle'); tone(f * 2, i * 0.1, 0.25, 'sine', 0.06); });
    else { tone(440, 0, 0.3, 'sine', 0.2); tone(392, 0.22, 0.45, 'sine', 0.2); }
  } catch (e) { /* no sound is fine */ }
}

/** Is `emotion` right for this topic/option? null when there's no answer key. */
export function judge(topic, option, emotion) {
  const ok = ACCEPT[topic] && ACCEPT[topic][option];
  return ok ? ok.includes(emotion) : null;
}

/** showFeedback(right, onDone) -- overlay for ~2 s (a tap closes it sooner), then onDone. */
export function showFeedback(right, onDone = () => {}) {
  if (!document.getElementById('pfb-css')) {
    const st = document.createElement('style'); st.id = 'pfb-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.className = 'pfb ' + (right ? 'right' : 'try');
  el.innerHTML = right
    ? `<div class="pfb-card"><div class="pfb-icon">⭐</div><div class="pfb-msg">猜对了！</div><div class="pfb-sub">你真会看她的感觉</div></div>`
    : `<div class="pfb-card"><div class="pfb-icon">👍</div><div class="pfb-msg">Nice try！</div><div class="pfb-sub">再看看她是什么感觉</div></div>`;
  document.body.appendChild(el);
  if (right) {
    const card = el.querySelector('.pfb-card');
    ['✨', '⭐', '🎉', '✨', '🌟', '⭐', '🎊', '✨', '🌟', '⭐'].forEach((s, i) => {
      const sp = document.createElement('span'); sp.className = 'pfb-spark'; sp.textContent = s;
      const a = (i / 10) * Math.PI * 2, r = 210 + (i % 3) * 40;
      sp.style.setProperty('--dx', (Math.cos(a) * r).toFixed(0) + 'px');
      sp.style.setProperty('--dy', (Math.sin(a) * r).toFixed(0) + 'px');
      sp.style.animationDelay = (i % 3) * 0.08 + 's';
      card.appendChild(sp);
    });
  }
  playSound(right);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    el.classList.add('out'); setTimeout(() => { el.remove(); onDone(); }, 300);
  };
  el.addEventListener('click', close);
  setTimeout(close, right ? 2300 : 2000);
}
