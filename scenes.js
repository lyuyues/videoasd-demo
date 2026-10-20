/* Scene close-ups (2026-10-19), drawn in the same style as town.js.
 *
 * Replaces the small floating zone renders (assets/zones/*.png) behind the topic
 * circles. Each place is a full-bleed picture with the children each topic is
 * about already in it -- a kid alone in the sandbox (交朋友), two kids playing
 * together (加入活动), a sad kid (安慰朋友) -- and the topic marker sits over
 * them. Tapping a marker walks the avatar over, then index.html opens that round.
 *
 * Same 1600x1000 viewBox / slice framing as the town, so keep content inside
 * x≈140..1460 for the 4:3 iPad.
 */
import { cloud, tree, flower, tuft, scatter } from './town.js?v=20261019';

const W = 1600, H = 1000;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FONT = `-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif`;

const CSS = `
.sceneview { position: fixed; inset: 0; z-index: 3; overflow: hidden;
             background: linear-gradient(#86c5f2 0 45%, #8bc65b 45%);
             -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
.sceneview.hidden { display: none; }
.sceneview svg { width: 100%; height: 100%; display: block; }
.sceneview .flash { position: absolute; inset: 0; background: #fffaf2; opacity: 1; pointer-events: none;
                    transition: opacity .5s ease; }
.sceneview .topic { cursor: pointer; }
.sceneview .topic .t-ring { animation: s-pulse 2.2s ease-in-out infinite; }
.sceneview .topic .t-bump { transition: transform .18s cubic-bezier(.3,1.6,.5,1); }
.sceneview .topic.press .t-bump { transform: scale(1.1); }
.sceneview .topic.done .t-ring { animation: none; }
.sceneview .topic.done { opacity: .8; }
.sceneview .kid-idle { animation: s-idle 2.6s ease-in-out infinite; }
.sceneview .sway { animation: t-sway 3.6s ease-in-out infinite; }
.sceneview .cloud { animation: t-cloud linear infinite; }
.sceneview .swing { animation: t-swing 2.6s ease-in-out infinite; }
.sceneview .ball { animation: s-ball 1.6s ease-in-out infinite; }
.sceneview .tear { animation: s-tear 2s ease-in infinite; }
.sceneview .kite { animation: s-kite 4s ease-in-out infinite; }
.sceneview .steam { animation: t-puff 3s ease-out infinite; opacity: 0; }
.sceneview .duck { animation: t-bob 2.2s ease-in-out infinite; }
.sceneview .ripple { animation: t-ripple 3s ease-out infinite; opacity: 0; }
.sceneview .minute { animation: t-spin 20s linear infinite; }
.sceneview .lamp { animation: s-lamp 4s ease-in-out infinite; }
.sceneview .step { animation: t-step .32s ease-in-out infinite alternate; }
@keyframes s-pulse { 0%,100%{transform:scale(1); opacity:.9} 50%{transform:scale(1.18); opacity:.35} }
@keyframes s-idle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes s-ball { 0%,100%{transform:translate(0,0)} 50%{transform:translate(110px,-70px)} }
@keyframes s-tear { 0%{opacity:0; transform:translateY(0)} 20%{opacity:1} 100%{opacity:0; transform:translateY(26px)} }
@keyframes s-kite { 0%,100%{transform:translate(0,0) rotate(-6deg)} 50%{transform:translate(30px,-20px) rotate(6deg)} }
@keyframes s-lamp { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
@media (prefers-reduced-motion: reduce) { .sceneview * { animation: none !important; } }
`;

/* ---------- a child, feet at (x, y) ---------- */
// o: { skin, hair, shirt, pants, style: 'short'|'pony'|'bun'|'curly', mood: 'happy'|'sad'|'calm',
//      pose: 'stand'|'sit'|'wave'|'reach', flip, s (scale), delay }
function kid(x, y, o = {}) {
  const { skin = '#ffd9b8', hair = '#5a3a22', shirt = '#5fb3e8', pants = '#4a5a8a',
          style = 'short', mood = 'happy', pose = 'stand', flip = false, s = 1, delay = 0 } = o;
  const sit = pose === 'sit';
  const legs = sit
    ? `<rect x="-20" y="-58" width="40" height="18" rx="9" fill="${pants}"/>
       <rect x="8" y="-52" width="14" height="44" rx="7" fill="${pants}"/><rect x="-14" y="-52" width="14" height="44" rx="7" fill="${pants}"/>
       <ellipse cx="-6" cy="-8" rx="11" ry="6" fill="#4a4a55"/><ellipse cx="16" cy="-8" rx="11" ry="6" fill="#4a4a55"/>`
    : `<rect x="-15" y="-54" width="13" height="50" rx="6" fill="${pants}"/><rect x="2" y="-54" width="13" height="50" rx="6" fill="${pants}"/>
       <ellipse cx="-9" cy="-3" rx="12" ry="6" fill="#4a4a55"/><ellipse cx="10" cy="-3" rx="12" ry="6" fill="#4a4a55"/>`;
  const lift = sit ? 40 : 0;   // a sitting kid's upper body sits lower
  const armL = pose === 'wave'
    ? `<rect x="-40" y="-150" width="13" height="46" rx="6.5" fill="${shirt}" transform="rotate(28 -33 -104)"/><circle cx="-55" cy="-145" r="8" fill="${skin}"/>`
    : `<rect x="-36" y="-102" width="13" height="44" rx="6.5" fill="${shirt}" transform="rotate(${pose === 'reach' ? 40 : 8} -30 -100)"/>`;
  const armR = pose === 'reach'
    ? `<rect x="23" y="-102" width="13" height="46" rx="6.5" fill="${shirt}" transform="rotate(-62 30 -100)"/>`
    : `<rect x="23" y="-102" width="13" height="44" rx="6.5" fill="${shirt}" transform="rotate(-8 30 -100)"/>`;
  const hairBack = style === 'pony' ? `<circle cx="34" cy="-142" r="14" fill="${hair}"/>`
    : style === 'bun' ? `<circle cx="0" cy="-170" r="15" fill="${hair}"/>`
    : style === 'curly' ? [-26, -12, 4, 20, 30].map((dx, i) => `<circle cx="${dx}" cy="${-152 - (i % 2) * 8}" r="14" fill="${hair}"/>`).join('') : '';
  const face = mood === 'sad'
    ? `<path d="M-17 -140 l9 3 M17 -140 l-9 3" stroke="#4a3a30" stroke-width="2.5" stroke-linecap="round"/>
       <path d="M-8 -112 q8 -7 16 0" fill="none" stroke="#7a3a30" stroke-width="3" stroke-linecap="round"/>
       <path class="tear" style="animation-delay:${delay}s" d="M-12 -124 q-3 6 0 8 q3 -2 0 -8 z" fill="#6ec3f2"/>`
    : mood === 'calm'
      ? `<path d="M-6 -112 h12" stroke="#7a3a30" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M-9 -115 q9 9 18 0" fill="none" stroke="#7a3a30" stroke-width="3" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="0" rx="34" ry="8" fill="#000" opacity=".13"/>
    <g class="kid-idle" style="animation-delay:${delay}s">
      ${legs}
      <g transform="translate(0 ${lift})">
        ${armL}${armR}
        <rect x="-26" y="-108" width="52" height="58" rx="18" fill="${shirt}"/>
        ${hairBack}
        <circle cx="0" cy="-132" r="31" fill="${skin}"/>
        <path d="M-32 -134 a32 32 0 0 1 64 0 q-12 -14 -32 -12 q-20 -2 -32 12 z" fill="${hair}"/>
        <circle cx="-11" cy="-128" r="3.6" fill="#3a2a22"/><circle cx="11" cy="-128" r="3.6" fill="#3a2a22"/>
        <circle cx="-19" cy="-118" r="5" fill="#ff9e8a" opacity=".5"/><circle cx="19" cy="-118" r="5" fill="#ff9e8a" opacity=".5"/>
        ${face}
      </g>
    </g></g>`;
}

const sky = (h) => `
  <rect width="${W}" height="${H}" fill="url(#s-sky)"/>
  <circle cx="1400" cy="110" r="52" fill="#ffd24d"/><circle cx="1400" cy="110" r="90" fill="#ffd24d" opacity=".18"/>
  ${cloud(0, 90, 1, 100, -30)}${cloud(0, 180, .7, 130, -90)}${cloud(0, 60, .6, 85, -60)}
  <path d="M0 ${h - 50} Q 300 ${h - 140} 700 ${h - 70} T 1600 ${h - 80} V ${h + 60} H 0 Z" fill="#c2e59a"/>`;

const meadow = (y0, seed) => `
  <rect x="0" y="${y0}" width="${W}" height="${H - y0}" fill="url(#s-grass)"/>
  ${scatter(46, seed, (a, b) => tuft(30 + a * 1540, y0 + 20 + b * (H - y0 - 30)))}
  ${scatter(18, seed + 7, (a, b, c) => flower(40 + a * 1520, y0 + 30 + b * (H - y0 - 40), ['#fff', '#ffd34d', '#ff9ec2', '#c99bff'][Math.floor(c * 4)]))}`;

const bench = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="4" rx="96" ry="12" fill="#000" opacity=".1"/>
  <rect x="-90" y="-78" width="180" height="16" rx="6" fill="#b67b4a"/><rect x="-90" y="-54" width="180" height="16" rx="6" fill="#b67b4a"/>
  <rect x="-94" y="-36" width="188" height="16" rx="6" fill="#c98d5a"/>
  <rect x="-80" y="-24" width="10" height="28" fill="#8d6040"/><rect x="70" y="-24" width="10" height="28" fill="#8d6040"/></g>`;

const fence = (y) => `<g>${scatter(28, 9, (a, b, c, i) => `<rect x="${-10 + i * 60}" y="${y - 70}" width="34" height="80" rx="12" fill="#fbf6ec" stroke="#e1d3bb" stroke-width="2"/>`)}
  <rect x="0" y="${y - 50}" width="${W}" height="12" fill="#efe5d4"/><rect x="0" y="${y - 20}" width="${W}" height="12" fill="#efe5d4"/></g>`;

/* ---------- the four close-ups ----------
   topics: where each marker floats (x, y) and where the avatar stops to join (stand). */
const SCENE_ART = {
  playground: {
    start: [800, 950],
    topics: {
      make_friends:   { at: [560, 490], stand: [470, 880] },
      join_activity:  { at: [1060, 470], stand: [960, 890] },
      comfort_friend: { at: [1290, 600], stand: [1150, 900] },
    },
    art: () => `${sky(470)}${tree(150, 470, 1.1, 1, -.5)}${tree(1480, 470, 1.1, 0, -1.8)}${tree(1000, 450, .8, 2, -1)}
      ${fence(490)}${meadow(480, 31)}
      <ellipse cx="800" cy="800" rx="780" ry="230" fill="#f3dca9"/><ellipse cx="800" cy="800" rx="750" ry="210" fill="#f7e5bb"/>
      <!-- swings -->
      <g stroke="#3f9bb3" stroke-width="16" stroke-linecap="round" fill="none">
        <path d="M150 760 L215 360 L280 760"/><line x1="215" y1="362" x2="420" y2="362"/><path d="M380 760 L420 360 L460 760"/></g>
      <g class="swing" style="transform-origin:275px 365px">
        <line x1="255" y1="365" x2="255" y2="640" stroke="#7d6a5a" stroke-width="4"/><line x1="295" y1="365" x2="295" y2="640" stroke="#7d6a5a" stroke-width="4"/>
        <rect x="240" y="636" width="70" height="14" rx="6" fill="#f0743e"/>
        ${kid(275, 690, { pose: 'sit', shirt: '#ff8fb1', pants: '#6a5acd', hair: '#2a1a12', style: 'pony', s: .9 })}
      </g>
      <g class="swing" style="transform-origin:360px 365px; animation-delay:-1.3s">
        <line x1="342" y1="365" x2="342" y2="640" stroke="#7d6a5a" stroke-width="4"/><line x1="378" y1="365" x2="378" y2="640" stroke="#7d6a5a" stroke-width="4"/>
        <rect x="328" y="636" width="64" height="14" rx="6" fill="#ffc53d"/></g>
      <!-- slide -->
      <rect x="1380" y="380" width="14" height="300" fill="#e3604c"/><rect x="1440" y="380" width="14" height="300" fill="#e3604c"/>
      <g stroke="#e3604c" stroke-width="8">${[420, 470, 520, 570, 620].map((y) => `<line x1="1387" y1="${y}" x2="1447" y2="${y}"/>`).join('')}</g>
      <rect x="1360" y="366" width="110" height="26" rx="9" fill="#ffb84d"/>
      <path d="M1370 380 C 1300 400, 1300 640, 1180 690 L 1180 720 C 1320 670, 1330 430, 1380 410 Z" fill="#ff8f4a"/>
      <!-- sandbox: 交朋友, a kid building alone -->
      <rect x="420" y="700" width="300" height="130" rx="22" fill="#c98c55"/><rect x="434" y="712" width="272" height="106" rx="16" fill="#ffe3a3"/>
      <path d="M600 770 h60 v-26 h-10 v10 h-10 v-10 h-10 v10 h-10 v-10 h-10 v10 h-10 z" fill="#e8b866"/>
      <path d="M470 790 l18 -26 l18 26 z" fill="#ff7c7c"/><circle cx="525" cy="786" r="9" fill="#5fb3e8"/>
      ${kid(560, 790, { pose: 'reach', shirt: '#7fc164', pants: '#3e6fb0', s: 1.05, mood: 'calm', delay: -.6 })}
      <!-- ball game: 加入活动 -->
      ${kid(950, 760, { pose: 'wave', shirt: '#ffc53d', pants: '#5a5a7a', hair: '#7a4a22', style: 'curly', delay: -1 })}
      ${kid(1170, 770, { pose: 'reach', shirt: '#5fb3e8', pants: '#e3604c', hair: '#2a1a12', style: 'bun', flip: true, delay: -.3 })}
      <g class="ball"><circle cx="1000" cy="610" r="22" fill="#ff6b5a"/><path d="M978 610 h44 M1000 588 q14 22 0 44" stroke="#fff" stroke-width="4" fill="none"/></g>
      <!-- bench: 安慰朋友 -->
      ${bench(1300, 880, 1.1)}
      ${kid(1290, 850, { pose: 'sit', mood: 'sad', shirt: '#c99bff', pants: '#4a5a8a', hair: '#5a3a22', style: 'pony', s: 1.05, delay: -.2 })}`,
  },
  classroom: {
    start: [800, 950], indoor: true,
    topics: {
      make_friends:   { at: [420, 475], stand: [560, 900] },
      join_activity:  { at: [910, 480], stand: [900, 920] },
      comfort_friend: { at: [1310, 465], stand: [1180, 910] },
    },
    art: () => `
      <rect width="${W}" height="600" fill="#fdf0d8"/>
      <rect y="520" width="${W}" height="80" fill="#f4dcae"/><rect y="514" width="${W}" height="10" fill="#e6c48e"/>
      <rect y="600" width="${W}" height="400" fill="#e8c28a"/>
      ${scatter(9, 2, (a, b, c, i) => `<line x1="0" y1="${630 + i * 44}" x2="${W}" y2="${630 + i * 44}" stroke="#d9ae74" stroke-width="3"/>`)}
      ${scatter(30, 4, (a, b, c, i) => `<line x1="${(i * 167 + (i % 9) * 40) % 1600}" y1="${600 + (i % 9) * 44}" x2="${(i * 167 + (i % 9) * 40) % 1600}" y2="${644 + (i % 9) * 44}" stroke="#d9ae74" stroke-width="3"/>`)}
      <!-- bunting -->
      <path d="M120 40 Q 800 120 1480 40" fill="none" stroke="#c9a77a" stroke-width="3"/>
      ${scatter(13, 5, (a, b, c, i) => { const x = 170 + i * 105, y = 52 + Math.sin(Math.PI * (x - 120) / 1360) * 52;
        return `<path d="M${x - 22} ${y} h44 l-22 40 z" fill="${['#ff8f8f', '#ffd34d', '#7fc1f2', '#8fd17a', '#c99bff'][i % 5]}"/>`; })}
      <!-- window -->
      <rect x="150" y="150" width="270" height="250" rx="14" fill="#fff" />
      <rect x="164" y="164" width="242" height="222" rx="8" fill="#a9dcf8"/>
      <circle cx="350" cy="220" r="26" fill="#ffd24d"/><g transform="translate(240 260) scale(.55)" fill="#fff"><circle cx="0" cy="0" r="40"/><circle cx="40" cy="10" r="30"/><circle cx="-38" cy="12" r="28"/></g>
      <rect x="164" y="330" width="242" height="56" fill="#9fd46e"/>
      <line x1="285" y1="164" x2="285" y2="386" stroke="#fff" stroke-width="10"/><line x1="164" y1="275" x2="406" y2="275" stroke="#fff" stroke-width="10"/>
      <rect x="140" y="396" width="290" height="16" rx="6" fill="#e6c48e"/>
      <!-- blackboard -->
      <rect x="520" y="140" width="560" height="280" rx="16" fill="#b5835a"/><rect x="536" y="156" width="528" height="248" rx="8" fill="#3f6b55"/>
      <text x="800" y="250" text-anchor="middle" font-size="64" font-weight="700" fill="#f4f1e6" font-family="${FONT}" opacity=".92">你好！</text>
      <circle cx="640" cy="330" r="26" fill="none" stroke="#ffe27a" stroke-width="5"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((r) => `<line x1="640" y1="290" x2="640" y2="280" stroke="#ffe27a" stroke-width="5" stroke-linecap="round" transform="rotate(${r} 640 330)"/>`).join('')}
      <text x="900" y="350" text-anchor="middle" font-size="40" fill="#f4f1e6" font-family="${FONT}" opacity=".85">1 + 1 = 2</text>
      <rect x="560" y="404" width="480" height="14" rx="5" fill="#a0714a"/><rect x="900" y="396" width="40" height="10" rx="3" fill="#fff"/>
      <!-- clock -->
      <circle cx="1240" cy="190" r="56" fill="#fff" stroke="#4f7fd1" stroke-width="10"/>
      <line x1="1240" y1="190" x2="1240" y2="156" stroke="#4a4a55" stroke-width="6" stroke-linecap="round"/>
      <line class="minute" style="transform-origin:1240px 190px" x1="1240" y1="190" x2="1272" y2="190" stroke="#e8604c" stroke-width="5" stroke-linecap="round"/>
      <!-- bookshelf -->
      <rect x="1180" y="300" width="300" height="300" rx="10" fill="#b5835a"/>
      ${[330, 420, 510].map((y) => `<rect x="1194" y="${y}" width="272" height="78" fill="#8e6242"/>` +
        scatter(9, y, (a, b, c, i) => `<rect x="${1200 + i * 29}" y="${y + 10 + b * 14}" width="24" height="${68 - b * 14}" rx="3" fill="${['#ff8f8f', '#ffd34d', '#7fc1f2', '#8fd17a', '#c99bff', '#ffb36b'][Math.floor(c * 6)]}"/>`)).join('')}
      <!-- desk: 交朋友, new kid sitting alone -->
      ${kid(420, 760, { pose: 'sit', mood: 'calm', shirt: '#ffb36b', pants: '#4a5a8a', hair: '#2a1a12', s: 1.1 })}
      <rect x="300" y="700" width="260" height="22" rx="8" fill="#f2b45b"/><rect x="316" y="720" width="16" height="110" fill="#c98d5a"/><rect x="528" y="720" width="16" height="110" fill="#c98d5a"/>
      <rect x="340" y="682" width="70" height="18" rx="3" fill="#7fc1f2"/><rect x="470" y="672" width="10" height="30" rx="3" fill="#ff8f8f" transform="rotate(20 475 687)"/>
      <!-- table with blocks: 加入活动 -->
      <ellipse cx="910" cy="780" rx="200" ry="44" fill="#f2b45b"/><ellipse cx="910" cy="774" rx="200" ry="44" fill="#ffc979"/>
      <rect x="896" y="810" width="28" height="70" fill="#c98d5a"/>
      ${[[850, 750, '#ff8f8f'], [890, 750, '#7fc1f2'], [870, 716, '#ffd34d'], [940, 754, '#8fd17a'], [980, 754, '#c99bff'], [960, 720, '#ff8f8f']]
        .map(([x, y, c]) => `<rect x="${x - 18}" y="${y - 30}" width="36" height="32" rx="5" fill="${c}"/>`).join('')}
      ${kid(760, 740, { pose: 'reach', shirt: '#5fb3e8', pants: '#3e6fb0', style: 'curly', hair: '#7a4a22', s: 1.05, delay: -.8 })}
      ${kid(1060, 740, { pose: 'reach', shirt: '#ff8fb1', pants: '#6a5acd', style: 'pony', flip: true, s: 1.05, delay: -.2 })}
      <!-- by the shelf: 安慰朋友 -->
      ${kid(1310, 790, { mood: 'sad', shirt: '#8fd17a', pants: '#5a5a7a', style: 'bun', hair: '#2a1a12', s: 1.1, delay: -.4 })}
      <path d="M1360 790 l30 -6 l4 14 l-30 6 z" fill="#ffd34d"/><path d="M1396 796 l18 -12 l6 10 l-18 12 z" fill="#ffd34d"/>`,
  },
  cafeteria: {
    start: [800, 950], indoor: true,
    topics: {
      make_friends:   { at: [420, 465], stand: [560, 910] },
      join_activity:  { at: [930, 470], stand: [930, 920] },
      comfort_friend: { at: [1310, 470], stand: [1170, 910] },
    },
    art: () => `
      <rect width="${W}" height="580" fill="#fff3e3"/>
      <rect y="540" width="${W}" height="40" fill="#f6dcc0"/>
      <g>${Array.from({ length: 10 }, (_, r) => Array.from({ length: 17 }, (_, c) =>
        `<rect x="${c * 100 - (r % 2) * 50}" y="${580 + r * 44}" width="100" height="44" fill="${(r + c) % 2 ? '#f8efe2' : '#efe0ca'}"/>`).join('')).join('')}</g>
      <!-- windows -->
      ${[230, 1370].map((x) => `<rect x="${x - 110}" y="120" width="220" height="230" rx="110" fill="#fff"/>
        <rect x="${x - 98}" y="132" width="196" height="206" rx="98" fill="#a9dcf8"/><rect x="${x - 98}" y="290" width="196" height="48" fill="#9fd46e"/>
        <line x1="${x}" y1="132" x2="${x}" y2="338" stroke="#fff" stroke-width="8"/>`).join('')}
      <!-- hanging lamps -->
      ${[560, 1040].map((x) => `<g class="lamp" style="transform-origin:${x}px 0px"><line x1="${x}" y1="0" x2="${x}" y2="80" stroke="#8a7a6a" stroke-width="3"/>
        <path d="M${x - 40} 116 q40 -50 80 0 z" fill="#ff8f6b"/><circle cx="${x}" cy="118" r="10" fill="#fff6b0"/></g>`).join('')}
      <!-- counter + menu -->
      <rect x="480" y="170" width="640" height="120" rx="14" fill="#4a5a52"/>
      <text x="800" y="225" text-anchor="middle" font-size="40" font-weight="700" fill="#fff" font-family="${FONT}">今日午餐</text>
      <text x="800" y="270" text-anchor="middle" font-size="30" font-family="${FONT}">🍚 🥦 🍗 🍎 🥛</text>
      <rect x="440" y="400" width="720" height="150" rx="14" fill="#f4a261"/><rect x="440" y="390" width="720" height="26" rx="10" fill="#ffd6a5"/>
      ${[540, 680, 820, 960, 1080].map((x, i) => `<ellipse cx="${x}" cy="392" rx="46" ry="14" fill="#cfd8dc"/>
        <ellipse cx="${x}" cy="384" rx="34" ry="12" fill="${['#ffe08a', '#8fd17a', '#ffb36b', '#ff8f8f', '#fff'][i]}"/>`).join('')}
      ${[600, 880].map((x, i) => `<circle class="steam" style="transform-origin:${x}px 370px; animation-delay:${i * 1.4}s" cx="${x}" cy="370" r="14" fill="#fff"/>`).join('')}
      <!-- small table: 交朋友, eating alone -->
      ${kid(420, 760, { pose: 'sit', mood: 'calm', shirt: '#7fc1f2', pants: '#4a5a8a', style: 'curly', hair: '#2a1a12', s: 1.1, delay: -.5 })}
      <rect x="300" y="700" width="250" height="20" rx="8" fill="#e8a868"/><rect x="415" y="718" width="20" height="110" fill="#b5835a"/>
      <rect x="330" y="680" width="100" height="20" rx="5" fill="#cfd8dc"/><circle cx="360" cy="682" r="10" fill="#fff"/><circle cx="398" cy="682" r="9" fill="#8fd17a"/>
      <!-- long table: 加入活动 -->
      <rect x="720" y="720" width="420" height="24" rx="9" fill="#e8a868"/><rect x="740" y="742" width="18" height="100" fill="#b5835a"/><rect x="1100" y="742" width="18" height="100" fill="#b5835a"/>
      ${kid(810, 780, { pose: 'sit', shirt: '#ffc53d', pants: '#5a5a7a', style: 'pony', delay: -1.1 })}
      ${kid(1050, 780, { pose: 'wave', shirt: '#ff8fb1', pants: '#3e6fb0', style: 'short', hair: '#7a4a22', flip: true, delay: -.3 })}
      ${[[780, 704], [900, 704], [1020, 704]].map(([x, y]) => `<rect x="${x - 40}" y="${y}" width="80" height="16" rx="4" fill="#cfd8dc"/><circle cx="${x - 12}" cy="${y + 2}" r="9" fill="#ffe08a"/><circle cx="${x + 14}" cy="${y + 2}" r="8" fill="#ff8f8f"/>`).join('')}
      <!-- dropped tray: 安慰朋友 -->
      ${kid(1310, 800, { mood: 'sad', shirt: '#c99bff', pants: '#4a5a8a', style: 'bun', s: 1.1, delay: -.7 })}
      <rect x="1350" y="820" width="100" height="18" rx="5" fill="#cfd8dc" transform="rotate(-12 1400 829)"/>
      <circle cx="1380" cy="850" r="10" fill="#ffe08a"/><circle cx="1440" cy="846" r="8" fill="#8fd17a"/><ellipse cx="1420" cy="862" rx="22" ry="6" fill="#ffffff" opacity=".9"/>`,
  },
  park: {
    start: [800, 950],
    topics: {
      comfort_friend: { at: [420, 520], stand: [560, 900] },
      make_friends:   { at: [880, 540], stand: [780, 930] },
      join_activity:  { at: [1290, 380], stand: [1160, 910] },
    },
    art: () => `${sky(460)}${tree(170, 470, 1.2, 0, -.3)}${tree(330, 450, .9, 2, -1.4)}${tree(1460, 470, 1.2, 1, -2)}${tree(700, 440, .7, 1, -.9)}
      ${meadow(460, 57)}
      <path d="M520 1000 C 620 820, 700 700, 820 600" stroke="#e3c48c" stroke-width="120" fill="none" stroke-linecap="round"/>
      <path d="M520 1000 C 620 820, 700 700, 820 600" stroke="#f4dfb1" stroke-width="100" fill="none" stroke-linecap="round"/>
      <!-- pond: 交朋友, feeding the ducks -->
      <ellipse cx="1000" cy="740" rx="230" ry="80" fill="#7ec8f0"/><ellipse cx="1000" cy="732" rx="206" ry="64" fill="#a2dcf8"/>
      <ellipse class="ripple" style="transform-origin:1080px 730px" cx="1080" cy="730" rx="40" ry="12" fill="none" stroke="#fff" stroke-width="3"/>
      <ellipse class="ripple" style="transform-origin:930px 740px; animation-delay:-1.5s" cx="930" cy="740" rx="34" ry="10" fill="none" stroke="#fff" stroke-width="3"/>
      ${[[1060, 730, 0], [1130, 745, -1]].map(([x, y, d]) => `<g class="duck" style="transform-origin:${x}px ${y}px; animation-delay:${d}s">
        <ellipse cx="${x}" cy="${y}" rx="30" ry="18" fill="#ffd84d"/><circle cx="${x + 20}" cy="${y - 22}" r="15" fill="#ffd84d"/>
        <path d="M${x + 33} ${y - 22} l14 4 l-14 4 z" fill="#ff8f3a"/><circle cx="${x + 23}" cy="${y - 26}" r="3" fill="#333"/></g>`).join('')}
      ${kid(880, 860, { pose: 'reach', mood: 'calm', shirt: '#ffb36b', pants: '#3e6fb0', style: 'short', s: 1.05, delay: -.4 })}
      <!-- bench: 安慰朋友 -->
      ${bench(420, 820, 1.15)}
      ${kid(410, 790, { pose: 'sit', mood: 'sad', shirt: '#7fc1f2', pants: '#5a5a7a', style: 'curly', hair: '#2a1a12', s: 1.05, delay: -.9 })}
      ${scatter(9, 77, (a, b, c, i) => flower(250 + i * 38, 880 + (i % 2) * 14, ['#ff8fb1', '#ffd34d', '#c99bff'][i % 3]))}
      <!-- kite: 加入活动 -->
      <path d="M1215 780 Q 1260 600 1300 470" fill="none" stroke="#7d6a5a" stroke-width="2"/>
      <g class="kite" style="transform-origin:1300px 460px">
        <path d="M1300 400 l46 60 l-46 60 l-46 -60 z" fill="#ff6b5a"/><path d="M1300 400 v120 M1254 460 h92" stroke="#fff" stroke-width="3"/>
        <path d="M1300 520 q-14 20 6 34 q-18 14 2 30" fill="none" stroke="#ffd34d" stroke-width="4"/></g>
      ${kid(1200, 800, { pose: 'reach', shirt: '#8fd17a', pants: '#e3604c', style: 'pony', hair: '#7a4a22', delay: -.2 })}
      ${kid(1360, 810, { pose: 'wave', shirt: '#ffc53d', pants: '#4a5a8a', style: 'bun', flip: true, delay: -1.2 })}`,
  },
};

function marker(sceneId, t, label, emoji) {
  const [x, y] = SCENE_ART[sceneId].topics[t].at;
  return `<g class="topic" data-topic="${t}" transform="translate(${x} ${y})">
    <g class="t-bump">
      <circle class="t-ring" r="58" fill="none" stroke="#ff9d3f" stroke-width="6"/>
      <circle r="50" fill="#fff" stroke="#e8804f" stroke-width="6"/>
      <text y="16" text-anchor="middle" font-size="46">${emoji}</text>
      <g class="t-check" display="none"><circle cx="38" cy="-38" r="18" fill="#7fc164"/>
        <path d="M30 -38 l6 7 l12 -14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
      <rect x="-70" y="62" width="140" height="44" rx="22" fill="#fff"/>
      <text y="93" text-anchor="middle" font-size="26" font-weight="800" fill="#5a4a3a" font-family="${FONT}">${label}</text>
    </g></g>`;
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
    const art = SCENE_ART[scene.id];
    if (!art) return false;           // no drawn close-up -> caller falls back to the zone image
    current = scene; busy = false;
    container.innerHTML = `
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c5f2"/><stop offset=".5" stop-color="#d6eefc"/></linearGradient>
    <linearGradient id="s-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8d977"/><stop offset="1" stop-color="#8bc65b"/></linearGradient>
  </defs>
  ${art.art()}
  ${scene.topics.map((t) => marker(scene.id, t.id, t.label, t.emoji)).join('')}
  <g class="avatar" pointer-events="none">
    <ellipse cx="0" cy="0" rx="40" ry="11" fill="#000" opacity=".16"/>
    <g class="av-body"><g class="av-flip"><image href="assets/boy_avatar.png" x="-45" y="-200" width="90" height="200"/></g></g>
  </g>
</svg><div class="flash"></div>`;
    const svg = container.querySelector('svg');
    container.style.background = art.indoor ? '#e8c28a' : '';
    svg.setAttribute('preserveAspectRatio', innerWidth / innerHeight < 1.25 ? 'xMidYMid meet' : 'xMidYMid slice');
    const avatar = svg.querySelector('.avatar'), avBody = svg.querySelector('.av-body'), avFlip = svg.querySelector('.av-flip');
    let pos = [...art.start];
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
        const step = 560 * Math.min(0.05, (now - last) / 1000); last = now;
        const dx = tx - pos[0], dy = ty - pos[1], d = Math.hypot(dx, dy);
        if (d <= step) { put(tx, ty, dx); avBody.classList.remove('step'); done(); return; }
        put(pos[0] + dx / d * step, pos[1] + dy / d * step, Math.abs(dx) > .5 ? dx : 0);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    svg.addEventListener('pointerdown', (e) => { const t = e.target.closest('.topic'); if (t) t.classList.add('press'); });
    const unpress = () => svg.querySelectorAll('.topic.press').forEach((t) => t.classList.remove('press'));
    svg.addEventListener('pointerup', unpress); svg.addEventListener('pointerleave', unpress);
    svg.addEventListener('click', (e) => {
      const t = e.target.closest('.topic');
      if (!t || busy) return;
      busy = true;
      const id = t.dataset.topic;
      walkTo(art.topics[id].stand, () => setTimeout(() => {
        busy = false;
        onTopic(scene.id, id);
        // Back where they started for the next pick, once the round is under way.
        setTimeout(() => put(...art.start), 400);
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
    container.querySelectorAll('.topic').forEach((g) => {
      const done = isDone(current.id, g.dataset.topic);
      g.classList.toggle('done', done);
      g.querySelector('.t-check').setAttribute('display', done ? '' : 'none');
      g.querySelectorAll('circle')[1].setAttribute('stroke', done ? '#7fc164' : '#e8804f');
    });
  }

  return {
    show, refresh,
    showing: (id) => !!current && current.id === id,
    hide() { current = null; cancelAnimationFrame(raf); container.classList.add('hidden'); container.innerHTML = ''; },
  };
}
