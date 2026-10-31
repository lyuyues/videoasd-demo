/* Gaze records (2026-10-31), shared by index.html (VideoASD / PRR) and baseline.html,
 * so the two conditions' gaze can be compared child by child, clip by clip.
 *
 * One record = one continuous capture on one clip:
 *   { condition: 'prr' | 'baseline', participantId, sessionId,
 *     construct: '<scene>_<topic>', clip: 'context' | 'action_<opt>' | 'reaction_<opt>',
 *     viewing,            // 1st, 2nd... capture of this clip in this session + condition
 *     startedAt, endedAt, // ISO
 *     pts: [[vx, vy, t]], // on-video points: x/y as 0-1 of the video frame, t = clip time (s)
 *     on, off }           // samples on / off the video
 * Clip names match assets/aoi/<construct>__<clip>.json, so both conditions score
 * against the same AOI boxes.
 *
 * Replaces the old device-wide 'videoasd_gaze' map ("construct|clip" -> points), which
 * appended every child's points into the same entry and shipped all of them in every
 * child's file. Each saved file now carries only its own session's records.
 */

const KEY = 'videoasd_gaze_v2';

export function gazeRecords() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

/** Records of one condition + session (what that session's saved file carries). */
export const sessionGaze = (condition, sessionId) =>
  gazeRecords().filter((r) => r.condition === condition && r.sessionId === sessionId);

export function saveGazeRecord(rec) {
  const all = gazeRecords();
  const viewing = 1 + all.filter((r) => r.condition === rec.condition && r.sessionId === rec.sessionId &&
    r.construct === rec.construct && r.clip === rec.clip).length;
  const full = { ...rec, viewing, endedAt: new Date().toISOString() };
  all.push(full);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage full: the event log still has the summary */ }
  return full;
}
