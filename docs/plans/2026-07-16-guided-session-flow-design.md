# VideoASD web demo — Guided session flow

> **Date**: 2026-07-16 · **Status**: agreed with Yue, implementing
> **Problem**: a new user (child + parent) opens the demo and cannot tell what to do first.
> **Canonical framing**: `Research/VideoASD/2026-05-21_PRR_framing.md` (PRR: Predict–Reveal–Reflect)

## Why the flow is unclear

The demo is not one design — it is three generations layered on the same screen.

1. **Two parallel navigations.** 12 `.hotspot path` buttons (Playground·Slide / Swings / Sandbox …) sit on
   the map alongside 4 `.scene-pill` buttons that open 3 topic circles each. `enterScene()` hides all 12
   hotspots as its first act, so the two can never coexist. The 12 paths are the dead generation; the
   `SCENES` table (4 scenes × 3 topics) is live — commit `99ddad7` ("all 12 topics now real") backs it
   with real video.
2. **A step that never runs.** `showStep('choose')` is never called. `poe-step-choose` (the path picker)
   is dead HTML + CSS + a DOM ref at line 1118.
3. **Stale phase vocabulary.** The header chips read INTERPRET / ACTION / REACTION / REFLECT (4 phases),
   matching neither `IER_Framework_Design.md` (Interpret→Express→Reflect) nor the canonical PRR
   (Predict→Reveal→Reflect). The chips are the user's only "where am I" indicator, and they point at an
   abandoned framework.
4. **The two non-negotiable PRR steps are missing.** The framing doc's minimal necessary set is
   **A** ("What did you notice?", prior elicitation) + **C** ("Same as you thought?", mismatch reaction) —
   "without both, the 'make thinking visible' claim doesn't hold". A is absent entirely; C exists only as
   a rhetorical `poe-cue` on the outcome screen, with no buttons and no data capture.
5. **No progression.** The map is free-roam. After a POE loop the child returns to a map that looks
   exactly as it did before, with no indication of what comes next or when the session ends.

## Two different "12"s

`updateProgress()` walks `LOC_CENTERS` (4 scenes) and counts distinct actions explored per scene
(`STAR_MAX = 3`) → **4 scenes × 3 actions = 12**. Yue's model is **4 scenes × 3 topics = 12**. The
numbers collide by coincidence.

Worse, `goToTree()` uses `$modal.dataset.locId` — the **scene** id, not `scene_topic` — as the
`constructId`, so all 3 topics inside a scene share one guess store and one possibility tree. Topics
cross-contaminate each other's stars and fruit.

## Target flow

```
[0] Setup gate            parent-facing, one screen
    ├ Gaze calibration    [Calibrate] / [Skip]
    └ Make a scene        [✨ Author] / [Skip → use prepared scenes]
                          ↓ "Hand the iPad to your child →"
[1] Map                   child-facing, toolbar hidden
    4 scenes on a path; only the next unlocked one is lit
                          ↓ tap the lit scene
[2] Scene                 3 topic circles, freely chosen
                          ↓ tap a topic
[3] PRR loop              per topic, ≤3 rounds
    context → notice(A) → pick action → predict reaction
    → outcome → same-as-thought(C) → story tree
                          ↓ back to scene; scene done at 3/3 → next scene lights
[4] Done                  4 scenes complete → end screen
```

**Unlock granularity (chosen: A).** Scenes are levels, unlocked in order; topics inside a scene are
freely chosen. At the map level the child has nothing to deliberate over (one scene is lit); inside a
scene they get 3 concrete, illustrated choices. This preserves agency — the framing calls the child a
"cognitive agent", so a fully rails-ed flow would be self-defeating — while removing the "what do I tap
first" problem. **One session = one scene** (~10–15 min); progress persists in localStorage across
sessions, so the full 12 is the map's extent, not one sitting's workload. Today's scene is the first
unfinished one, computed at load and held for the sitting — the grown-up doesn't pick it.

**Step 2 is the Author studio itself** — the button relocated out of the toolbar, not a rebuild of its
form. `expert_ui.py` authors a scene (place + topic + one-line context → LLM designs the good / passive /
inappropriate branches, editable → Veo generates 7 clips → an entry to paste into `CLIPS`). It needs a
local server and minutes per case, and its output reaches the demo by hand, so it runs **before** a
sitting, never inside one. The study uses pre-generated, expert-reviewed content per
`IER_Framework_Design.md` ("预生成 + 专家审核，不做实时生成") and the grown-up skips this step. It stays in
the flow because the pipeline supports authoring — it is a capability proof, not a session component.
Making it usable in-session would require A) running Veo while the child waits and B) replacing the
hard-coded `CLIPS` constant with runtime injection. Neither is in scope.

### Duration note (flagged, accepted)

`IER_Framework_Design.md` estimates ~2 min/round, "3 scenes × 2 rounds = 10–12 min". 12 topics at 1
round each is ~24 min; at the designed 3-round cap, 40–70 min. That is too long for a 3–6 y/o in one
sitting — hence one-scene-per-session above, which the existing `videoasd_visited_v5` persistence
already half-supports.

## Implementation stages

1. **Data model** — key guesses/tree by `scene_topic`; `★ n/12` counts completed topics.
2. **Flow spine** — Setup gate screen; delete the 12 path hotspots; sequential scene unlock; hide the
   toolbar in child mode; move `Author` out of the child-facing UI.
3. **PRR completion** — chips → Predict/Reveal/Reflect; add step A and step C; delete dead
   `poe-step-choose`.

## Known gap

The map has nothing telling the child to tap the lit pill. The distractors are gone, but the one live
target sits in the **top-left corner** — not where a 3–6 y/o looks first; the diorama in the middle is.
The fix is to make today's scene tappable on the map itself (the building), demoting the pills to a pure
progress indicator, which touches `LOC_CENTERS` positioning and the bear's walk-to-target behaviour.
Not attempted — it needs Yue's call on whether the walking animation returns.
