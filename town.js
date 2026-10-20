/* Town overview map (2026-10-19).
 *
 * Replaces the static town_imagen.png backdrop + floating pills with one drawn,
 * full-bleed town the child can play with: the four study places each have their
 * own building (swings, school bell, café chimney, park pond), a wooden sign with
 * that place's stars, and gentle ambient motion. Tapping a place walks the avatar
 * there along the road, then zooms into it and hands off to index.html's
 * enterScene(). Tapping open grass just walks the avatar there.
 *
 * Drawn in a 1600x1000 viewBox with `slice`, so it always fills the screen. The
 * iPad (4:3) crops the sides to x≈133..1467 -- keep everything that matters inside.
 */

const W = 1600, H = 1000;
const NS = 'http://www.w3.org/2000/svg';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Door = where the avatar stops. sign = centre of the name board above the place. road = path from the plaza.
const PLACES = {
  playground: { label: '游乐场', door: [395, 728], sign: [330, 520], zoom: [330, 650],
                road: 'M800 800 C 660 830, 500 790, 395 728' },
  classroom:  { label: '教室',   door: [560, 548], sign: [560, 172], zoom: [560, 430],
                road: 'M800 800 C 770 700, 590 660, 560 548' },
  cafeteria:  { label: '餐厅',   door: [1110, 548], sign: [1000, 284], zoom: [1070, 440],
                road: 'M800 800 C 830 700, 1080 660, 1110 548' },
  park:       { label: '公园',   door: [1215, 742], sign: [1300, 515], zoom: [1290, 670],
                road: 'M800 800 C 950 835, 1110 800, 1215 742' },
};
const HOME = [800, 800];

const CSS = `
.town { position: fixed; inset: 0; z-index: 3; overflow: hidden;
        background: linear-gradient(#86c5f2 0 45%, #8bc65b 45%);
        -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
.town.hidden { display: none; }
.town svg { width: 100%; height: 100%; display: block; }
.town .world { transition: transform .65s cubic-bezier(.55,0,.35,1); }
.town .flash { position: absolute; inset: 0; background: #fffaf2; opacity: 0; pointer-events: none;
               transition: opacity .45s ease; }
.town .place { cursor: pointer; }
.town .place .bump { transition: transform .18s cubic-bezier(.3,1.6,.5,1); }
.town .place.press .bump { transform: scale(1.06); }
.town .place.hop .bump { animation: t-hop .5s cubic-bezier(.3,1.6,.5,1); }
.town .sign .board { transition: transform .15s; }
.town .today-arrow { animation: t-arrow 1.1s ease-in-out infinite; }
.town .today-ring { animation: t-ring 1.8s ease-in-out infinite; }
.town .cloud { animation: t-cloud linear infinite; }
.town .sway { animation: t-sway 3.6s ease-in-out infinite; }
.town .swing { animation: t-swing 2.4s ease-in-out infinite; }
.town .flag { animation: t-flag 1.4s ease-in-out infinite; }
.town .puff { animation: t-puff 3.2s ease-out infinite; opacity: 0; }
.town .duck { animation: t-bob 2.2s ease-in-out infinite; }
.town .ripple { animation: t-ripple 3s ease-out infinite; opacity: 0; }
.town .rays { animation: t-spin 40s linear infinite; }
.town .bird { animation: t-bird linear infinite; }
.town .wing { animation: t-wing .35s ease-in-out infinite alternate; }
.town .flutter { animation: t-flutter 7s ease-in-out infinite; }
.town .minute { animation: t-spin 20s linear infinite; }
.town .step { animation: t-step .32s ease-in-out infinite alternate; }
@keyframes t-hop { 0%{transform:scale(1)} 40%{transform:scale(1.1,.93)} 70%{transform:scale(.97,1.05)} 100%{transform:scale(1)} }
@keyframes t-arrow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
@keyframes t-ring { 0%,100%{opacity:.25; transform:scale(.92)} 50%{opacity:.6; transform:scale(1.05)} }
@keyframes t-cloud { from{transform:translateX(-420px)} to{transform:translateX(2000px)} }
@keyframes t-sway { 0%,100%{transform:rotate(-1.6deg)} 50%{transform:rotate(1.6deg)} }
@keyframes t-swing { 0%,100%{transform:rotate(-16deg)} 50%{transform:rotate(16deg)} }
@keyframes t-flag { 0%,100%{transform:skewY(0) scaleX(1)} 50%{transform:skewY(-5deg) scaleX(.9)} }
@keyframes t-puff { 0%{opacity:0; transform:translate(0,0) scale(.5)} 15%{opacity:.85} 100%{opacity:0; transform:translate(18px,-90px) scale(1.6)} }
@keyframes t-bob { 0%,100%{transform:translate(0,0) rotate(-3deg)} 50%{transform:translate(10px,-4px) rotate(3deg)} }
@keyframes t-ripple { 0%{opacity:.7; transform:scale(.3)} 100%{opacity:0; transform:scale(1.4)} }
@keyframes t-spin { to{transform:rotate(360deg)} }
@keyframes t-bird { from{transform:translate(-200px,0)} to{transform:translate(1900px,-60px)} }
@keyframes t-wing { from{transform:scaleY(1)} to{transform:scaleY(-.6)} }
@keyframes t-flutter { 0%,100%{transform:translate(0,0)} 25%{transform:translate(40px,-25px)} 50%{transform:translate(70px,5px)} 75%{transform:translate(25px,20px)} }
@keyframes t-step { from{transform:translateY(0) rotate(-2deg)} to{transform:translateY(-7px) rotate(2deg)} }
@media (prefers-reduced-motion: reduce) {
  .town * { animation: none !important; }
  .town .world { transition: none; }
}
`;

/* ---------- drawing helpers (all return SVG markup) ---------- */
export const cloud = (x, y, s, dur, delay) => `
  <g class="cloud" style="animation-duration:${dur}s; animation-delay:${delay}s">
    <g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".95">
      <ellipse cx="0" cy="18" rx="78" ry="22"/><circle cx="-36" cy="6" r="30"/>
      <circle cx="4" cy="-8" r="40"/><circle cx="42" cy="6" r="28"/>
    </g></g>`;

export const tree = (x, y, s = 1, hue = 0, delay = 0) => {
  const greens = [['#6dbb4f', '#86cf62', '#a5df7f'], ['#5daa47', '#77c25a', '#98d673'], ['#7cc35a', '#93d36c', '#b3e48c']][hue];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="4" rx="44" ry="11" fill="#000" opacity=".12"/>
    <rect x="-8" y="-58" width="16" height="62" rx="6" fill="#a9724a"/>
    <g class="sway" style="transform-origin:0px 0px; animation-delay:${delay}s">
      <circle cx="0" cy="-92" r="48" fill="${greens[0]}"/>
      <circle cx="-22" cy="-108" r="30" fill="${greens[1]}"/>
      <circle cx="18" cy="-118" r="26" fill="${greens[1]}"/>
      <circle cx="-8" cy="-122" r="14" fill="${greens[2]}"/>
    </g></g>`;
};

export const flower = (x, y, c) => `<g transform="translate(${x} ${y})">
  <line x1="0" y1="0" x2="0" y2="-12" stroke="#5c9e3e" stroke-width="2"/>
  <circle cx="0" cy="-15" r="5" fill="${c}"/><circle cx="0" cy="-15" r="2" fill="#ffe27a"/></g>`;

export const tuft = (x, y) => `<path d="M${x - 9} ${y} q4 -14 6 -2 q3 -16 6 0 q4 -12 6 2" fill="none"
  stroke="#7cbd52" stroke-width="3" stroke-linecap="round"/>`;

// Deterministic scatter so the meadow looks the same every visit.
export function scatter(n, seed, fn) {
  let s = seed, out = '';
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) out += fn(rnd(), rnd(), rnd(), i);
  return out;
}

const sign = (id, [x, y], label) => `
  <g class="sign place" data-place="${id}" transform="translate(${x} ${y})">
    <path d="M-12 26 L0 42 L12 26 Z" fill="#b97a44"/>
    <rect x="-104" y="-30" width="208" height="60" rx="18" fill="#b97a44"/>
    <rect x="-98" y="-24" width="196" height="48" rx="14" fill="#eab878"/>
    <text x="-46" y="11" text-anchor="middle" font-size="29" font-weight="800" fill="#6a3f17"
      font-family="-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif">${label}</text>
    <rect x="8" y="-17" width="84" height="34" rx="17" fill="#fff" opacity=".95"/>
    <text class="stars" x="50" y="8" text-anchor="middle" font-size="20" fill="#ffb627" letter-spacing="2">☆☆☆</text>
  </g>`;

/* ---------- the four places ---------- */
const playground = () => `
  <g class="place" data-place="playground"><g class="bump" style="transform-origin:330px 700px">
    <ellipse cx="330" cy="700" rx="210" ry="74" fill="#f3dca9"/>
    <ellipse cx="330" cy="700" rx="196" ry="66" fill="#f7e5bb"/>
    <!-- swing set -->
    <g stroke="#3f9bb3" stroke-width="9" stroke-linecap="round" fill="none">
      <path d="M180 700 L215 575 L250 700"/>
      <path d="M315 700 L340 575 L365 700"/><line x1="215" y1="577" x2="340" y2="577"/>
    </g>
    <g class="swing" style="transform-origin:250px 578px">
      <line x1="238" y1="578" x2="238" y2="655" stroke="#7d6a5a" stroke-width="3"/>
      <line x1="262" y1="578" x2="262" y2="655" stroke="#7d6a5a" stroke-width="3"/>
      <rect x="230" y="652" width="40" height="9" rx="4" fill="#f0743e"/></g>
    <g class="swing" style="transform-origin:305px 578px; animation-delay:-1.2s">
      <line x1="293" y1="578" x2="293" y2="655" stroke="#7d6a5a" stroke-width="3"/>
      <line x1="317" y1="578" x2="317" y2="655" stroke="#7d6a5a" stroke-width="3"/>
      <rect x="285" y="652" width="40" height="9" rx="4" fill="#ffc53d"/></g>
    <!-- slide -->
    <rect x="404" y="590" width="8" height="112" fill="#e3604c"/><rect x="438" y="590" width="8" height="112" fill="#e3604c"/>
    <g stroke="#e3604c" stroke-width="5">${[610, 632, 654, 676].map((y) => `<line x1="408" y1="${y}" x2="442" y2="${y}"/>`).join('')}</g>
    <rect x="398" y="582" width="54" height="14" rx="5" fill="#ffb84d"/>
    <path d="M446 590 C 488 600, 488 680, 540 694 L 540 712 C 480 700, 474 616, 446 610 Z" fill="#ff8f4a"/>
    <!-- sandbox -->
    <rect x="198" y="718" width="96" height="40" rx="10" fill="#c98c55"/>
    <rect x="206" y="724" width="80" height="28" rx="7" fill="#ffe3a3"/>
    <path d="M226 742 l12 -12 l12 12 z" fill="#ff7c7c"/><circle cx="268" cy="740" r="6" fill="#5fb3e8"/>
    <!-- fence -->
    <g fill="#f4efe6" stroke="#d8c8ae" stroke-width="2">${scatter(13, 7, (a, b, c, i) =>
      `<rect x="${150 + i * 30}" y="${756 + Math.sin(i / 2) * 6}" width="14" height="34" rx="5"/>`)}</g>
    <rect x="148" y="768" width="386" height="7" rx="3" fill="#e7dccb"/>
    <rect x="148" y="768" width="386" height="7" rx="3" fill="#e7dccb" transform="translate(0 12)"/>
  </g></g>`;

const classroom = () => `
  <g class="place" data-place="classroom"><g class="bump" style="transform-origin:560px 540px">
    <ellipse cx="560" cy="540" rx="170" ry="26" fill="#000" opacity=".12"/>
    <!-- flag -->
    <line x1="712" y1="540" x2="712" y2="318" stroke="#9aa3ad" stroke-width="5"/>
    <circle cx="712" cy="316" r="6" fill="#ffd34d"/>
    <path class="flag" style="transform-origin:714px 335px" d="M714 324 q30 -10 60 4 v40 q-30 -14 -60 -4 z" fill="#ff6b5a"/>
    <!-- body -->
    <rect x="432" y="378" width="256" height="160" rx="10" fill="#fbe5ba"/>
    <rect x="432" y="510" width="256" height="28" fill="#e9c993"/>
    <!-- roof -->
    <path d="M412 388 L560 300 L708 388 Z" fill="#4f7fd1"/>
    <path d="M412 388 L560 300 L708 388" fill="none" stroke="#3d68b4" stroke-width="10" stroke-linejoin="round"/>
    <!-- bell tower -->
    <rect x="532" y="250" width="56" height="62" rx="4" fill="#fbe5ba"/>
    <path d="M522 256 L560 214 L598 256 Z" fill="#4f7fd1"/>
    <path d="M547 268 h26 v34 h-26 z" fill="#7a5537"/>
    <path d="M551 292 q9 -26 18 0 z" fill="#ffc93d"/>
    <!-- clock -->
    <circle cx="560" cy="350" r="22" fill="#fff" stroke="#3d68b4" stroke-width="4"/>
    <line x1="560" y1="350" x2="560" y2="337" stroke="#4a4a55" stroke-width="3" stroke-linecap="round"/>
    <line class="minute" style="transform-origin:560px 350px" x1="560" y1="350" x2="571" y2="350"
      stroke="#e8604c" stroke-width="3" stroke-linecap="round"/>
    <!-- windows + door -->
    ${[455, 515, 605, 665].map((x) => `<rect x="${x - 22}" y="410" width="44" height="40" rx="6" fill="#bfe3ff" stroke="#fff" stroke-width="4"/>
      <line x1="${x}" y1="412" x2="${x}" y2="448" stroke="#fff" stroke-width="3"/>`).join('')}
    ${[455, 665].map((x) => `<rect x="${x - 22}" y="466" width="44" height="36" rx="6" fill="#bfe3ff" stroke="#fff" stroke-width="4"/>`).join('')}
    <path d="M530 538 v-52 a30 30 0 0 1 60 0 v52 z" fill="#b5713f"/>
    <circle cx="578" cy="512" r="4" fill="#ffd34d"/>
    <rect x="502" y="470" width="20" height="26" rx="3" fill="#7fc164"/><rect x="598" y="470" width="20" height="26" rx="3" fill="#ff9d6a"/>
  </g></g>`;

const cafeteria = () => `
  <g class="place" data-place="cafeteria"><g class="bump" style="transform-origin:1070px 540px">
    <ellipse cx="1080" cy="540" rx="190" ry="26" fill="#000" opacity=".12"/>
    <!-- chimney + steam -->
    <rect x="1128" y="292" width="30" height="60" fill="#c7695a"/><rect x="1122" y="286" width="42" height="12" rx="3" fill="#a9564a"/>
    ${[0, 1.05, 2.1].map((d) => `<circle class="puff" style="transform-origin:1143px 278px; animation-delay:${d}s" cx="1143" cy="278" r="14" fill="#fff"/>`).join('')}
    <!-- body -->
    <rect x="952" y="388" width="236" height="150" rx="10" fill="#fff1dc"/>
    <rect x="952" y="514" width="236" height="24" fill="#f0d3ae"/>
    <!-- roof -->
    <path d="M934 396 L968 326 L1172 326 L1206 396 Z" fill="#e8665a"/>
    <path d="M934 396 L1206 396" stroke="#c94f45" stroke-width="10" stroke-linecap="round"/>
    <rect x="1010" y="340" width="120" height="40" rx="10" fill="#fff8ee"/>
    <text x="1070" y="370" text-anchor="middle" font-size="24">🍽️</text>
    <!-- awning + big window -->
    <rect x="968" y="452" width="110" height="62" rx="6" fill="#bfe3ff" stroke="#fff" stroke-width="4"/>
    <line x1="1023" y1="454" x2="1023" y2="512" stroke="#fff" stroke-width="3"/>
    <g>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${962 + i * 21} 424 h21 v20 a10.5 10.5 0 0 1 -21 0 z" fill="${i % 2 ? '#fff' : '#ff6b5a'}"/>`).join('')}</g>
    <!-- door -->
    <path d="M1096 538 v-56 a22 22 0 0 1 44 0 v56 z" fill="#4fa27a"/>
    <circle cx="1130" cy="512" r="4" fill="#ffd34d"/>
    <!-- menu board -->
    <path d="M1160 540 L1172 492 L1196 492 L1208 540" fill="none" stroke="#8a6a52" stroke-width="4"/>
    <rect x="1164" y="488" width="40" height="34" rx="4" fill="#4a5a52" stroke="#8a6a52" stroke-width="3"/>
    <line x1="1172" y1="499" x2="1196" y2="499" stroke="#fff" stroke-width="2"/><line x1="1172" y1="508" x2="1190" y2="508" stroke="#fff" stroke-width="2"/>
  </g></g>`;

const park = () => `
  <g class="place" data-place="park"><g class="bump" style="transform-origin:1290px 700px">
    <ellipse cx="1290" cy="712" rx="215" ry="76" fill="#8cc95f"/>
    ${tree(1195, 660, 0.85, 0, 0)}${tree(1300, 638, 1.0, 1, -1.3)}${tree(1408, 668, 0.85, 2, -2.1)}
    <!-- pond -->
    <ellipse cx="1310" cy="728" rx="118" ry="38" fill="#7ec8f0"/>
    <ellipse cx="1310" cy="724" rx="104" ry="30" fill="#a2dcf8"/>
    <ellipse class="ripple" style="transform-origin:1350px 728px" cx="1350" cy="728" rx="26" ry="8" fill="none" stroke="#fff" stroke-width="2"/>
    <ellipse class="ripple" style="transform-origin:1268px 722px; animation-delay:-1.5s" cx="1268" cy="722" rx="22" ry="7" fill="none" stroke="#fff" stroke-width="2"/>
    <ellipse cx="1240" cy="736" rx="16" ry="6" fill="#5fae4a"/><circle cx="1240" cy="733" r="3" fill="#ff9ec2"/>
    <g class="duck" style="transform-origin:1320px 722px">
      <ellipse cx="1320" cy="722" rx="20" ry="12" fill="#ffd84d"/><circle cx="1334" cy="706" r="10" fill="#ffd84d"/>
      <path d="M1342 706 l10 3 l-10 3 z" fill="#ff8f3a"/><circle cx="1336" cy="703" r="2" fill="#333"/>
    </g>
    <!-- bench -->
    <rect x="1140" y="736" width="70" height="10" rx="4" fill="#c98d5a"/>
    <rect x="1140" y="718" width="70" height="9" rx="4" fill="#b67b4a"/>
    <rect x="1146" y="744" width="6" height="18" fill="#8d6040"/><rect x="1198" y="744" width="6" height="18" fill="#8d6040"/>
    ${[[1430, 760, '#ff8fb1'], [1446, 770, '#ffd34d'], [1418, 774, '#c99bff'], [1178, 776, '#ff8fb1'], [1196, 784, '#ffd34d']]
      .map(([x, y, c]) => flower(x, y, c)).join('')}
    <g class="flutter" style="animation-delay:-2s"><g transform="translate(1380 660)">
      <path class="wing" style="transform-origin:0px 0px" d="M0 0 q-12 -14 -16 0 q4 10 16 0 q12 -14 16 0 q-4 10 -16 0" fill="#ff9ec2"/></g></g>
  </g></g>`;

function svgMarkup() {
  return `
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="${NS}">
  <defs>
    <linearGradient id="t-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#86c5f2"/><stop offset=".45" stop-color="#cfeafb"/><stop offset="1" stop-color="#eaf7ff"/></linearGradient>
    <linearGradient id="t-grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8d977"/><stop offset="1" stop-color="#8bc65b"/></linearGradient>
    <radialGradient id="t-sun"><stop offset="0" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffd24d" stop-opacity="0"/></radialGradient>
  </defs>
  <g class="world">
    <rect width="${W}" height="${H}" fill="url(#t-sky)"/>
    <g transform="translate(1370 120)">
      <circle r="120" fill="url(#t-sun)"/>
      <g class="rays" style="transform-origin:0px 0px">${scatter(12, 1, (a, b, c, i) =>
        `<rect x="-5" y="-108" width="10" height="26" rx="5" fill="#ffd24d" opacity=".6" transform="rotate(${i * 30})"/>`)}</g>
      <circle r="58" fill="#ffd24d"/><circle cx="-18" cy="-6" r="5" fill="#a86b1c"/><circle cx="18" cy="-6" r="5" fill="#a86b1c"/>
      <path d="M-16 14 q16 14 32 0" fill="none" stroke="#a86b1c" stroke-width="4" stroke-linecap="round"/>
      <circle cx="-32" cy="10" r="8" fill="#ffaf6b" opacity=".6"/><circle cx="32" cy="10" r="8" fill="#ffaf6b" opacity=".6"/>
    </g>
    ${cloud(0, 110, 1.1, 95, -20)}${cloud(0, 200, 0.75, 120, -75)}${cloud(0, 70, 0.6, 80, -50)}${cloud(0, 250, 0.9, 140, -110)}
    <g class="bird" style="animation-duration:26s; animation-delay:-6s">
      ${[[0, 0], [34, 14], [-26, 18]].map(([dx, dy]) => `<g transform="translate(${dx} ${180 + dy})">
        <path class="wing" style="transform-origin:0px 0px" d="M-10 0 q5 -6 10 0 q5 -6 10 0" fill="none" stroke="#56606e" stroke-width="2.5" stroke-linecap="round"/></g>`).join('')}
    </g>
    <!-- hills -->
    <path d="M0 380 Q 240 270 520 352 T 1060 338 T 1600 330 V 560 H 0 Z" fill="#c2e59a"/>
    ${scatter(9, 3, (a, b, c, i) => { const x = 60 + i * 180 + a * 60; return `<g transform="translate(${x} ${360 - Math.sin(x / 260) * 22}) scale(.32)" opacity=".85">
      <rect x="-8" y="-40" width="16" height="44" fill="#9a7452"/><circle cy="-70" r="44" fill="#88c766"/></g>`; })}
    <path d="M0 450 Q 300 372 660 430 T 1300 410 T 1600 424 V 1000 H 0 Z" fill="url(#t-grass)"/>
    ${scatter(70, 11, (a, b) => tuft(40 + a * 1520, 470 + b * 510))}
    ${scatter(26, 23, (a, b, c) => flower(60 + a * 1480, 480 + b * 500, ['#fff', '#ffd34d', '#ff9ec2', '#c99bff'][Math.floor(c * 4)]))}
    <!-- roads -->
    <g fill="none" stroke-linecap="round">
      <path d="M560 548 Q 835 600 1110 548" stroke="#e3c48c" stroke-width="58"/>
      ${Object.values(PLACES).map((p) => `<path d="${p.road}" stroke="#e3c48c" stroke-width="58"/>`).join('')}
      <path d="M560 548 Q 835 600 1110 548" stroke="#f4dfb1" stroke-width="44"/>
      ${Object.values(PLACES).map((p) => `<path d="${p.road}" stroke="#f4dfb1" stroke-width="44"/>`).join('')}
    </g>
    <ellipse cx="800" cy="806" rx="120" ry="44" fill="#e3c48c"/><ellipse cx="800" cy="802" rx="108" ry="36" fill="#f4dfb1"/>
    ${scatter(14, 5, (a, b) => `<ellipse cx="${730 + a * 140}" cy="${786 + b * 34}" rx="7" ry="3" fill="#e8cd98"/>`)}
    <!-- back-row trees, then places back to front -->
    ${tree(250, 470, 0.8, 1, -.7)}${tree(820, 440, 0.7, 0, -1.9)}${tree(1478, 486, 0.85, 2, -2.6)}${tree(150, 590, 0.7, 0, -1.1)}
    <g class="today-ring-wrap"></g>
    ${classroom()}${cafeteria()}${playground()}${park()}
    ${tree(640, 900, 0.85, 1, -.4)}${tree(1010, 920, 0.8, 2, -1.6)}
    ${Object.entries(PLACES).map(([id, p]) => sign(id, p.sign, p.label)).join('')}
    <g class="today-mark"></g>
    <!-- avatar -->
    <g class="avatar" pointer-events="none">
      <ellipse class="av-shadow" cx="0" cy="0" rx="26" ry="8" fill="#000" opacity=".16"/>
      <g class="av-body"><g class="av-flip"><image href="assets/boy_avatar.png" x="-27" y="-120" width="54" height="120"/></g></g>
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
  const world = svg.querySelector('.world');
  const flash = container.querySelector('.flash');
  const avatar = svg.querySelector('.avatar');
  const avBody = svg.querySelector('.av-body');
  const avFlip = svg.querySelector('.av-flip');
  // Landscape fills the screen (slice). A portrait iPad would crop the playground
  // and the park off the sides, so there the whole town is shown instead (meet).
  const fit = () => svg.setAttribute('preserveAspectRatio',
    innerWidth / innerHeight < 1.25 ? 'xMidYMid meet' : 'xMidYMid slice');
  fit(); addEventListener('resize', fit);
  const routes = Object.fromEntries([...svg.querySelectorAll('.route')].map((p) => [p.dataset.route, p]));

  let pos = [...HOME], at = null, busy = false, raf = 0;

  function place(x, y, facing) {
    pos = [x, y];
    // Further up the screen = further away: shrink a little.
    const s = 0.72 + 0.38 * Math.min(1, Math.max(0, (y - 480) / 380));
    avatar.setAttribute('transform', `translate(${x} ${y}) scale(${s})`);
    if (facing) avFlip.setAttribute('transform', facing < 0 ? 'scale(-1 1)' : '');
  }
  place(...HOME);

  // Sample a route into points; reverse it when walking back toward the plaza.
  function pts(id, back) {
    const p = routes[id], L = p.getTotalLength(), out = [];
    for (let d = 0; d <= L; d += 6) { const q = p.getPointAtLength(d); out.push([q.x, q.y]); }
    out.push(PLACES[id].door);
    return back ? out.reverse() : out;
  }
  function walk(points, done) {
    cancelAnimationFrame(raf);
    if (reduced) { place(...points[points.length - 1]); done && done(); return; }
    avBody.classList.add('step');
    const SPEED = 520;                  // viewBox units per second
    let i = 0, last = performance.now(), from = [...pos];
    const tick = (now) => {
      let budget = SPEED * Math.min(0.05, (now - last) / 1000); last = now;
      while (budget > 0 && i < points.length) {
        const [tx, ty] = points[i], dx = tx - from[0], dy = ty - from[1], d = Math.hypot(dx, dy);
        if (d <= budget) { from = [tx, ty]; budget -= d; i++; }
        else { from = [from[0] + dx / d * budget, from[1] + dy / d * budget]; budget = 0; }
        if (Math.abs(dx) > 0.5) place(from[0], from[1], dx); else place(from[0], from[1]);
      }
      if (i < points.length) raf = requestAnimationFrame(tick);
      else { avBody.classList.remove('step'); done && done(); }
    };
    raf = requestAnimationFrame(tick);
  }

  function go(id) {
    if (busy) return;
    busy = true;
    const g = svg.querySelector(`.place[data-place="${id}"]:not(.sign)`);
    g.classList.remove('hop'); void g.getBBox(); g.classList.add('hop');
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
      setTimeout(() => { busy = false; onPick(id); }, reduced ? 0 : 620);
    });
  }

  svg.addEventListener('pointerdown', (e) => {
    const p = e.target.closest('.place');
    if (p) p.classList.add('press');
  });
  const unpress = () => svg.querySelectorAll('.place.press').forEach((p) => p.classList.remove('press'));
  svg.addEventListener('pointerup', unpress);
  svg.addEventListener('pointerleave', unpress);
  svg.addEventListener('click', (e) => {
    const p = e.target.closest('.place');
    if (p) { go(p.dataset.place); return; }
    if (busy) return;
    // Open grass: just stroll there (never into the sky or off the meadow).
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    if (q.y < 470) return;
    at = null;
    walk([[Math.max(160, Math.min(1440, q.x)), Math.min(960, q.y)]]);
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
      <path d="M${x - 14} ${y - 62} v-24 h28 v24 h14 l-28 26 l-28 -26 z" fill="#ff8a3d" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></g>`;
    const [dx, dy] = p.door;
    ring.innerHTML = `<ellipse class="today-ring" style="transform-origin:${dx}px ${dy}px" cx="${dx}" cy="${dy}" rx="70" ry="22"
      fill="#ffb15c" opacity=".4"/>`;
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
