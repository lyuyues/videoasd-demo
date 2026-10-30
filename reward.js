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
/* Title: the same white strip with beaming Alex as the 猜对了 feedback (feedback.js), not emoji. */
.reward h2 { margin: 0; display: flex; align-items: center; gap: 12px; padding: 8px 30px 8px 12px; border-radius: 999px;
             background: #fff; box-shadow: 0 8px 24px rgba(90, 60, 30, .15);
             font-size: 32px; font-weight: 800; color: #ff9d3f;
             font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif; animation: rw-pop .6s .1s cubic-bezier(.2,1.4,.4,1) both; }
.reward h2 img { height: 64px; width: auto; display: block; }
.reward video { width: min(92vw, 124vh); aspect-ratio: 16 / 9; object-fit: cover; border-radius: 24px; background: #000;
                box-shadow: 0 12px 40px rgba(120, 70, 20, .25); }
.reward button { font: inherit; font-size: 20px; font-weight: 800; color: #fff; background: #f59e42; border: 0;
                 border-radius: 18px; padding: 14px 34px; box-shadow: 0 4px 0 #d9822a; visibility: hidden; }
.reward button.show { visibility: visible; animation: rw-pop .5s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes rw-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes rw-pop { from { transform: scale(.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .reward, .reward * { animation: none !important; } }
`;

export const REWARD_SCENES = ['playground', 'classroom', 'cafeteria', 'park'];
const ALEX_HAPPY = new URL('./assets/boy_head_happy.png', import.meta.url).href;

/** playReward(scene, { onDone, log }) -- onDone runs when the child taps 继续 (or right away for an unknown scene). */
export function playReward(scene, { onDone = () => {}, log = () => {} } = {}) {
  if (!REWARD_SCENES.includes(scene)) { onDone(); return; }
  if (!document.getElementById('reward-css')) {
    const st = document.createElement('style'); st.id = 'reward-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.className = 'reward';
  el.innerHTML = `<h2><img src="${ALEX_HAPPY}" alt="">你真棒！</h2>
    <video playsinline preload="auto" poster="assets/videos/reward/${scene}.jpg?v=${V}"
      src="assets/videos/reward/${scene}.mp4?v=${V}"></video>
    <button type="button">继续 →</button>`;
  document.body.appendChild(el);
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
