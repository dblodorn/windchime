# Proposal

## Why

The page holds one chime. Copying a unit, along with its current scale, voice, filter and wind, lets a player layer chimes, for example two tunings side by side or a fast and a slow wind, without setting each one up from scratch. Each unit's set-up should survive a reload, as the single unit's position already does.

## What Changes

- **Copy button:** each chime unit gets a fourth 30 px round button in the drawing's top-left corner. It shows Lucide's `CopyPlus` icon and is named "COPY".
- **Copying:** pressing COPY adds a new unit next to the one copied. There can be at most 16 units, one per MIDI channel; COPY is disabled on every unit at 16. It is a separate chime with its own simulation and seed, and it starts with the copied unit's current parameters: VOLUME, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE and SOUNDFONT. It also starts with that unit's SOUND and NOTES states. Its MIDI channel is the lowest one no other unit uses.
- **Unit controls:** each unit has its own SOUND toggle, SETTINGS popover, NOTES drawer, note pads and drag. Tapping a unit's tubes or pads strikes only that unit.
- **Volume:** each unit's settings popover gets a VOLUME slider as its first row (0–1, step 0.01, default 1.00, which is today's level). It scales only that unit's browser sound; MIDI notes and velocities are unchanged.
- **Removing:** any unit can be removed except the last one, so the page always shows at least one. The control is a REMOVE button at the end of that unit's settings popover.
- **Saving:** the units are saved in localStorage, each with its own parameters, NOTES state, MIDI channel, position and stacking order, and they're restored on load. SOUND isn't restored: browsers only start audio from a tap, so every unit loads muted.
  - **BREAKING (stored data only):** this replaces the single `windchime.pos` key with a per-unit record. An existing `windchime.pos` becomes the first unit's position, so nothing is lost.
- **MIDI:** all units share the MIDI OUT port the user selects, and the SEND options, PLAY SOUND IN BROWSER TOO, TEST NOTE and PANIC in the MIDI dialog.
  - **Per-unit channel:** each unit has its own CHANNEL select, a row in its settings popover, so one port can drive up to 16 voices.
  - **Per-unit messages:** each unit's strikes, program change and CC74/71 go out on its own channel.
  - **TEST NOTE and PANIC:** TEST NOTE plays each unit's first tube on that unit's channel. PANIC ends every unit's notes on every channel in use.
  - **BREAKING:** CHANNEL moves out of the MIDI dialog. The saved channel becomes the first unit's.
- **Engine:** audio and the simulation move from one module-level chime to one per unit. The audio context and output stage stay shared.

## Capabilities

### New Capabilities
- `chime-units`: several chime units on one page: creating a copy that inherits the source's state, removing a unit (never the last), per-unit independence (simulation, parameters, sound, strikes), and saving and restoring every unit's state and position in localStorage.

### Modified Capabilities
- `ui-controls`:
  - the rounded-corner and icon exception grows to four round buttons, adding COPY in the top-left;
  - a VOLUME slider joins the parameter rows;
  - the parameter popover, notes drawer and drag requirements apply to each unit, not to the page;
  - the "remembered position" scenario moves to per-unit storage;
  - the accessible names must tell units apart.
- `midi-output`:
  - channel selection becomes per unit;
  - each unit's strikes, program change and filter CCs go on its own channel to the shared port;
  - TEST NOTE and PANIC cover every unit.
- `midi-dialog`: CHANNEL leaves the dialog; the rest of the dialog's contents and behavior stay.
- `chime-drawing`: each unit draws its own chime from its own simulation; a tap strikes a tube of the unit tapped.

## Impact

- **`lib/engine.js`:**
  - module-level `P`, `sim`, the voice choice and the filter chain become per-unit instances. `attach`, `strikeAt`, `strikeTube`, `setParams`, `chooseVoice`, `onHit` and `noteOf` take a unit.
  - `renderTake`/`buildMidi` stay as they are, for one unit.
  - The simulation constants and strike-rate tuning don't change.
- **`components/Chime.jsx`:** splits into a page component that owns the unit list, MIDI and storage, and a per-unit component (drawing, round buttons, popover, drawer, drag).
- **Storage:** new `windchime.units` record; a migration from `windchime.pos`.
- **Dependencies:** none new. `lucide-react` (`CopyPlus`) and `motion` are already installed.
- **Performance:** each unit runs its own 240 Hz simulation and raster, and plays its own voices. There are at most 16 units.
- **Docs:** `CLAUDE.md` (engine sections, the visual-language exception, layout), plus the spec deltas above.
- **Tests:** the scratch Playwright checks assume a single unit and its accessible names, so they'll need unit-scoped lookups.
