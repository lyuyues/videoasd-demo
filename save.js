/* Study-server data sink (2026-10-17).
 *
 * On the study server (home desktop behind a Cloudflare tunnel, see server.py and
 * deploy/) every snapshot is POSTed to /api/save-session, so the data survives a
 * closed tab or a cleared browser. The server keeps one file per
 * (participant, condition, session), overwritten by each newer snapshot.
 * localStorage stays the primary store and the manual Export buttons still work,
 * so on GitHub Pages (no /api) nothing changes: the POST just fails quietly.
 */

export const onStudyServer = location.hostname !== 'lyuyues.github.io' && location.protocol !== 'file:';

const URL_SAVE = 'api/save-session';   // relative: works at / and under a sub-path
let lastStatus = 'idle';               // 'idle' | 'saved' | 'failed'
export const saveStatus = () => lastStatus;

export async function saveSnapshot(body) {
  if (!onStudyServer) return false;
  try {
    const r = await fetch(URL_SAVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedAt: new Date().toISOString(), ...body }),
    });
    lastStatus = r.ok ? 'saved' : 'failed';
  } catch (e) {
    lastStatus = 'failed';
  }
  return lastStatus === 'saved';
}

// Last-chance save when the tab is hidden or closed (fetch may be cancelled then).
export function beaconSnapshot(body) {
  if (!onStudyServer || !navigator.sendBeacon) return;
  try {
    const blob = new Blob([JSON.stringify({ savedAt: new Date().toISOString(), ...body })],
                          { type: 'application/json' });
    navigator.sendBeacon(URL_SAVE, blob);
  } catch (e) { /* best effort */ }
}
