/* Study-server data sink (2026-10-17) + on-device backup (2026-10-19).
 *
 * On the study server (home desktop behind a Cloudflare tunnel, see server.py and
 * deploy/) every snapshot is POSTed to /api/save-session, so the data survives a
 * closed tab or a cleared browser. The server keeps one file per
 * (kind, participant, condition, session), overwritten by each newer snapshot.
 *
 * Every snapshot is ALSO written to IndexedDB on the device first, keyed the same
 * way as the server file, with a `synced` flag. Unsynced snapshots are re-sent every
 * 30 s and whenever the network comes back, so a dropped connection (the iPad is in
 * China, the server in Canada) loses nothing as long as the page is reopened once
 * online. backup.html lists the store and downloads it as files.
 * On GitHub Pages (no /api) the backup is still kept; the POST just isn't tried.
 */

export const onStudyServer = location.hostname !== 'lyuyues.github.io' && location.protocol !== 'file:';

// Relative to this module, not the page, so quiz/*.html posts to the same endpoint.
const URL_SAVE = new URL('api/save-session', import.meta.url).href;
const DB_NAME = 'videoasd_backup', STORE = 'snapshots';
const RETRY_MS = 30000;

let lastStatus = 'idle';               // 'idle' | 'saved' | 'failed'
export const saveStatus = () => lastStatus;

// Ask the browser not to evict our storage under pressure (best effort; Safari may say no).
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ignore */ }

/* ---------- IndexedDB backup ---------- */
let dbPromise = null;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
function tx(mode, fn) {
  return db().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
  }));
}
// Mirrors server.py's file name, so a backup file and a server file line up.
const clean = (v, dflt) => (String(v || '').replace(/[^A-Za-z0-9_-]/g, '') || dflt);
export const backupKey = (b) =>
  `videoasd-${clean(b.kind, 'data')}-${clean(b.participantId, 'NO-PID')}-${clean(b.condition, 'unknown')}-${clean(b.sessionId, 'nosession')}`;

function putBackup(rec, synced) {
  const key = backupKey(rec);
  return tx('readwrite', (s) => { s.put({ key, savedAt: rec.savedAt, synced, body: rec }); })
    .then(() => key)
    .catch((e) => { console.warn('[save] backup failed:', e); return key; });
}
function markSynced(key, savedAt) {
  // Only if no newer snapshot replaced it in the meantime.
  return tx('readwrite', (s) => {
    const g = s.get(key);
    g.onsuccess = () => { const r = g.result; if (r && r.savedAt === savedAt) { r.synced = true; s.put(r); } };
  }).catch(() => {});
}
export const listBackups = () => tx('readonly', (s) => s.getAll()).catch(() => []);
export const pendingCount = () => listBackups().then((rs) => rs.filter((r) => !r.synced).length);

/* ---------- upload ---------- */
async function post(rec) {
  try {
    const r = await fetch(URL_SAVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec),
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}

export async function saveSnapshot(body) {
  const rec = { savedAt: new Date().toISOString(), ...body };
  const key = await putBackup(rec, false);
  if (!onStudyServer) return false;
  const ok = await post(rec);
  lastStatus = ok ? 'saved' : 'failed';
  if (ok) await markSynced(key, rec.savedAt);
  return ok;
}

// Last-chance save when the tab is hidden or closed (fetch may be cancelled then).
// Delivery can't be confirmed, so the backup stays unsynced and the retry loop
// re-sends it next time the page is open -- the server just overwrites the same file.
export function beaconSnapshot(body) {
  const rec = { savedAt: new Date().toISOString(), ...body };
  putBackup(rec, false);
  if (!onStudyServer || !navigator.sendBeacon) return;
  try {
    navigator.sendBeacon(URL_SAVE, new Blob([JSON.stringify(rec)], { type: 'application/json' }));
  } catch (e) { /* best effort */ }
}

let retrying = false;
export async function retryPending() {
  if (!onStudyServer || retrying) return 0;
  retrying = true;
  let sent = 0;
  try {
    for (const r of (await listBackups()).filter((x) => !x.synced)) {
      const ok = await post(r.body);
      lastStatus = ok ? 'saved' : 'failed';
      if (!ok) break;                 // still offline -- try again next tick
      await markSynced(r.key, r.savedAt);
      sent++;
    }
  } finally { retrying = false; }
  return sent;
}
setInterval(retryPending, RETRY_MS);
addEventListener('online', retryPending);
setTimeout(retryPending, 2000);       // anything left over from a previous visit

/* ---------- file download ---------- */
export function downloadJson(filename, obj) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
