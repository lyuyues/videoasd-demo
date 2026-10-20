/* Town overview map (2026-10-19).
 *
 * Replaces the static town_imagen.png backdrop + floating pills. The picture
 * (assets/scene_art/town.jpg) is generated with Gemini in the clips' own 3D look,
 * so the town, the scene close-ups (scenes.js) and the videos are one world. On
 * top of it: a name board with stars for each place, tap areas over the four
 * buildings, and the avatar. Tapping a place walks the avatar there along its
 * path, then zooms into it and hands off to index.html's enterScene(). Tapping
 * open grass just walks the avatar there.
 *
 * Coordinates are the image's own pixels (1200x896, 4:3 = the iPad). If the
 * picture is regenerated, re-trace PLACES against it.
 */

const W = 1200, H = 896;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FONT = `-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif`;

// door = where the avatar stops; sign = centre of the name board; zoom = zoom-in
// origin; hit = tap area over the building; road = the sandy path from the plaza.
const PLACES = {
  playground: { label: '游乐场', door: [445, 700], sign: [150, 432], zoom: [250, 600],
                hit: 'M0 560 L230 455 L505 575 L505 650 L190 785 L0 660 Z',
                road: 'M620 870 C 590 790, 530 735, 445 700' },
  classroom:  { label: '教室',   door: [420, 410], sign: [360, 62], zoom: [365, 300],
                hit: 'M200 80 H525 V415 H200 Z',
                road: 'M620 870 C 600 760, 560 640, 520 545 S 450 430, 420 410' },
  cafeteria:  { label: '餐厅',   door: [850, 432], sign: [862, 112], zoom: [860, 300],
                hit: 'M670 140 H1045 V445 H670 Z',
                road: 'M620 870 C 640 760, 690 640, 745 545 S 820 450, 850 432' },
  park:       { label: '公园',   door: [870, 735], sign: [1005, 548], zoom: [1020, 650],
                hit: 'M860 420 H1200 V770 H860 Z',
                road: 'M620 870 C 680 810, 790 760, 870 735' },
};
const HOME = [620, 860];

const CSS = `
.town { position: fixed; inset: 0; z-index: 3; overflow: hidden;
        background: linear-gradient(#9fcdf0 0 30%, #78b84e 30%);
        -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
.town.hidden { display: none; }
.town svg { position: relative; width: 100%; height: 100%; display: block; }
/* Behind the picture when the screen is wider than it (desktop): a soft blur of
   the same town instead of flat bars. */
.town .backdrop { position: absolute; inset: -40px; background: url('assets/scene_art/town.jpg') center / cover;
                  filter: blur(22px) saturate(1.1); opacity: .9; }
.town .world { transition: transform .65s cubic-bezier(.55,0,.35,1); }
.town .flash { position: absolute; inset: 0; background: #fffaf2; opacity: 0; pointer-events: none;
               transition: opacity .45s ease; }
.town .place { cursor: pointer; }
.town .sign .board { transition: transform .18s cubic-bezier(.3,1.6,.5,1); }
.town .sign.press .board { transform: scale(1.08); }
.town .sign.hop .board { animation: t-hop .5s cubic-bezier(.3,1.6,.5,1); }
.town .halo { opacity: 0; transition: opacity .25s; }
.town .halo.on { opacity: 1; }
.town .today-arrow { animation: t-arrow 1.1s ease-in-out infinite; }
.town .today-ring { animation: t-ring 1.8s ease-in-out infinite; }
.town .bird { animation: t-bird linear infinite; }
.town .wing { animation: t-wing .35s ease-in-out infinite alternate; }
.town .ripple { animation: t-ripple 3s ease-out infinite; opacity: 0; }
.town .step { animation: t-step .32s ease-in-out infinite alternate; }
@keyframes t-hop { 0%{transform:scale(1)} 40%{transform:scale(1.14,.9)} 70%{transform:scale(.96,1.06)} 100%{transform:scale(1)} }
@keyframes t-arrow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes t-ring { 0%,100%{opacity:.3; transform:scale(.92)} 50%{opacity:.7; transform:scale(1.06)} }
@keyframes t-bird { from{transform:translate(-150px,0)} to{transform:translate(1400px,-40px)} }
@keyframes t-wing { from{transform:scaleY(1)} to{transform:scaleY(-.6)} }
@keyframes t-ripple { 0%{opacity:.7; transform:scale(.3)} 100%{opacity:0; transform:scale(1.4)} }
@keyframes t-step { from{transform:translateY(0) rotate(-2deg)} to{transform:translateY(-6px) rotate(2deg)} }
@media (prefers-reduced-motion: reduce) {
  .town * { animation: none !important; }
  .town .world { transition: none; }
}
`;

const sign = (id, [x, y], label) => `
  <g class="sign place" data-place="${id}" transform="translate(${x} ${y}) scale(.8)">
    <g class="board">
      <path d="M-12 26 L0 42 L12 26 Z" fill="#b97a44"/>
      <rect x="-104" y="-30" width="208" height="60" rx="18" fill="#b97a44" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,.25))"/>
      <rect x="-98" y="-24" width="196" height="48" rx="14" fill="#eab878"/>
      <text x="-46" y="11" text-anchor="middle" font-size="29" font-weight="800" fill="#6a3f17" font-family="${FONT}">${label}</text>
      <rect x="8" y="-17" width="84" height="34" rx="17" fill="#fff" opacity=".95"/>
      <text class="stars" x="50" y="8" text-anchor="middle" font-size="20" fill="#ffb627" letter-spacing="2">☆☆☆</text>
    </g></g>`;

function svgMarkup() {
  return `
<div class="backdrop"></div>
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="t-halo"><stop offset="0" stop-color="#fff6c8" stop-opacity=".75"/>
    <stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
  <g class="world">
    <image href="assets/scene_art/town.jpg" x="0" y="0" width="${W}" height="${H}"/>
    <g class="bird" style="animation-duration:24s; animation-delay:-5s">
      ${[[0, 0], [30, 12], [-24, 16]].map(([dx, dy]) => `<g transform="translate(${dx} ${120 + dy})">
        <path class="wing" style="transform-origin:0px 0px" d="M-9 0 q4.5 -6 9 0 q4.5 -6 9 0" fill="none" stroke="#4e5866" stroke-width="2.5" stroke-linecap="round"/></g>`).join('')}
    </g>
    <ellipse class="ripple" style="transform-origin:985px 680px" cx="985" cy="680" rx="34" ry="10" fill="none" stroke="#fff" stroke-width="2.5"/>
    <ellipse class="ripple" style="transform-origin:1080px 650px; animation-delay:-1.5s" cx="1080" cy="650" rx="28" ry="8" fill="none" stroke="#fff" stroke-width="2.5"/>
    ${Object.entries(PLACES).map(([id, p]) => `<ellipse class="halo" data-halo="${id}" cx="${p.zoom[0]}" cy="${p.zoom[1]}" rx="230" ry="170" fill="url(#t-halo)" pointer-events="none"/>`).join('')}
    <g class="today-ring-wrap"></g>
    ${Object.entries(PLACES).map(([id, p]) => `<path class="place" data-place="${id}" d="${p.hit}" fill="transparent"/>`).join('')}
    ${Object.entries(PLACES).map(([id, p]) => sign(id, p.sign, p.label)).join('')}
    <g class="today-mark"></g>
    <g class="avatar" pointer-events="none">
      <ellipse cx="0" cy="0" rx="22" ry="7" fill="#000" opacity=".2"/>
      <g class="av-body"><g class="av-flip"><image href="assets/boy_avatar.png" x="-23" y="-102" width="46" height="102"/></g></g>
    </g>
    ${Object.entries(PLACES).map(([id, p]) => `<path class="route" data-route="${id}" d="${p.road}" fill="none" stroke="none"/>`).join('')}
  </g>
</svg>
<div class="flash"></div>`;
}

/**
 * mountTown(container, { onPick(id), starsFor(id) -> 0..3, maxStars })
 * Returns { refresh(today), show(), hide() }.
 */
export function mountTown(container, { onPick, starsFor, maxStars = 3 }) {
  if (!document.getElementById('town-css')) {
    const st = document.createElement('style'); st.id = 'town-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  container.classList.add('town');
  container.innerHTML = svgMarkup();
  const svg = container.querySelector('svg');
  // Up to ~3:2 the picture fills the screen (the iPad crops a sliver top and
  // bottom); wider or portrait screens see the whole town instead.
  const fit = () => {
    const a = innerWidth / innerHeight;
    svg.setAttribute('preserveAspectRatio', a < 1.2 || a > 1.55 ? 'xMidYMid meet' : 'xMidYMid slice');
  };
  fit(); addEventListener('resize', fit);
  const world = svg.querySelector('.world');
  const flash = container.querySelector('.flash');
  const avatar = svg.querySelector('.avatar');
  const avBody = svg.querySelector('.av-body');
  const avFlip = svg.querySelector('.av-flip');
  const routes = Object.fromEntries([...svg.querySelectorAll('.route')].map((p) => [p.dataset.route, p]));

  let pos = [...HOME], at = null, busy = false, raf = 0;

  function place(x, y, facing) {
    pos = [x, y];
    // Further up the picture = further away: shrink.
    const s = 0.62 + 0.45 * Math.min(1, Math.max(0, (y - 380) / 480));
    avatar.setAttribute('transform', `translate(${x} ${y}) scale(${s})`);
    if (facing) avFlip.setAttribute('transform', facing < 0 ? 'scale(-1 1)' : '');
  }
  place(...HOME);

  // Sample a route into points; reversed when walking back toward the plaza.
  function pts(id, back) {
    const p = routes[id], L = p.getTotalLength(), out = [];
    for (let d = 0; d <= L; d += 5) { const q = p.getPointAtLength(d); out.push([q.x, q.y]); }
    out.push(PLACES[id].door);
    return back ? out.reverse() : out;
  }
  function walk(points, done) {
    cancelAnimationFrame(raf);
    if (reduced) { place(...points[points.length - 1]); done && done(); return; }
    avBody.classList.add('step');
    const SPEED = 420;                  // image px per second
    let i = 0, last = performance.now(), from = [...pos];
    const tick = (now) => {
      let budget = SPEED * Math.min(0.05, (now - last) / 1000); last = now;
      while (budget > 0 && i < points.length) {
        const [tx, ty] = points[i], dx = tx - from[0], dy = ty - from[1], d = Math.hypot(dx, dy);
        if (d <= budget) { from = [tx, ty]; budget -= d; i++; }
        else { from = [from[0] + dx / d * budget, from[1] + dy / d * budget]; budget = 0; }
        place(from[0], from[1], Math.abs(dx) > 0.5 ? dx : 0);
      }
      if (i < points.length) raf = requestAnimationFrame(tick);
      else { avBody.classList.remove('step'); done && done(); }
    };
    raf = requestAnimationFrame(tick);
  }

  function go(id) {
    if (busy) return;
    busy = true;
    const s = svg.querySelector(`.sign[data-place="${id}"]`);
    s.classList.remove('hop'); void s.getBBox(); s.classList.add('hop');
    const halo = svg.querySelector(`[data-halo="${id}"]`);
    halo.classList.add('on');
    const path = [];
    if (at && at !== id) path.push(...pts(at, true));
    else if (!at) path.push(HOME);
    if (at !== id) path.push(...pts(id, false));
    walk(path, () => {
      at = id;
      const [zx, zy] = PLACES[id].zoom;
      world.style.transformOrigin = `${zx}px ${zy}px`;
      world.style.transform = 'scale(2.6)';
      flash.style.opacity = '1';
      setTimeout(() => { busy = false; halo.classList.remove('on'); onPick(id); }, reduced ? 0 : 620);
    });
  }

  // A press lights the place up, whether the finger lands on its board or its building.
  const lit = (id, on) => {
    svg.querySelector(`.sign[data-place="${id}"]`).classList.toggle('press', on);
    if (!busy) svg.querySelector(`[data-halo="${id}"]`).classList.toggle('on', on);
  };
  svg.addEventListener('pointerdown', (e) => {
    const p = e.target.closest('.place');
    if (p) lit(p.dataset.place, true);
  });
  const unpress = () => Object.keys(PLACES).forEach((id) => lit(id, false));
  svg.addEventListener('pointerup', unpress);
  svg.addEventListener('pointerleave', unpress);
  svg.addEventListener('click', (e) => {
    const p = e.target.closest('.place');
    if (p) { go(p.dataset.place); return; }
    if (busy) return;
    // Open grass: just stroll there (never into the sky).
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    if (q.y < 380) return;
    at = null;
    walk([[Math.max(40, Math.min(W - 40, q.x)), Math.min(H - 20, q.y)]]);
  });

  function refresh(today) {
    Object.keys(PLACES).forEach((id) => {
      const n = Math.min(maxStars, starsFor(id));
      const t = svg.querySelector(`.sign[data-place="${id}"] .stars`);
      t.textContent = '★'.repeat(n) + '☆'.repeat(maxStars - n);
      t.setAttribute('fill', n >= maxStars ? '#6bb34a' : '#ffb627');
    });
    // "Start here" marker over the suggested place -- a hint, never a lock.
    const mark = svg.querySelector('.today-mark'), ring = svg.querySelector('.today-ring-wrap');
    mark.innerHTML = ring.innerHTML = '';
    const p = today && PLACES[today];
    if (!p) return;
    const [x, y] = p.sign;
    mark.innerHTML = `<g class="today-arrow">
      <path d="M${x - 11} ${y - 50} v-20 h22 v20 h12 l-23 22 l-23 -22 z" fill="#ff8a3d" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/></g>`;
    const [dx, dy] = p.door;
    ring.innerHTML = `<ellipse class="today-ring" style="transform-origin:${dx}px ${dy}px" cx="${dx}" cy="${dy}" rx="54" ry="17"
      fill="none" stroke="#ff9d3f" stroke-width="5"/>`;
  }

  return {
    refresh,
    hide() { container.classList.add('hidden'); },
    show() {
      container.classList.remove('hidden');
      // Zoom back out from wherever we went in.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        world.style.transform = '';
        flash.style.opacity = '0';
      }));
    },
  };
}
