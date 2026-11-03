# Design

## Context

See `proposal.md` for the motivation and `specs/` for the behavior.

The code today assumes exactly one chime:
- **`lib/engine.js`** keeps all chime state at module level, then drives it with one requestAnimationFrame loop and one `attach(canvas)`:
  - the parameters `P`, the simulation `sim` and the wind `streaks`;
  - the voice (`voice`/`sfPreset`/`sfRegions`) and the filter chain (`bus` → `filter` → compressor → gain);
  - the shared FM `PolySynth`, `soundOn`/`muted`, the hit listeners and the recording state.

  The 200×200 drawing buffer `buf` and the `present()` target (`ctx2d`/`img`) are module-level too.
- **`lib/midiout.js`** holds one `channel`, and `offTimers` is keyed by note number only.
- **`components/Chime.jsx`** is one component that owns:
  - every parameter, the SOUND and NOTES state, and the drag position (`windchime.pos`);
  - the MIDI state, the program-change and CC resend effects, and the MIDI dialog.

Constraints that carry over:
- **Simulation:** the strike sequence for a given seed must not change, so `step()`'s math and its random-number order stay the same.
- **Audio start:** audio may only start inside a tap.
- **Server rendering:**
  - nothing touches `window` or `document` at module top level;
  - nothing browser-only is read during render;
  - the two colors, 1px lines and Courier Prime stay.

## Goals / Non-Goals

**Goals:**
- **Engine:** a chime-instance engine where each unit owns its simulation, parameters, voice, filter and hit listeners. One animation loop and one audio context are shared.
- **React structure:** a page component that owns the unit list, storage, MIDI and the dialog; a unit component that renders one chime and its controls.
- **Storage:** a stored unit list that survives schema drift (renamed scales, missing voices) and carries over the single-unit keys.

**Non-Goals:**
- **Recording and MIDI files:** no multi-unit recording or `.mid` export. `startRec`/`renderTake`/`buildMidi` keep working per instance but stay out of the UI.
- **Undo:** no undo for REMOVE.
- **Layout and sharing:** no syncing state across tabs, no automatic layout or tidying of units, and no per-unit MIDI port.

## Decisions

### 1. `createChime()` instances, shared module services
`lib/engine.js` exports `createChime({ seed })`. It returns an instance with:
- `P` and `noteOf(i)`;
- `setParams`, `chooseVoice`, `midiProgram`;
- `attach(canvas)`, `tubeSegments()`, `strikeAt(x, y)`, `strikeTube(i)`, `onHit(fn)`;
- `setSound(on)` for this unit's audibility;
- `renderTake`, `startRec`/`stopRec`;
- `destroy()`.

**What moves into the instance:**
- the simulation (`makeSim`) and the streaks;
- the voice and soundfont regions;
- a per-unit input `GainNode` and a per-unit `Tone.Filter`, which feed a **shared** compressor → gain → destination;
- a lazily created FM `PolySynth`, built only when that unit picks FM CRYSTAL;
- the hit listeners and the recording state.

**What stays module-level and shared:**
- `Tone`/`actx`, the shared output stage and `fonts`;
- `preloadAudio`, `startAudio()` (unlock + `Tone.start()` + `resume()`, called synchronously from a SOUND tap), `setMuted` (PLAY SOUND IN BROWSER TOO);
- `addFont`/`findPreset`, the pure helpers (`noteName`, `mtof`, `cutoffHz`, `sixOf`, `SCALES`, `SCALE_LIST`, `VOICES`, `GM_FAMILIES`) and `buildMidi`.

`step(sim, P, dt, onHit)` takes the instance's `P` instead of reading the module's. The math and the order of `rnd`/`gauss` calls stay identical, so a given seed gives the same strikes. `sim-same` checks this against `main`.

*Alternative:* keep a default module-level chime and add extra instances beside it. Rejected: it would give the first unit two code paths and make "remove the first unit" a special case.

### 2. One animation loop for every unit
A module-level registry holds the attached instances, and a single `requestAnimationFrame` `tick` steps each instance's simulation (fixed 240 Hz, with its own accumulator) and draws it.
- `attach` adds the instance to the registry and starts the loop if it isn't running.
- The cleanup removes it and stops the loop when the registry is empty.

The 200×200 `buf` stays a single module scratch buffer. Each instance draws into it, then `present()`s to its own `ImageData`/2D context. Drawing is sequential, so sharing is safe and saves 16 × 40 KB.

*Alternative:* one loop per unit. Rejected: 16 rAF callbacks per frame, each with its own timing, for no gain.

### 3. Audio graph per unit, sound per unit
Each unit's voices connect to its input gain. The gain's target is VOLUME while the unit's SOUND is on and 0 while it's off, ramped over about 40 ms so a VOLUME drag doesn't click. SOUND and a VOLUME of 0 both gate `ring()`, so a silent unit doesn't schedule nodes. VOLUME 1.00 is today's level, because the gain is placed before the existing filter, compressor and output stage. VOLUME never touches MIDI.
- **Starting audio:** a SOUND tap calls the shared `startAudio()` the first time (inside the gesture, as today), then turns that unit on.
- **Stopping audio:** turning the last unit off pauses the iOS unlock element, as `toggleSound` does now.
- **Per-unit filter:** each unit's FREQUENCY/RESONANCE drive its own `Tone.Filter`. A shared filter would make one unit's filter move every unit.

*Alternative:* one filter, with per-unit filtering done in MIDI only. Rejected: the spec requires each unit's strikes to play through its own voice and filter.

### 4. MIDI: channel on every call
`lib/midiout.js` drops the module `channel`; `note`, `testNote`, `program`, `cc` and `allNotesOff` take a channel as their first argument.
- **`offTimers`** are keyed by `channel:note`, so the re-strike rule is per channel.
- **Changing a unit's channel** calls `endNotes(oldChannel)`. That also ends notes another unit is sounding on the same channel. It's rare, since copies get distinct channels, and harmless.
- **`allNotesOff(channels)`** sends the note-offs, then CC123/CC120 on each listed channel. PANIC passes every channel in use.
- **Port lifecycle** (`wanted`, `adopt`, `setLive`, `linkSeq`) is unchanged.

The per-unit program-change and CC effects move into the unit component. They're keyed on the unit's `prog`, filter, channel, the shared `linkSeq` and the SEND flags, so mounting a new unit sends its setup once.

*Alternative:* a channel per unit inside `midiout`, with unit ids. Rejected: `midiout` doesn't need to know about units, and a channel number is enough.

### 5. Components and state
`Chime.jsx` becomes:
- **`ChimePage`** (the default export). It owns:
  - the `units` array, and the GM font load and `fontsVersion`;
  - the MIDI state, connect, ports and SEND flags, plus the MIDI dialog with TEST NOTE (one note per unit) and PANIC (every unit's channel);
  - storage.
- **`ChimeUnit({ unit, index, count, onChange, onCopy, onRemove, onFront, … })`**. It renders:
  - the `motion.section` (labelled region "CHIME n"), canvas and four round buttons;
  - the SETTINGS popover (nine rows, VOLUME first, plus REMOVE when `count > 1`) and the notes drawer.

  It creates its engine instance in a mount effect and destroys it on unmount. It pushes params into the instance with effects, and runs the per-unit MIDI effects.

The unit record is plain data: `{ id, volume, wind, decay, cutX, q, root, scale, voice, channel, notes, x, y, z }`, plus SOUND, which is kept in memory but not stored (see 7). Edits go through `onChange(id, patch)`, so the record is the single source of truth for storage and copying.
- **COPY** clones the record with:
  - a new `id`;
  - `channel` set to the lowest free channel;
  - `x + 24, y + 24`, clamped;
  - `z` above the highest.
- **The new engine instance** gets a fresh random seed. Its simulation starts at rest, which meets "move on their own".

**Shared slider values:** high-rate slider moves update the record, as they update local state today. The engine push is effect-driven, as now.

*Alternative:* keep per-unit state inside `ChimeUnit` and report it up. Rejected: copying and saving would need state pulled back out of each child.

### 6. Layout and stacking
`<main>` stays `fixed inset-0` with the 16 px or safe-area padding. Every unit is placed in the same grid cell (`[grid-area:1/1]`, `place-self-center`), so each unit's motion `x`/`y` is an offset from the viewport's center.
- **Stored positions are center offsets:** units stay put relative to the center when the window resizes, and the first unit's (0, 0) is the current centered layout.
- **Drag** works as today for each unit: `dragControls.start` on an empty-paper press, `dragConstraints={mainRef}`, no elastic or momentum.
- **Clamping:** the restore-and-clamp effect runs per unit.
- **Stacking:** `z` is an integer per unit, applied as `zIndex`. `onFront(id)` sets it to the highest `z` + 1 on any pointerdown inside a unit, in the capture phase so it runs before a strike or drag starts.
  - **Renumbering:** when `z` grows past 1000 the values are renumbered 1…n. It's cheap, and keeps stored values small.

**Popover and the MIDI button:** the popover is portaled, so z-index doesn't matter for it. The MIDI button stays fixed at z-40, and units get z-index below it.

### 7. Storage format and migration
The stored data is `windchime.units`: `{ v: 1, units: [record…] }`, written from an effect on `units` and debounced by 250 ms so slider drags don't write on every frame. The other keys stay where they are: the port name, the SEND flags and PLAY SOUND IN BROWSER TOO.

**Each stored value is checked on load:**
- **Scale:** `scale` is stored by **name**, not by index, because indexes shift when the catalog changes. An unknown name falls back to RYUKYU.
- **Voice:** `voice` keeps the `v<i>`/`s0:<preset>` id. An `s` id that doesn't exist in the loaded font falls back to TUBULAR BELLS once the font loads.
- **Numbers:** they're clamped to the slider ranges, and `channel` to 1–16.

**Other load rules:**
- **Unit list:** more than 16 records are cut to 16. An empty or unreadable list becomes one default unit.

**Migration:** when `windchime.units` is missing, the first unit is built from defaults plus `windchime.pos` (x, y) and `windchime.midiCh` (channel). Once the new record is written, both old keys are removed.

**SOUND is not stored:** every unit loads muted, because browser audio can only start from a tap. COPY still copies the source's current SOUND state within the visit. The `chime-units` spec is updated to say this, replacing "saved SOUND state".

**Server rendering:** the server renders one default unit, whose markup matches today's. The stored list is read in a mount effect and replaces it. Restored units then appear in the same frame as the clamp, so there's no hydration mismatch, and a returning visitor sees at most one frame of the default unit at the center.

### 8. Tests
The scratch Playwright checks scope their lookups to a unit's region: `page.getByRole("region", { name: "CHIME 1" })`.
- **`midi-check`:** CHANNEL moves from the dialog into the unit's popover.
- **`sim-same`:** it compares `main`'s module API with `createChime({ seed }).renderTake`, using a small shim that sets `Math.random` the same way.
- **New `units-check`:**
  - copy inheritance, the lowest free channel, the 24 px offset and front-most placement;
  - the 16 cap, REMOVE and renumbering;
  - per-unit strikes and channels, TEST NOTE and PANIC across channels;
  - reloading restores the list, and migration from `windchime.pos`/`windchime.midiCh`.

## Risks / Trade-offs

- **[CPU with 16 units]** Each unit runs 240 sim steps per second and redraws a 200×200 raster every frame. → Measured on 2026-11-02 in headless Chromium on this Mac, production build, 16 units at WIND 1.0: frames stay at 60 fps (avg and p95 frame interval 16.7 ms, the same as one unit), and the shared loop's work is avg 1.84 ms, p95 2.10 ms per frame. No optimization needed; phones are slower and untested.
- **[Audio node count]** Sixteen units at high wind can schedule many oscillators at once. → Muted units schedule nothing (decision 3). The shared compressor guards the output level, and voices already stop themselves.
- **[Channel sharing]** Two units on the same channel share note-off timing (`channel:note` keys), and one's channel change ends the other's notes. → Documented; copies default to distinct channels.
- **[Stored ids for voices]** `s0:<preset>` assumes the GM font stays at index 0. → Same assumption as today, documented in `CLAUDE.md`. A missing preset falls back to TUBULAR BELLS.
- **[Popover anchored to a dragged unit]** A unit can't be dragged while its popover is open: the press outside closes the popover first. → No action needed.
- **[First-frame jump for returning visitors]** One default-centered frame shows before the stored layout is applied. → Accepted. The alternative, rendering nothing until mount, would break the prerendered page.

## Migration Plan

1. Ship in one PR: engine instances, the `midiout` channel argument, the component split, storage with migration, and docs and specs.
2. On first load after deploy, `windchime.units` is built from `windchime.pos`/`windchime.midiCh`, and those two keys are removed. No rollback path is kept.
