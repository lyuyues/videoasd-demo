/* Scene close-ups (2026-10-19).
 *
 * Replaces the small floating zone renders (assets/zones/*.png) behind the topic
 * circles. Each place is a full-bleed backdrop generated with Gemini from the
 * clips' own frames (assets/scene_art/<scene>.jpg -- same 3D look, no people), and
 * each topic is a story card showing a real frame from that topic's context clip
 * (assets/scene_art/<scene>_<topic>.jpg), so what the child taps is what they then
 * watch. Tapping a card walks the avatar over, then index.html opens that round.
 *
 * 1600x900 viewBox (the backdrop's 16:9) with slice framing; the 4:3 iPad shows
 * x≈200..1400, so the cards stay inside that.
 */

const W = 1600, H = 900;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FONT = `-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif`;
const CARD_W = 320, PHOTO_H = 180;

// Card slot per topic: left / centre / right, set so each card sits by the part of
// the backdrop its story happens at (swing, sandbox, bench...).
const SLOTS = { L: [390, 330], C: [800, 300], R: [1210, 330] };
const LAYOUT = {
  playground: { comfort_friend: 'L', make_friends: 'C', join_activity: 'R' },
  classroom:  { make_friends: 'L', join_activity: 'C', comfort_friend: 'R' },
  cafeteria:  { make_friends: 'L', join_activity: 'C', comfort_friend: 'R' },
  park:       { make_friends: 'L', join_activity: 'C', comfort_friend: 'R' },
};
const START = [800, 860];

const CSS = `
.sceneview { position: fixed; inset: 0; z-index: 3; overflow: hidden; background: #e9dcc8;
             -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
.sceneview.hidden { display: none; }
.sceneview svg { width: 100%; height: 100%; display: block; }
.sceneview .flash { position: absolute; inset: 0; background: #fffaf2; opacity: 1; pointer-events: none;
                    transition: opacity .5s ease; }
.sceneview .card { cursor: pointer; }
.sceneview .card .c-float { animation: s-float 3.4s ease-in-out infinite; }
.sceneview .card .c-glow { animation: s-glow 2.2s ease-in-out infinite; }
.sceneview .card .c-bump { transition: transform .18s cubic-bezier(.3,1.6,.5,1); }
.sceneview .card.press .c-bump { transform: scale(1.05); }
.sceneview .card.done .c-glow { animation: none; opacity: 0; }
.sceneview .card.done .c-float { animation: none; }
.sceneview .step { animation: s-step .32s ease-in-out infinite alternate; }
@keyframes s-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes s-glow { 0%,100%{opacity:.85} 50%{opacity:.25} }
@keyframes s-step { from{transform:translateY(0) rotate(-2deg)} to{transform:translateY(-8px) rotate(2deg)} }
@media (prefers-reduced-motion: reduce) { .sceneview * { animation: none !important; } }
`;

function card(sceneId, t, label, emoji, delay) {
  const [x, y] = SLOTS[LAYOUT[sceneId][t]];
  const w = CARD_W, h = PHOTO_H, pad = 10, total = h + pad * 2 + 58;
  const x0 = -w / 2, y0 = -total / 2;
  const clip = `clip-${sceneId}-${t}`;
  return `<g class="card" data-topic="${t}" transform="translate(${x} ${y})">
    <ellipse cx="0" cy="${total / 2 + 34}" rx="${w * 0.36}" ry="14" fill="#000" opacity=".18"/>
    <g class="c-float" style="animation-delay:${delay}s"><g class="c-bump">
      <rect class="c-glow" x="${x0 - 9}" y="${y0 - 9}" width="${w + 18}" height="${total + 18}" rx="30"
        fill="none" stroke="#ffb15c" stroke-width="8"/>
      <rect x="${x0}" y="${y0}" width="${w}" height="${total}" rx="22" fill="#fff"
        style="filter: drop-shadow(0 8px 14px rgba(60,40,20,.28))"/>
      <clipPath id="${clip}"><rect x="${x0 + pad}" y="${y0 + pad}" width="${w - pad * 2}" height="${h}" rx="14"/></clipPath>
      <image href="assets/scene_art/${sceneId}_${t}.jpg" x="${x0 + pad}" y="${y0 + pad}" width="${w - pad * 2}" height="${h}"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})"/>
      <text x="0" y="${y0 + pad + h + 40}" text-anchor="middle" font-size="28" font-weight="800" fill="#5a4a3a"
        font-family="${FONT}">${emoji} ${label}</text>
      <g class="c-check" display="none" transform="translate(${w / 2 - 14} ${y0 + 14})">
        <circle r="24" fill="#7fc164" stroke="#fff" stroke-width="4"/>
        <path d="M-10 0 l7 8 l13 -15" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
    </g></g></g>`;
}

/**
 * mountScenes(container, { onTopic(sceneId, topicId), isDone(sceneId, topicId) })
 * show(scene) takes a SCENES entry from index.html ({ id, topics: [{ id, label, emoji }] }).
 */
export function mountScenes(container, { onTopic, isDone }) {
  if (!document.getElementById('scenes-css')) {
    const st = document.createElement('style'); st.id = 'scenes-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  container.classList.add('sceneview', 'hidden');
  let current = null, busy = false, raf = 0;

  function show(scene) {
    if (!LAYOUT[scene.id]) return false;   // no backdrop -> caller falls back to the zone image
    current = scene; busy = false;
    container.innerHTML = `
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="s-vig" cx=".5" cy=".45" r=".75">
    <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient></defs>
  <image href="assets/scene_art/${scene.id}.jpg" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${W}" height="${H}" fill="url(#s-vig)"/>
  ${scene.topics.map((t, i) => card(scene.id, t.id, t.label, t.emoji, -i * 1.1)).join('')}
  <g class="avatar" pointer-events="none">
    <ellipse cx="0" cy="0" rx="42" ry="11" fill="#000" opacity=".2"/>
    <g class="av-body"><g class="av-flip"><image href="assets/boy_avatar.png" x="-50" y="-222" width="100" height="222"/></g></g>
  </g>
</svg><div class="flash"></div>`;
    const svg = container.querySelector('svg');
    svg.setAttribute('preserveAspectRatio', innerWidth / innerHeight < 1.25 ? 'xMidYMid meet' : 'xMidYMid slice');
    const avatar = svg.querySelector('.avatar'), avBody = svg.querySelector('.av-body'), avFlip = svg.querySelector('.av-flip');
    let pos = [...START];
    const put = (x, y, dx) => {
      pos = [x, y];
      avatar.setAttribute('transform', `translate(${x} ${y})`);
      if (dx) avFlip.setAttribute('transform', dx < 0 ? 'scale(-1 1)' : '');
    };
    put(...pos);
    function walkTo([tx, ty], done) {
      cancelAnimationFrame(raf);
      if (reduced) { put(tx, ty, tx - pos[0]); done(); return; }
      avBody.classList.add('step');
      let last = performance.now();
      const tick = (now) => {
        const step = 620 * Math.min(0.05, (now - last) / 1000); last = now;
        const dx = tx - pos[0], dy = ty - pos[1], d = Math.hypot(dx, dy);
        if (d <= step) { put(tx, ty, dx); avBody.classList.remove('step'); done(); return; }
        put(pos[0] + dx / d * step, pos[1] + dy / d * step, Math.abs(dx) > .5 ? dx : 0);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    svg.addEventListener('pointerdown', (e) => { const c = e.target.closest('.card'); if (c) c.classList.add('press'); });
    const unpress = () => svg.querySelectorAll('.card.press').forEach((c) => c.classList.remove('press'));
    svg.addEventListener('pointerup', unpress); svg.addEventListener('pointerleave', unpress);
    svg.addEventListener('click', (e) => {
      const c = e.target.closest('.card');
      if (!c || busy) return;
      busy = true;
      const id = c.dataset.topic, [sx] = SLOTS[LAYOUT[scene.id][id]];
      // Stop just beside the card's foot, so the card stays in view.
      walkTo([sx + (sx < 800 ? 150 : sx > 800 ? -150 : 160), 860], () => setTimeout(() => {
        busy = false;
        onTopic(scene.id, id);
        setTimeout(() => put(...START), 400);   // back in place for the next pick
      }, reduced ? 0 : 200));
    });
    refresh();
    container.classList.remove('hidden');
    const flash = container.querySelector('.flash');
    requestAnimationFrame(() => requestAnimationFrame(() => { flash.style.opacity = '0'; }));
    return true;
  }

  function refresh() {
    if (!current) return;
    container.querySelectorAll('.card').forEach((g) => {
      const done = isDone(current.id, g.dataset.topic);
      g.classList.toggle('done', done);
      g.querySelector('.c-check').setAttribute('display', done ? '' : 'none');
    });
  }

  return {
    show, refresh,
    showing: (id) => !!current && current.id === id,
    hide() { current = null; cancelAnimationFrame(raf); container.classList.add('hidden'); container.innerHTML = ''; },
  };
}
