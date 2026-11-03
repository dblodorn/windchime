# Tasks

## 1. Setup

- [x] 1.1 Create branch `copy-chime-units` from an up-to-date `main`; verify `git status` is clean on the new branch
- [x] 1.2 Back up the scratch Playwright checks (`*.pre-units.mjs`) and record a baseline: all five checks plus `sim-same` pass against a production build of `main`

## 2. Engine: chime instances

- [x] 2.1 Make `step(sim, P, dt, onHit)` take the parameters it reads, without changing its math or its `rnd`/`gauss` call order; verify `sim-same` (shimmed for the new API) still reports SIM IDENTICAL
- [x] 2.2 Add `createChime({ seed })`, moving `P`, `noteOf`, the simulation, the streaks, the voice/soundfont regions, the hit listeners and the recording state into the instance (`setParams`, `chooseVoice`, `midiProgram`, `tubeSegments`, `strikeAt`, `strikeTube`, `onHit`, `renderTake`, `startRec`/`stopRec`, `destroy`); verify in Node that two instances with different seeds give different `renderTake(60)` hits, and that `setParams` on one doesn't change the other's `P`
- [x] 2.3 Replace `attach`/`tick` with a module registry and one shared requestAnimationFrame loop. Each instance steps at 240 Hz with its own accumulator, draws into the shared scratch `buf` and presents to its own canvas; the loop stops when no instance is attached. Verify two attached canvases animate independently and the loop stops after both detach
- [x] 2.4 Split the audio graph:
  - **Shared:** `startAudio()` (unlock + `Tone.start()` + `resume()`, synchronous in the tap), the compressor → gain → destination output stage, and `setMuted`.
  - **Per instance:** an input gain (target = VOLUME while SOUND is on, else 0, ramped about 40 ms), a `Tone.Filter`, a lazily built FM PolySynth, `setSound(on)` and a `volume` param; a muted or VOLUME-0 instance schedules no nodes.

  Verify in the browser that two units with different FREQUENCY or VOLUME values sound different, and that a muted or VOLUME-0 unit schedules nothing.
- [x] 2.5 Update the engine smoke test in `CLAUDE.md` and confirm `node -e 'import("./lib/engine.js").then(m => console.log(m.SCALE_LIST.length, typeof m.createChime))'` prints `32 function`

## 3. MIDI: channel per call

- [x] 3.1 In `lib/midiout.js`, remove the module channel. `note`, `testNote`, `program` and `cc` take `channel` first; `offTimers` are keyed `channel:note`; add `endNotes(channel)`; `allNotesOff(channels)` sends note-offs, then CC123/CC120 on each listed channel. Verify with the fake-port stub: notes on channels 1 and 2 keep separate re-strike timing, and `allNotesOff([1, 4])` sends CC123/120 on both channels
- [x] 3.2 Keep the port lifecycle (`wanted`, `adopt`, `setLive`, `linkSeq`) unchanged; verify the unplug/replug and new-id cases in `midi-check` still pass

## 4. Components

- [x] 4.1 Split `components/Chime.jsx` into `ChimePage` (the default export: unit list, GM font load, MIDI state and dialog, storage) and `ChimeUnit` (a `motion.section` region "CHIME n", canvas, the round buttons, the SETTINGS popover, the notes drawer, and its own engine instance created on mount and destroyed on unmount); verify the page renders one unit identical to today's and `pnpm build` passes with no hydration warnings
- [x] 4.2 Move the parameter state into the unit record (`{ id, volume, wind, decay, cutX, q, root, scale (by name), voice, channel, notes, sound, x, y, z }`), updated through `onChange(id, patch)`, and push it into the instance with effects; add the VOLUME row (0–1, step 0.01, default 1.00) as the popover's first row. Verify sliders, including VOLUME, and selects still change only their own unit, and that VOLUME changes no MIDI bytes
- [x] 4.3 Add the CHANNEL row (1–16, with 10 labelled GM DRUMS) to each unit's popover and remove it from the MIDI dialog. Changing it calls `endNotes(old)`. Per-unit program change and CC effects are keyed on the unit's prog, filter, channel, the shared `linkSeq` and the SEND flags. Verify each unit's strikes, program change and CC74/71 go out on its own channel, and that a newly mounted unit sends its setup once
- [x] 4.4 Route SOUND per unit: the first tap calls `startAudio()` inside the gesture, then `setSound(true)`; turning the last unit off pauses the iOS unlock element. Verify on desktop Chrome that each unit's SOUND controls only that unit. iOS is checked by hand
- [x] 4.5 Add the COPY button (top-left, 30 px round, `CopyPlus` with `crispEdges`, `aria-label="COPY"`). It clones the record with a new id, the lowest free channel, `x + 24`/`y + 24` clamped to the viewport, and `z` = max + 1, and is disabled on every unit at 16. Verify copying inherits VOLUME, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, SOUND and NOTES, and that COPY is dimmed and inert at 16
- [x] 4.6 Add REMOVE at the end of the popover while `count > 1`. It ends that unit's notes (`endNotes` on its channel) and removes it, and the remaining units renumber CHIME 1…n. Verify REMOVE is absent with one unit and renumbering works after removing a middle unit
- [x] 4.7 Bring a unit to the front on capture-phase pointerdown (`z` = max + 1, renumbered when it passes 1000). The MIDI button stays above all units. Verify pressing the lower of two overlapping units raises it
- [x] 4.8 Layout: every unit sits in the same centered grid cell (`[grid-area:1/1]`), with `x`/`y` as offsets from the center. Each unit drags from empty paper within `mainRef` and is clamped on restore. Verify the single unit is centered on a first visit, and that dragging one unit leaves the others in place
- [x] 4.9 Name each settings popover "SETTINGS CHIME n", and update the MIDI dialog's TEST NOTE (one note per unit on its channel) and PANIC (`allNotesOff` of every channel in use); verify both against two units on channels 1 and 2

## 5. Storage

- [x] 5.1 Save `windchime.units` as `{ v: 1, units }`, debounced by 250 ms, with SOUND left out. Verify a reload restores three units' VOLUME, scales, channels, NOTES, positions and stacking order, with every unit muted
- [x] 5.2 Check stored values on load:
  - an unknown scale name falls back to RYUKYU;
  - a missing `s` voice falls back to TUBULAR BELLS once the font loads;
  - numbers are clamped to their ranges, and channel to 1–16;
  - more than 16 units are cut to 16;
  - an unreadable record becomes one default unit.

  Verify with hand-made bad records in Playwright.
- [x] 5.3 Migrate from the single-unit keys: with no `windchime.units`, CHIME 1 takes `windchime.pos` and `windchime.midiCh`, and both old keys are removed after the first save. Verify with seeded old keys
- [x] 5.4 Keep the server render to one default unit and apply the stored list in a mount effect; verify no hydration warnings with and without stored units, and that storage throwing on every access still gives a working page

## 6. Docs and checks

- [x] 6.1 Update `CLAUDE.md`:
  - engine sections (instances, the shared loop and output stage, per-unit graph);
  - `midiout` channel-per-call;
  - component split and unit record;
  - the four-round-button exception (COPY added);
  - layout and stacking;
  - storage keys and migration.

  Verify no remaining references to the removed module-level APIs.
- [x] 6.2 Update the scratch checks to look controls up within a unit's region (`getByRole("region", { name: "CHIME 1" })`), move CHANNEL into the unit popover in `midi-check`/`ui-check`/`midi-dialog-check`, and shim `sim-same` for `createChime`; verify all of them pass against a production build
- [x] 6.3 Write `units-check.mjs`. It covers:
  - copy inheritance, the lowest free channel, the 24 px offset and front-most placement;
  - the 16 cap, REMOVE and renumbering;
  - per-unit strikes and channels, TEST NOTE and PANIC across channels;
  - one popover open at a time;
  - restore and migration.

  Verify it passes at 1280 and 375 px.
- [x] 6.4 Measure the frame time with 16 units at WIND 1.0 in headless Chromium, and record the result in `design.md` (Risks). Optimize only if it misses 60 fps on the laptop
- [x] 6.5 Run `openspec validate copy-chime-units --strict` and confirm the change is valid

## 7. Ship

- [ ] 7.1 Commit with the attribution lines, push the branch, open a PR describing units, per-unit channels, storage migration and the checks run; confirm the Vercel preview builds
