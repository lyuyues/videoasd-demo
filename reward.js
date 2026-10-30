/* Reward clip (2026-10-20).
 *
 * After a round in the PRR app (index.html; not the baseline) the child gets a
 * short Veo clip of Alex and Sam singing and dancing together, one per SCENE so
 * the backdrop matches where the child just played, whatever the topic
 * (assets/videos/reward/<scene>.mp4, made by VIDEOASD-backend/gen_reward.py). The 继续 button
 * appears once the clip ends; tapping the clip early skips to it.
 */

const V = '20261030d';   // all four reward clips end on a cheer pose (Gemini Omni extension)
const CSS = `
.reward { position: fixed; inset: 0; z-index: 120; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 16px; padding: 20px; background: rgba(255, 246, 232, .97);
          animation: rw-in .35s ease both; }
/* Title: praise for what the child just did, with beaming Alex inline like the cues
   ("如果你是 [Alex] 你会怎么做？"); no box, it isn't a button. */
.reward h2 { margin: 0; display: flex; align-items: center; gap: 8px;
             font-size: 32px; font-weight: 800; color: #ff9d3f;
             font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif; animation: rw-pop .6s .1s cubic-bezier(.2,1.4,.4,1) both; }
.reward h2 img { height: 64px; width: auto; display: block; }
.reward video { width: min(92vw, 124vh); aspect-ratio: 16 / 9; object-fit: cover; border-radius: 24px; background: #000;
                box-shadow: 0 12px 40px rgba(120, 70, 20, .25); }
.reward button { font: inherit; font-size: 20px; font-weight: 800; color: #fff; background: #f59e42; border: 0;
                 border-radius: 18px; padding: 14px 34px; box-shadow: 0 4px 0 #d9822a; visibility: hidden; }
.reward button.show { visibility: visible; animation: rw-pop .5s cubic-bezier(.2,1.4,.4,1) both; }
/* 天女散花: petals and confetti (drawn in CSS, game colours, no emoji) drift down once. */
.reward .rw-shower { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
.reward .rw-bit { position: absolute; top: -30px; width: var(--w); height: var(--h); background: var(--c);
                  border-radius: var(--r); animation: rw-fall var(--d) var(--delay) cubic-bezier(.3,.1,.6,1) both; }
@keyframes rw-fall {
  0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
  25%  { transform: translate3d(var(--sx), 28vh, 0) rotate(calc(var(--rot) * .25)); }
  50%  { transform: translate3d(calc(var(--sx) * -1), 56vh, 0) rotate(calc(var(--rot) * .5)); }
  75%  { transform: translate3d(var(--sx), 84vh, 0) rotate(calc(var(--rot) * .75)); }
  100% { transform: translate3d(0, 115vh, 0) rotate(var(--rot)); } }
@keyframes rw-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes rw-pop { from { transform: scale(.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .reward, .reward * { animation: none !important; } }
`;

export const REWARD_SCENES = ['playground', 'classroom', 'cafeteria', 'park'];
const ALEX_HAPPY = new URL('./assets/boy_head_happy.png', import.meta.url).href;
// Labelled praise: name what the child helped Alex do, per topic ([A] = Alex's face).
const PRAISE = {
  make_friends: '你帮 [A] 交到朋友啦！',
  join_activity: '你帮 [A] 加入游戏啦！',
  comfort_friend: '你帮 [A] 安慰了朋友！',
};

const SHOWER_COLOURS = ['#ff9d3f', '#ffb56a', '#ffd36b', '#ff8fa3', '#f9b8c8', '#7fc164', '#5bb6e8'];
function shower(el) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div'); layer.className = 'rw-shower';
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 48; i++) {
    const b = document.createElement('i'); b.className = 'rw-bit';
    const petal = i % 3 !== 0;   // two thirds petals, the rest round / strip confetti
    const s = petal ? rnd(12, 20) : rnd(8, 12);
    Object.entries({
      '--w': `${s}px`, '--h': `${petal ? s * 0.7 : (i % 2 ? s : s * 0.45)}px`,
      '--r': petal ? '60% 0 60% 0' : (i % 2 ? '50%' : '2px'),
      '--c': SHOWER_COLOURS[i % SHOWER_COLOURS.length],
      '--sx': `${rnd(-40, 40).toFixed(0)}px`, '--rot': `${rnd(-540, 540).toFixed(0)}deg`,
      '--d': `${rnd(2.6, 4).toFixed(2)}s`, '--delay': `${rnd(0, 1.6).toFixed(2)}s`,
    }).forEach(([k, v]) => b.style.setProperty(k, v));
    b.style.left = `${rnd(0, 100).toFixed(1)}%`;
    layer.appendChild(b);
  }
  el.appendChild(layer);
  setTimeout(() => layer.remove(), 6500);
}

/** playReward(scene, { topic, onDone, log }) -- onDone runs when the child taps 继续 (or right away for an unknown scene). */
export function playReward(scene, { topic = '', onDone = () => {}, log = () => {} } = {}) {
  if (!REWARD_SCENES.includes(scene)) { onDone(); return; }
  if (!document.getElementById('reward-css')) {
    const st = document.createElement('style'); st.id = 'reward-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.className = 'reward';
  const face = `<img src="${ALEX_HAPPY}" alt="">`;
  const title = PRAISE[topic] ? PRAISE[topic].replace('[A]', face) : `${face}你真棒！`;
  el.innerHTML = `<h2>${title}</h2>
    <video playsinline preload="auto" poster="assets/videos/reward/${scene}.jpg?v=${V}"
      src="assets/videos/reward/${scene}.mp4?v=${V}"></video>
    <button type="button">继续 →</button>`;
  document.body.appendChild(el);
  shower(el);
  const video = el.querySelector('video'), btn = el.querySelector('button');
  const t0 = Date.now();
  const reveal = () => btn.classList.add('show');
  video.addEventListener('ended', reveal);
  video.addEventListener('error', reveal);
  video.addEventListener('click', () => { if (video.paused) video.play().catch(reveal); else reveal(); });
  video.play().catch(reveal);   // blocked autoplay: show the button so nobody gets stuck
  log('reward_shown', { scene });
  btn.addEventListener('click', () => {
    log('reward_closed', { scene, watchedMs: Date.now() - t0, ended: video.ended });
    video.pause(); el.remove(); onDone();
  });
}
