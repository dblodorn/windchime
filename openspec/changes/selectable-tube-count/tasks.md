# Tasks

## 1. Setup and baseline

- [x] 1.1 Archive `copy-chime-units` first (`/opsx:archive copy-chime-units`) so `openspec/specs/chime-units` exists; verify `openspec validate selectable-tube-count --strict` no longer reports the `chime-units` archive notice
- [x] 1.2 Create branch `selectable-tube-count` from an up-to-date `main`; verify `git status` is clean on the new branch
- [x] 1.3 Write a Node baseline script (in the scratchpad, not the repo) that runs `makeSim(seed)` + `step` for 120 s at 240 Hz with a fixed seed and default params, and saves the hits `(tube, velocity, t)` to JSON; run it on `main` and keep the output as the 6-tube reference

## 2. Engine: tube count and layout

- [x] 2.1 Add `layout(n)` (cached per n) returning `ang`/`rest` for tube i at `start(n) + i·2π/n`, with `start(6) = −π/2 + π/6` and the other starts from design.md (2 → −20°, 3 → −50°, 4 → −38.5°, 5 → −74°, 7 → −58.5°, 8 → −73°); verify in Node that `layout(6)` angles equal today's `ANG` exactly (`===`), and that for n = 2…8 the narrowest screen-x gap between rest tube centres matches the design table (≥ 8.9 raster px, except 6 at today's 8.1)
- [x] 2.2 Make `makeSim(seed, n = 6)` store its layout on the sim and size `sim.tubes` from it; switch `step`, `tubeGeom`, `strikeTube` and `tubeSegments` from the module `REST`/`ANG` to the sim's layout, and remove the module constants; verify the baseline script from 1.3 gives identical hits on the branch
- [x] 2.3 Add `tubes: 6` to `defaultParams()` and handle `setParams({ tubes })`: clamp to 2–8, swap the sim's layout, keep tubes 1…min(old, new) with their state, add new tubes at rest, and set every tube's `cool` to 0.08; leave `s`, `F`, `phi`, `g` and the rng untouched. Verify in Node that changing 6 → 8 → 3 mid-run keeps the clapper position continuous across the change and produces no strike in the 80 ms after it from a tube that wasn't moving
- [x] 2.4 Replace `sixOf(deg)` with `tubeNotes(deg, n)` (same wrap rule, k < n) and remove `sixOf`; make `noteOf`/`tubeLen`/`ring` read `P.scale[i % P.scale.length]` as a backstop; make `strikeTube(i)` ignore `i >= n`; pass the unit's count to `makeSim` in `renderTake`. Verify `tubeNotes(PYEONGJO, 8)` is `[0,2,5,7,9,12,14,17]`, `tubeNotes(DORIAN, 8)` ends in `12`, `tubeNotes(PYEONGJO, 3)` is `[0,2,5]`, and `tubeNotes(deg, 6)` equals the old `sixOf(deg)` for all 32 scales
- [x] 2.5 Clamp the SOUND confirmation arpeggio to `[0, 2, 4].map(i => min(i, n − 1))`; verify that with 2 tubes the arpeggio rings only tubes 0 and 1, with no NaN note (check the indices in Node, or listen in the browser)
- [x] 2.6 Measure strikes per minute at WIND 0.45 for n = 2…8 (5 minutes each, fixed seed) and verify the count rises from 2 to 8; record the numbers for `CLAUDE.md`
- [x] 2.7 Check the figure fits at rest for n = 2…8 (WIND 0, settled, longest-tube scale): verify no tube's `tubeSegments()` endpoint falls outside 0–200

## 3. MIDI: POLY and MONO

- [x] 3.1 In `lib/midiout.js`, change `note(ch, n, vel, seconds, src, mono)` so each `offTimers` entry is `{ timer, end, srcs }`: same `src` or `mono` → note-off then note-on (today's rule); a different `src` in POLY → note-on only, add `src`, extend the single note-off to the later end; not sounding → new entry. A missing `src` is its own source. Verify with the fake-port stub: two sources on one key in POLY give on, on, then one off at the later end; in MONO they give on, off, on, off; one source re-struck gives off before the second on in both modes
- [x] 3.2 Update `endNotes`, `allNotesOff` and the disconnect path for the new entry shape; verify with the stub that PANIC ends a stacked key with one note-off plus CC123/120, and that unplugging drops timers without sending

## 4. Components

- [x] 4.1 Add `tubes` (default 6) and `midiMode` (default `"poly"`) to the unit record and its load check (`Math.round(clampNum(r.tubes, 2, 8, 6))`; anything but `"mono"` → `"poly"`); verify that a stored list without either field loads as 6/POLY, `tubes: 12` loads as 8, `tubes: 3.4` as 3, and that COPY carries both (it spreads the record)
- [x] 4.2 Key the `scale` memo on `unit.scale` and `unit.tubes` via `E.tubeNotes`, and push `tubes` with the other params in the same `setParams` call; switch TEST NOTE to `tubeNotes(…, 1)[0]`; verify the SCALE row shows N offsets (`0 +2 +5 +7 +9 +12 +14 +17` for PYEONGJO at 8, C5)
- [x] 4.3 Pass `` `${unit.id}:${i}` `` and `unit.midiMode === "mono"` from the hit listener to `M.note`; verify with Playwright and the fake port that CHINESE GONG at 8 tubes, ROOT C5, striking pads 6 and 8 sends `0x90 84` twice with no `0x80 84` between in POLY, and an `0x80 84` between in MONO
- [x] 4.4 Add an optional `ticks` prop to `components/ui/slider.jsx` that draws `max − min + 1` aria-hidden, pointer-events-none 1×3 px `bg-foreground` marks 10 px below the track (clear of the thumb), placed with the thumb-inset formula; verify the other sliders are unchanged and each tick sits under a thumb resting position at 2, 5 and 8 (screenshot or bounding-box check)
- [x] 4.5 Add the TUBES row (`ParamSlider min={2} max={8} step={1} ticks`, value shown as a plain number) directly above WIND; verify by role that the slider is named TUBES with min 2, max 8, value 6, that Arrow Right / End / Home give 7 / 8 / 2 with the drawing and readout following, and that a slow drag only ever lands on whole numbers
- [x] 4.6 Add the MIDI MODE row (`ParamSelect`, options POLY and MONO, values `"poly"`/`"mono"`) directly under CHANNEL; verify by role the combobox is named MIDI MODE, lists POLY and MONO, starts at POLY, and the popover has eleven rows in order VOLUME, TUBES, WIND, …, CHANNEL, MIDI MODE
- [x] 4.7 Render the readout with `gridTemplateColumns: repeat(n, minmax(0, 1fr))` instead of `grid-cols-6`; verify at 1280 and 375 px that the readout's outer width equals the canvas's for 2 and 8 tubes, that 8 pads fit on one row with no horizontal page scroll at 320 and 375 px, and that switching 6 → 8 → 2 with the drawer open updates the pads at once
- [x] 4.8 Make the canvas `aria-label` say the current tube count instead of "six tubes"; verify it reads e.g. "eight tubes" after TUBES is set to 8

## 5. Integration checks

- [x] 5.1 Tap each tube's centreline halfway down at n = 2, 5 and 8 (Playwright, using `tubeSegments()` coordinates); verify each tap strikes that tube only, and a tap on the top-left corner strikes nothing and starts a drag
- [x] 5.2 Lower TUBES from 8 to 4 right after striking tube 8 with a MIDI port selected; verify tube 8's note-off is still sent at its DECAY time, without needing PANIC, and that every note-on sent has a matching note-off
- [x] 5.3 Reload with three units at different tube counts and MIDI modes; verify each comes back with its count, mode, scale, channel and position
- [x] 5.4 Check the two-color rule on the new rows: every computed color in the TUBES row (ticks included) and MIDI MODE select is black or white, no radius, no shadow
- [x] 5.5 `pnpm build` passes and the production page loads in Chromium with no hydration or React errors in the console

## 6. Docs

- [x] 6.1 Update `CLAUDE.md`: "six-tube" wording, `tubeNotes` in section 2, `P.tubes` in section 3, the per-sim layout and start-angle table in section 4, TUBES and MIDI MODE in the popover row list, `tubes`/`midiMode` in the unit record shape and load checks, the POLY/MONO `note()` rule in the MIDI port lifecycle notes, and the measured strikes per minute by tube count; verify no stale "six"/`sixOf` references remain (`grep -n "six\|sixOf" CLAUDE.md lib components`)
- [x] 6.2 Update the `scales` main spec's Purpose (it says "the six tubes") in `openspec/specs/scales/spec.md`; verify `openspec validate --specs --strict` passes
- [x] 6.3 Note for a person to check: POLY stacking on real MIDI hardware, and the stepped slider by touch on iOS
