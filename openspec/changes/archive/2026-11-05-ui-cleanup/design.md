# Design

## Context

See proposal.md for why, and the four delta specs for the behavior. The parts of the current code that shape the approach:

- `Chime` already has one path that swaps the whole composition: `replaceComposition(us)` ends every old unit's MIDI notes (`M.endNotes(channel)`) and calls `setUnits`. The 250 ms save effect then writes the new units over `windchime.units`. Share links (mount and `hashchange`) and saved compositions (`openSaved`) both use it.
- Every record that enters the page goes through `Sh.UnitSchema`, whose `sound` field is `z.literal(false).catch(false)`. Records from a link or a saved composition always arrive muted.
- A unit's SOUND button runs `await E.startAudio()` in the tap, then sets `sound: true`. `ChimeUnit` pushes `unit.sound` into the engine with `chime.setSound(on)`, which builds the unit's graph, loads its samples and plays a three-note confirmation arpeggio.
- `E.startAudio()` does the gesture-sensitive work (`unlockAudio`, `Tone.start()`, `actx.resume()`) synchronously, as long as Tone is already imported. `preloadAudio()` on mount makes sure it usually is.
- A composition row's click calls `Compositions`' `open(saved)` → `Sh.fromSaved` → `onOpen(units)` → `openSaved` in `Chime`, all synchronously inside the click.
- The fixed lower-right row is three buttons, positioned by hand: MENU at `right: 16px + 168px`, SHARE at `16px + 84px`, MIDI at `16px` (76 px buttons, 8 px gaps).
- The notes readout `.tubes` is a grid of `<button>`s with no background. Hover and `.tubes .hit` (the strike flash, in the components layer) set black.

## Goals / Non-Goals

**Goals:**
- One replace path for links, saved compositions and RESET, so MIDI notes end the same way for all three.
- Audio for a loaded composition starts inside the row's click, the same way SOUND's tap does.
- Loading 16 units with sound on doesn't fire 16 confirmation arpeggios.

**Non-Goals:**
- Sound on for share links (no tap; see proposal).
- An undo or a confirmation for RESET.
- Removing `unitCount` from the GraphQL fragment. It is harmless to keep fetching, and leaving the query alone avoids touching the persisted-operation allowlist.

## Decisions

### RESET reuses `replaceComposition`
`reset = () => replaceComposition([{ ...defaultUnit(newId()) }])`. `defaultUnit` already gives the first-visit unit: the schema defaults, channel 1, `x = y = 0` (the center cell), `z = 1`, `notes: false`, `sound: false`. A fresh id (not `"u1"`) matters: React keys `ChimeUnit` by id, so reusing an old id would keep that unit's engine instance and its simulation state instead of starting from rest. The save effect stores the result, as it does for links.

Alternative: a separate "clear storage and reload" RESET. Rejected: a reload drops the MIDI port connection and the loaded soundfont tables, which RESET must keep.

### Loading with sound: start audio in the click, then flip SOUND on the loaded ids
`openSaved(records)` becomes:
1. Call `E.startAudio()` first, synchronously in the click, keeping the promise. Its synchronous part (unlock, `Tone.start()`, `resume()`) runs inside the gesture.
2. `replaceComposition(freshUnits(records))` and close the panel at once, as now. The units load muted for a moment.
3. When the promise resolves, set `sound: true` on the units whose ids were just loaded and are still on the page, through one `setUnits` map. If it rejects, log it like `onSound` does and leave them muted.

`Compositions`' bad-composition branch returns before `onOpen`, so a composition that fails `fromSaved` starts no audio.

Alternatives: awaiting `startAudio` before replacing. Rejected: it delays the swap and the panel closing behind an async step for no gain. Letting `UnitSchema` accept `sound: true` from saved data. Rejected: SOUND must never travel in links or saves, and the schema is the one place that guarantees that.

### Quiet sound-on for bulk loads
`chime.setSound(on, { quiet })`: with `quiet`, turning on skips the confirmation arpeggio and does everything else (graph, samples, level). `ChimeUnit` needs to know which path turned it on, so a loaded record carries a transient flag (`soundQuiet: true`) set in step 3 above. The effect passes it through: `chime.setSound(unit.sound, { quiet: unit.soundQuiet })`. The SOUND button's handler sets `soundQuiet: false`. The save effect already strips `sound` before storing; it strips `soundQuiet` too, and `UnitSchema` would drop it anyway as an unknown key.

Alternative: keep the arpeggio. Rejected: with several units it plays dozens of notes on top of the composition's first strikes.

### Positions
- MENU: `top-[calc(16px+env(safe-area-inset-top,0px))] right-[calc(16px+env(safe-area-inset-right,0px))]`, still `z-40`, so it stays above the `isolate` unit grid like MIDI does.
- The lower row is SHARE `16px + 168px`, RESET `16px + 84px`, MIDI `16px`. RESET is a plain `Button` (`h-11 w-[76px] px-2.5`), text `RESET`, like SHARE.
- `main`'s padding and the drag constraints don't change: MENU, like the lower row, floats above the units and can cover one that is dragged under it.

### Note pad background
Put `bg-background` on the `.tubes` grid container, not on the pads. The pads stay transparent over a white container, so hover (`hover:bg-foreground`) and the flash (`.tubes .hit`, components layer) still win on the pads. A `bg-*` utility on the pads themselves would beat `.tubes .hit` and break the flash, which CLAUDE.md already warns about.

### Row text
The row's second line becomes just the date (`YYYY-MM-DD`, UTC). The `chimes()` helper goes. The button's accessible name becomes title then date.

## Risks / Trade-offs

- [Tone not yet imported when a row is clicked] → `startAudio` awaits the import first and loses the gesture, so on Safari the units load with SOUND on but silent. This is the same exposure the SOUND button has today. `preloadAudio()` runs on mount, long before anyone opens the panel and picks a row, so in practice Tone is loaded.
- [16 units turning on at once] → each builds a graph and requests its samples. Sample ranges are cached per font, and units sharing a voice share them, so the network cost is per distinct voice, not per unit.
- [RESET has no undo] → by request. Saved compositions and share links are the way back.
- [MENU covers a unit's SOUND button when that unit is dragged to the upper-right corner] → the unit can be dragged back. The lower-right row has the same trade-off today.
- [Accessible names of rows change] → no automated tests depend on them yet. Manual Playwright checks should match rows by title.

## Migration Plan

Nothing to migrate: no stored data, link or API format changes. Ship as one PR. Pushing to `main` deploys, and rollback is a revert.
