# Archive: Aug 2026 clip versions (NOT used by the app or the study)

Copied 2026-10-22 from the old clone `Research/VideoASD/web-demo`, which was the only copy.
Only scenes/topics outside the study (cafeteria, park, *_comfort_friend). The study's 4 scenes
(playground/classroom × make_friends/join_activity) are newer in `assets/videos/clips/`.

- `*_batch-20260807.mp4`: Aug 7 batch, joke option with Sam half-smiling
- `*_REGEN.mp4`, and same-name files: Aug 20 regenerations (mostly audio fixes) that differ from the live clips

`clips.js` does not reference anything here. To use one, copy it over the clip in
`assets/videos/clips/<scene>/`, then rerun `bash tools/make_thumbs.sh` (the pre-commit hook redoes AOI).
Each folder's README.md lists the clips and which ones lack audio (as of 2026-10-18).
