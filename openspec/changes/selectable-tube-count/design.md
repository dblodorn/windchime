# Design

## Context

See proposal.md for why; the requirements are in this change's `specs/`. The six-tube assumption lives in a few places:

- `lib/engine.js`: the module constants `ANG`/`REST`, six angles starting at −60° in 60° steps; `makeSim` sizes `sim.tubes` from `REST`; `step`, `tubeGeom` and `strikeTube` index `REST[i]`/`ANG[i]`; `sixOf(deg)` makes the six offsets in `P.scale`; `setSound`'s confirmation arpeggio rings tubes 0, 2 and 4.
- `components/Chime.jsx`: `E.sixOf(...)` for the unit's `scale` memo and for TEST NOTE; the readout's `grid-cols-6`; the canvas `aria-label` says "six tubes".

Two facts make the change easy to keep safe:
- The sim's random stream doesn't depend on the tube count. `makeSim` draws one `rnd()` for `phi`, and `step` draws three `gauss()` per step, whatever the tubes are doing. Changing the count therefore leaves the wind, clapper and sail on exactly the same path, and at 6 tubes nothing changes.
- With the current angles, some counts would put tubes almost on top of each other on screen. A quick measurement of the narrowest screen-x gap between neighbouring tube centres at rest, in raster px, using the "default" angles −90° + 180°/N + i·360°/N:

  | N | default start | gap | best start | gap |
  |---|---|---|---|---|
  | 2 | 0° | 87.2 | −20° | 92.8 |
  | 3 | −30° | 14.0 | −50° | 40.2 |
  | 4 | −45° | 22.4 | −38.5° | 29.3 |
  | 5 | −54° | **1.9** | −74° | 16.9 |
  | 6 | −60° (today) | 8.1 | −69° | 15.1 |
  | 7 | −64.3° | 5.0 | −58.5° | 8.9 |
  | 8 | −67.5° | **2.9** | −73° | 8.9 |

  A tube body is 2·RT = 7 sim units ≈ 5.6 raster px wide, so at 5 and 8 the default angles make the tubes overlap.

## Goals / Non-Goals

**Goals:**
- At 6 tubes, keep everything identical down to the strike sequence, so it can be checked byte for byte against today's `renderTake`.
- Change the count live, without restarting the unit's chime instance or its audio graph.
- Keep the engine free of React and DOM concerns. Tube count is just another param.

**Non-Goals:**
- Retuning the sim constants, or keeping the strike rate the same across counts (see the proposal).
- Animating tubes from their old positions to their new ones when the count changes. They move at once, matching the no-tween choice elsewhere.
- Changing the ring size, tube width or hit-area radius for higher counts.
- Bumping the storage version.

## Decisions

### 1. Tube count is an engine param, `P.tubes`
`defaultParams()` gains `tubes: 6`, and `setParams({ tubes })` handles the change. Each sim carries its own layout, `sim.rest` (the rest positions) and `sim.ang`, taken from `layout(n)`. That function builds the layout for each count once and caches it. `step`, `tubeGeom`, `strikeTube` and `tubeSegments` read the sim's layout instead of the module-level `REST`/`ANG`. `makeSim(seed, n)` takes the count, so `renderTake` renders with the unit's current tube count.

*Alternative:* rebuild the whole sim with `makeSim` on a count change. That's simpler, but it would reset the clapper, sail and wind, and the spec says motion carries on.

### 2. Resizing keeps tubes 1…min(old, new)
On a count change, `sim.tubes` is cut down or extended. Tubes that remain keep their displacement, velocity and envelope, and new tubes start at rest. Every tube's cooldown is set to 80 ms at the moment of the change. A tube whose new rest position happens to be inside the clapper then can't fire a phantom strike; the collision push still separates them. All the remaining tubes move to their new angles at once, because the even spacing changes with N.

### 3. A start angle chosen per count, with 6 fixed at today's
`layout(n)` places tube i at `start(n) + i·2π/n`. `start(6)` is the existing expression `−π/2 + π/6`, and the step is `2π/6`. That equals `π/3` exactly in floating point, checked for i = 0…5, so the six angles are the same doubles as today. The other counts use the "best start" column above: 2 → −20°, 3 → −50°, 4 → −38.5°, 5 → −74°, 7 → −58.5°, 8 → −73°. They aren't rounded, because rounding 7 to −59° narrows its gap to 8.7 px. This rotates the ring by up to half a step. The tubes stay evenly spaced, and the narrowest screen gap becomes about 8.9 px at 7 and 8, wide enough that tube bodies at rest don't touch.

*Alternatives:* the formula `−π/2 + π/n` for every N, which overlaps at 5 and 8; or raising the camera YAW for high counts, which would change the 6-tube drawing.

### 4. Scale mapping: `sixOf(deg)` → `tubeNotes(deg, n)`
It uses the same wrap-around rule, `deg[k % len] + 12·⌊k / len⌋`, for `k < n`, so `tubeNotes(deg, 6)` equals `sixOf(deg)`. The two callers in `Chime.jsx` (the `scale` memo, now keyed on `unit.scale` and `unit.tubes`, and TEST NOTE) switch over, and `sixOf` is removed. The UI keeps computing `P.scale` and pushes `tubes` and `scale` in the same `setParams` call, so the engine never sees a count without enough offsets. As a backstop, `noteOf(i)` and `tubeLen` read `P.scale[i % P.scale.length]`, so a mismatch can't produce NaN.

### 5. Stepped slider = Radix `step={1}` plus drawn ticks
Radix already snaps the value, and the thumb, to the step while dragging, and the keyboard moves by one step, so TUBES is `ParamSlider min={2} max={8} step={1}`. "Stepped" is made visible with a new optional `ticks` prop on `components/ui/slider.jsx`. It draws `max − min + 1` aria-hidden, `pointer-events-none` spans, each 1 px wide and 3 px tall, 10 px below the track centre so the thumb never hides them. They're positioned with the same thumb-inset formula the SSR placeholder thumb already uses (`calc(pct% + 4.5px·(1 − pct/50))`), so each tick sits exactly under a thumb resting position. They're `bg-foreground`, so they stay two-color. The other sliders don't pass `ticks` and look the same as before.

*Alternative:* a row of seven toggle buttons (a segmented control). It's clearer for a small set, but you asked for a stepped slider, and a slider fits the other rows.

### 6. The readout grid follows the count
`grid-cols-6` becomes an inline `gridTemplateColumns: repeat(n, minmax(0, 1fr))`, because Tailwind can't generate a dynamic class. Pads come from `scale.map`, which already has n entries. `cellRefs` entries for removed pads are set to null by React's ref callback, and the hit listener already skips a missing cell. `strikeTube(i)` ignores `i >= n`.

### 7. Removed tubes' notes need no special handling
Browser voices are scheduled for their full decay when struck, and MIDI note-offs are timers in `lib/midiout.js` keyed by `channel:note`, so both run their course whatever the count becomes. The confirmation arpeggio rings tubes `[0, 2, 4].map(i => min(i, n − 1))`.

### 8. Duplicate pitches are polyphonic (POLY), with a per-unit MONO option
Wrap-around can give two tubes the same note. In the browser this already works: every `ring()` makes new oscillators, or a new SF2 buffer source, or a new PolySynth voice, so strikes never cut each other. Only MIDI does, because `note()` sends a note-off for any sounding `channel:note` before the new note-on.

`note(ch, n, vel, seconds, src, mono)` gains an optional `src` string and a `mono` flag. `ChimeUnit` passes `${unit.id}:${i}` and `unit.midiMode === "mono"`. Each `offTimers` entry becomes `{ timer, end, srcs: Set }`:
- If the note is sounding and either `mono` is set or `src` is already in `srcs` (the same tube again) → note-off, note-on, `srcs = {src}`, and a new timer. This is today's rule, and in MONO it's the whole rule.
- If the note is sounding from other sources and `mono` is off → note-on only, add `src`, and push `end` (and the single timer) out to `max(end, now + seconds)`.
- If the note isn't sounding → note-on and a new entry.

The mode is decided by the strike, not stored on the entry. When a POLY unit and a MONO unit share a channel, each strike follows its own unit's mode: the MONO unit's strike cuts the shared key and the POLY unit's strike stacks on it. A missing `src` (TEST NOTE) counts as its own source, so `testNote` behaves as before.

The UI is a `ParamSelect` labelled MIDI MODE with the values `"poly"` and `"mono"` (shown as POLY and MONO), in the row under CHANNEL. A two-option select was chosen over a checkbox so the row reads `MIDI MODE ....... POLY` like the others, and the popover has no checkboxes today. The unit record gains `midiMode`. On load, anything other than `"mono"` becomes `"poly"`. A mode change needs no MIDI message: notes already sounding end on their own timers. `endNotes`/`allNotesOff` and the disconnect path iterate the same map and clear `timer`, so they're unchanged in behavior.

*Alternative:* cut and retrigger, the current rule. It's rejected by request: a second tube on the same pitch would truncate the first. *Alternative:* send the duplicate on a spare channel. It's rejected because a unit's notes must stay on its channel.

`buildMidi`'s file export keeps its per-note cut rule. It isn't exposed in the UI, so it's left alone.

### 9. Storage: an optional field, clamped on load
Unit records gain `tubes` (and `midiMode`, see 8). Load uses `Math.round(clampNum(r.tubes, 2, 8, 6))`, so older records give 6 and 12 gives 8. COPY already spreads the source record, so it carries `tubes` with no extra code. `windchime.units` stays at `v: 1`.

## Risks / Trade-offs

- [The 6-tube strike sequence drifts through a refactor, for example a reordered float expression] → Before and after the change, render a 120 s `renderTake` with a fixed seed in Node and compare the hits exactly. That needs a seed hook into `renderTake`, a test-only optional argument, or a direct `makeSim`/`step` loop.
- [Hit areas overlap at 7–8 tubes: centres about 8.9 px apart, hit area ±6 px] → Nearest-wins already resolves overlaps, and the spec allows them. Check by tapping each tube's centreline at 8 tubes.
- [8 pads on a narrow phone: about 286 px of canvas means pads about 35 px wide] → Note names are at most 3 characters at 13 px, and Hz is at most 4 digits at 10 px, so they fit. Check at 320 and 375 px.
- [Two note-ons for the same key with no note-off in between: some receivers retrigger one voice instead of stacking two, and a few mono-per-key synths may treat the single final note-off oddly] → This is the standard MIDI behavior for overlapping same-key notes; hardware that stacks voices (most polysynths, samplers) gets real polyphony. It needs checking on real hardware, which only a person can do.
- [Tubes jump to new angles when the count changes] → Accepted; it's instant like the rest of the UI. The 80 ms cooldown stops a jump into the clapper from sounding.
- [Strike rate rises with count, up to about 8/6 of today's at 8 tubes, possibly more because the gaps between tubes are narrower] → Intended (proposal). It's worth measuring once and noting in `CLAUDE.md`.

## Migration Plan

No data migration: records without `tubes` load as 6. On rollback, the previous build's load validation keeps only the fields it knows, so a saved `tubes` is dropped and every unit goes back to six tubes with its other settings intact. This change should be archived after `copy-chime-units` (see the proposal).

## Open Questions

- The exact tick-mark height and gap under the track. It's a visual tweak, settled in the browser.
