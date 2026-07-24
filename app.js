/**
 * VideoASD — Town map prototype (Tier 2: walkable avatar)
 *
 * Behavior:
 *  - Click on a building zone → avatar walks toward that zone → modal opens
 *  - Walking = CSS transition on left/top (smooth pseudo-3D motion)
 *  - Avatar flips horizontally to face direction of motion
 *  - Walk duration adapts to distance (so far buildings take longer)
 *  - Visited zones get a green ✓ marker
 */

const STORAGE_KEY = 'videoasd_visited_v2';
const WALK_BASE_MS = 600;     // baseline walk duration
const WALK_PER_PCT_MS = 35;   // additional ms per 1% horizontal distance

const $progress = document.getElementById('progress');
const $modal = document.getElementById('modal');
const $modalTitle = document.getElementById('modal-title');
const $modalClose = document.getElementById('modal-close');
const $zones = document.querySelectorAll('.zone');
const $avatar = document.getElementById('avatar');
const $zoneLabel = document.getElementById('zone-label');
const $mapFrame = $avatar.parentElement;

let avatarX = 50;
let avatarY = 73;
let walking = false;
let pendingLoc = null;

function readVisited() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeVisited(visited) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visited));
}

function refreshUI() {
  const visited = readVisited();
  $progress.textContent = `Explored ${visited.length}/4`;
  $zones.forEach((el) => {
    el.classList.toggle('visited', visited.includes(el.dataset.loc));
  });
}

function commitVisit(loc) {
  const visited = readVisited();
  if (!visited.includes(loc)) {
    visited.push(loc);
    writeVisited(visited);
  }
  refreshUI();
}

function openModal(loc, label) {
  pendingLoc = loc;
  $modalTitle.textContent = `Enter ${label}`;
  $modal.classList.remove('hidden');
}

function closeModalAndCommit() {
  if (pendingLoc) {
    commitVisit(pendingLoc);
    pendingLoc = null;
  }
  $modal.classList.add('hidden');
}

function walkTo(targetX, targetY, onArrive) {
  if (walking) return;
  walking = true;

  // Direction flip
  const goingRight = targetX > avatarX;
  $avatar.style.setProperty('--flip', goingRight ? '1' : '-1');
  $avatar.classList.remove('facing-left', 'facing-right');
  $avatar.classList.add(goingRight ? 'facing-right' : 'facing-left');

  // Duration scales with horizontal distance
  const dx = Math.abs(targetX - avatarX);
  const dy = Math.abs(targetY - avatarY);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const dur = Math.max(WALK_BASE_MS, WALK_BASE_MS + dist * WALK_PER_PCT_MS);

  $avatar.style.transition = `left ${dur}ms cubic-bezier(0.4, 0.05, 0.4, 1), top ${dur}ms cubic-bezier(0.4, 0.05, 0.4, 1)`;
  $avatar.classList.add('walking');

  // Trigger movement on next frame so transition kicks in
  requestAnimationFrame(() => {
    avatarX = targetX;
    avatarY = targetY;
    $avatar.style.left = `${targetX}%`;
    $avatar.style.top = `${targetY}%`;
  });

  setTimeout(() => {
    $avatar.classList.remove('walking');
    walking = false;
    if (onArrive) onArrive();
  }, dur + 30);
}

/* Zone interactions */
$zones.forEach((zone) => {
  zone.addEventListener('mouseenter', () => {
    const x = parseFloat(zone.dataset.x);
    const y = parseFloat(zone.dataset.y);
    $zoneLabel.style.left = `${x}%`;
    $zoneLabel.style.top = `${Math.max(y - 20, 8)}%`;
    $zoneLabel.textContent = zone.dataset.label;
    $zoneLabel.classList.add('show');
  });

  zone.addEventListener('mouseleave', () => {
    $zoneLabel.classList.remove('show');
  });

  zone.addEventListener('click', () => {
    if (walking) return;
    const x = parseFloat(zone.dataset.x);
    const y = parseFloat(zone.dataset.y);
    const loc = zone.dataset.loc;
    const label = zone.dataset.label;
    $zoneLabel.classList.remove('show');
    walkTo(x, y, () => openModal(loc, label));
  });
});

/* Modal close */
$modalClose.addEventListener('click', closeModalAndCommit);

$modal.addEventListener('click', (e) => {
  if (e.target === $modal) {
    pendingLoc = null;
    $modal.classList.add('hidden');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$modal.classList.contains('hidden')) {
    pendingLoc = null;
    $modal.classList.add('hidden');
  }
  if (e.key === 'R' && e.shiftKey) {
    localStorage.removeItem(STORAGE_KEY);
    refreshUI();
    // Send avatar home
    walkTo(50, 73);
    console.log('[VideoASD] Visited state cleared.');
  }
});

refreshUI();
console.log('[VideoASD] Walking avatar ready. Click a building.');
