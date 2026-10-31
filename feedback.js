/* Prediction feedback (2026-10-20).
 *
 * When Sam's reaction clip ends, the child's predicted feeling is checked against
 * what the clip shows: a match gets "猜对了！" (marimba + "耶～"), anything else
 * "加油！" (was "Nice try!", then "试得很好！"; two rising notes) -- the same strip with Alex (2026-10-30).
 * Clips without an entry here (studio-authored cases) get no feedback.
 *
 * CHOICES (2026-10-31, table agreed with Yue): the emotion question shows as many
 * buttons as the child has actions (2 / 3 / 4 by difficulty; comfort_friend has only
 * 3 actions, so at most 3), and EXACTLY ONE is right. Every list is fixed (not
 * random) so all children see the same question, in the order written here.
 *
 * Right answers follow what the STUDY clips show (frame check 10-31; the study uses
 * playground for make_friends and classroom for join_activity):
 *   a = 开心; b = 没什么感觉 (Sam keeps playing calmly);
 *   make_friends c (grab toy) = 难过 -- Sam cries in the playground clip;
 *   join_activity c (barge in) = 生气 -- Sam frowns and pouts in the classroom clip;
 *   d (过于热情) = 惊讶 (taken aback; matches the quiz, which has no 困惑);
 *   comfort a = 开心, b (joke) = 开心 (Sam laughs in every joke clip), c = 难过.
 * Distractors are added least-plausible first: c never gets a second "upset" feeling
 * (its 4th is 困惑, least like either clip), b never gets 开心 (Sam plays happily
 * alone), d's 开心 sits farthest from the answer. The right answer's position varies.
 * Keys are the data-emotion values ('scared' is shown as 惊讶).
 */

const A_HAPPY = { answer: 'happy',
  2: ['sad', 'happy'], 3: ['sad', 'happy', 'angry'], 4: ['sad', 'happy', 'angry', 'neutral'] };
const B_NEUTRAL = { answer: 'neutral',
  2: ['neutral', 'sad'], 3: ['neutral', 'sad', 'angry'], 4: ['neutral', 'sad', 'angry', 'scared'] };
const D_SURPRISED = { answer: 'scared',
  4: ['angry', 'scared', 'sad', 'happy'] };

export const CHOICES = {
  make_friends: {
    a: A_HAPPY, b: B_NEUTRAL, d: D_SURPRISED,
    c: { answer: 'sad',
      2: ['happy', 'sad'], 3: ['happy', 'neutral', 'sad'], 4: ['happy', 'neutral', 'sad', 'confused'] },
  },
  join_activity: {
    a: A_HAPPY, b: B_NEUTRAL, d: D_SURPRISED,
    c: { answer: 'angry',
      2: ['happy', 'angry'], 3: ['happy', 'angry', 'neutral'], 4: ['happy', 'angry', 'neutral', 'confused'] },
  },
  comfort_friend: {
    a: { answer: 'happy', 2: ['angry', 'happy'], 3: ['angry', 'happy', 'scared'] },
    b: { answer: 'happy', 2: ['happy', 'sad'],   3: ['happy', 'sad', 'angry'] },
    c: { answer: 'sad',   2: ['happy', 'sad'],   3: ['happy', 'scared', 'sad'] },
  },
};

/** The emotion buttons for this topic/option when `n` choices are wanted, in display
 *  order (the longest list available if n is larger); null = no key for this clip. */
export function emotionChoices(topic, option, n) {
  const c = CHOICES[topic] && CHOICES[topic][option];
  if (!c) return null;
  const sizes = Object.keys(c).filter((k) => k !== 'answer').map(Number).sort((x, y) => x - y);
  const size = sizes.filter((k) => k <= n).pop() || sizes[0];
  return c[size];
}

/* Both outcomes are one calm strip in the middle of the screen (no dimming, no wobble or
   confetti); only the words, the size and the chime differ. */
const CSS = `
.pfb { position: fixed; inset: 0; z-index: 110; display: flex; align-items: center; justify-content: center;
       pointer-events: auto; }
.pfb .pfb-card { display: flex; align-items: center; gap: 22px; padding: 18px 52px 18px 26px; border-radius: 999px;
       background: #fff; box-shadow: 0 8px 24px rgba(90, 60, 30, .2);
       font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
       animation: pfb-up .45s cubic-bezier(.2,1.2,.4,1) both; }
.pfb .pfb-icon img { height: 130px; width: auto; display: block; transform-origin: 50% 90%; animation: pfb-nod .9s .45s ease-in-out; }
.pfb .pfb-msg { font-size: 52px; font-weight: 800; color: #ff9d3f; }
/* 猜对了 is the bigger, happier one: larger strip, springy pop, Alex hops twice.
   加油 stays calm: rises in gently, one small nod. */
.pfb.right .pfb-card { padding: 22px 64px 22px 30px; animation: pfb-pop .55s cubic-bezier(.2,1.6,.4,1) both; }
.pfb.right .pfb-icon img { height: 160px; transform-origin: 50% 100%; animation: pfb-hop .5s .35s ease-out 2; }
.pfb.right .pfb-msg { font-size: 64px; }
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

// Sounds (picked by Yue 2026-10-30; the old chimes didn't feel encouraging -- the try
// one fell in pitch). 猜对了: rising marimba arpeggio, then a child's "耶～" (Gemini TTS,
// assets/audio/yeah.m4a). 加油: two marimba notes going UP.
// Web Audio, because iPad Safari only plays sound after a tap: the lock-in tap calls
// unlockSound(), which also loads the cheer so it's ready when the feedback shows.
let ac = null, yeah = null;
const YEAH_URL = new URL('./assets/audio/yeah.m4a', import.meta.url).href;
export function unlockSound() {
  try {
    // iOS mutes Web Audio under the silent switch while <video> still plays; 'playback'
    // puts these sounds in the same category as the clips (Safari 17+).
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    if (!yeah) {
      yeah = fetch(YEAH_URL).then((r) => r.arrayBuffer())
        .then((b) => new Promise((ok, no) => ac.decodeAudioData(b, ok, no)))
        .catch(() => { yeah = null; return null; });
    }
  } catch (e) { ac = null; }
}
const MARIMBA = [[1, 1], [3.99, 0.18], [10.2, 0.04]];   // [partial ratio, level]
function marimba(freq, at, vol = 0.26, dur = 0.8) {
  const t = ac.currentTime + at, out = ac.createGain();
  out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(vol, t + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  out.connect(ac.destination);
  MARIMBA.forEach(([mult, amp]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(freq * mult, t); g.gain.value = amp;
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
  });
}
function playSound(right) {
  if (!ac) return;
  try {
    if (right) {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => marimba(f, i * 0.11, 0.28, 0.9));   // C E G C
      if (yeah) yeah.then((buf) => {
        if (!buf) return;
        const s = ac.createBufferSource(), g = ac.createGain();
        g.gain.value = 0.8; s.buffer = buf; s.connect(g).connect(ac.destination);
        s.start(ac.currentTime + 0.42);
      });
    } else {
      marimba(523.25, 0, 0.26, 0.7); marimba(783.99, 0.18, 0.26, 0.9);   // C -> G, upward
    }
  } catch (e) { /* no sound is fine */ }
}

/** Is `emotion` right for this topic/option? null when there's no answer key. */
export function judge(topic, option, emotion) {
  const c = CHOICES[topic] && CHOICES[topic][option];
  return c ? c.answer === emotion : null;
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
    `<div class="pfb-msg">${right ? '猜对了！' : '加油！'}</div></div>`;
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
