/* Prediction feedback (2026-10-20).
 *
 * When Sam's reaction clip ends, the child's predicted feeling is checked against
 * what the clip shows: a match gets a rising chime + "猜对了！", anything else a soft
 * two-note "Nice try!" -- both the same bottom strip with Alex (2026-10-30).
 * Clips without an entry here (studio-authored cases) get no feedback.
 *
 * ACCEPT lists which buttons count as right per topic and option. It follows the
 * emotion each reaction was generated with (VIDEOASD-backend/gen_topic.py SPECS):
 * a = happy, b = calm/neutral, c = surprised (make_friends, join_activity) or sad
 * (comfort_friend). The grid has no "surprised", so for c any upset feeling counts.
 * d (过于热情, make_friends + join_activity only) = Sam taken aback: 困惑 (confused)
 * or 惊讶 (the 'scared' key, shown as 惊讶 since 2026-10-20).
 */

export const ACCEPT = {
  make_friends:   { a: ['happy'], b: ['neutral', 'happy'], c: ['sad', 'angry', 'confused', 'scared'], d: ['confused', 'scared'] },
  join_activity:  { a: ['happy'], b: ['neutral', 'happy'], c: ['sad', 'angry', 'confused', 'scared'], d: ['confused', 'scared'] },
  comfort_friend: { a: ['happy'], b: ['neutral', 'sad'],   c: ['sad'] },
};

/* Both outcomes are one calm strip in the middle of the screen (no dimming, no wobble or
   confetti); only the words, the size and the chime differ. */
const CSS = `
.pfb { position: fixed; inset: 0; z-index: 110; display: flex; align-items: center; justify-content: center;
       pointer-events: auto; }
.pfb .pfb-card { display: flex; align-items: center; gap: 14px; padding: 12px 34px 12px 16px; border-radius: 999px;
       background: #fff; box-shadow: 0 8px 24px rgba(90, 60, 30, .2);
       font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
       animation: pfb-up .45s cubic-bezier(.2,1.2,.4,1) both; }
.pfb .pfb-icon img { height: 76px; width: auto; display: block; transform-origin: 50% 90%; animation: pfb-nod .9s .45s ease-in-out; }
.pfb .pfb-msg { font-size: 32px; font-weight: 800; color: #ff9d3f; }
/* 猜对了 is the bigger, happier one: larger strip, springy pop, Alex hops twice.
   Nice try stays calm: rises in gently, one small nod. */
.pfb.right .pfb-card { padding: 14px 40px 14px 18px; animation: pfb-pop .55s cubic-bezier(.2,1.6,.4,1) both; }
.pfb.right .pfb-icon img { height: 92px; transform-origin: 50% 100%; animation: pfb-hop .5s .35s ease-out 2; }
.pfb.right .pfb-msg { font-size: 40px; }
.pfb.out .pfb-card { animation: pfb-down .3s ease forwards; }
@keyframes pfb-pop { from { transform: scale(.6); opacity: 0 } }
@keyframes pfb-hop { 0%,100% { transform: translateY(0) scale(1) } 35% { transform: translateY(-16px) scale(1.06) rotate(-3deg) }
       70% { transform: translateY(0) scaleY(.94) } }
@keyframes pfb-up { from { transform: translateY(24px) scale(.95); opacity: 0 } }
@keyframes pfb-down { to { transform: scale(.95); opacity: 0 } }
@keyframes pfb-nod { 0%,100% { transform: rotate(0) translateY(0) } 35% { transform: rotate(-4deg) translateY(4px) } 70% { transform: rotate(2deg) translateY(-2px) } }
@media (prefers-reduced-motion: reduce) { .pfb, .pfb * { animation: none !important; } }
`;

// Alex, the child's own character in the game (same art as the cues), gives the feedback.
// ALEX_HAPPY: a beaming version for 猜对了 (falls back to the calm one until it exists).
const ALEX = new URL('./assets/boy_head.png', import.meta.url).href;
const ALEX_HAPPY = new URL('./assets/boy_head_happy.png', import.meta.url).href;

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
  el.innerHTML = `<div class="pfb-card"><div class="pfb-icon"><img src="${right ? ALEX_HAPPY : ALEX}" alt=""></div>` +
    `<div class="pfb-msg">${right ? '猜对了！' : 'Nice try！'}</div></div>`;
  const img = el.querySelector('img');
  img.onerror = () => { img.onerror = null; img.src = ALEX; };
  document.body.appendChild(el);
  playSound(right);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    el.classList.add('out'); setTimeout(() => { el.remove(); onDone(); }, 300);
  };
  el.addEventListener('click', close);
  setTimeout(close, right ? 2300 : 2000);
}
