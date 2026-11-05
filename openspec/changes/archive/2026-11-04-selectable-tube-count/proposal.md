# Proposal

## Why

Every chime has exactly six tubes, which fixes the scale to six notes and the instrument to one shape. Letting each unit choose from 2 to 8 tubes gives sparse two- or three-note chimes and fuller seven- or eight-note ones (a whole heptatonic scale plus its octave), and makes copied units more distinct from each other.

## What Changes

- New per-unit **TUBES** parameter, an integer from 2 to 8, default 6.
- A stepped slider for TUBES (range 2–8, step 1, one detent per tube count) at the top of the SETTINGS popover, directly above WIND, in the usual `TUBES ....... 6` row.
- The tubes hang evenly around the ring for any count. The camera turn keeps every tube at its own screen position.
- Scale mapping generalizes from "first six notes" to "first N notes". A scale with N or more notes uses its first N. A shorter one wraps around, repeating its notes from the start one octave up until N tubes are filled (for example, a five-note scale at 8 tubes takes all five plus the first three an octave higher). The SCALE row shows N offsets.
- Wrap-around can give two tubes the same pitch (for example CHINESE GONG, whose sixth note is already +12, at 8 tubes). Such tubes SHALL ring together, polyphonically: in the browser each strike is already its own voice, and over MIDI a strike on one tube no longer cuts off the same note still sounding from a different tube. The note-off is sent once, when the last of them ends. A re-strike of the same tube still ends its own note first, as today.
- New per-unit **MIDI MODE** select, POLY or MONO, the row directly under CHANNEL in SETTINGS. POLY is the default and gives the behavior above. MONO is one note per key, which is today's rule: a strike on a key already sounding on the channel sends that note-off first, whichever tube or unit sounded it. Different keys still overlap in both modes. It affects MIDI only; browser sound is always polyphonic. It is saved with the unit and copied by COPY.
- Strike density follows the tube count on purpose: more tubes give the clapper more targets and so more strikes per minute, fewer tubes make a sparser chime. The sim constants stay as they are.
- The tube notes drawer shows one pad per tube (2–8 cells), still matching the drawing's width.
- Changing TUBES takes effect live. The sim's per-tube state is rebuilt for the new count, and ringing notes and MIDI notes on the removed tubes end normally (no stuck notes).
- TUBES is saved in the unit record and copied by COPY. Stored records without it load as 6. Values are clamped to 2–8.
- With TUBES at 6, the simulation, drawing and strike sequence for a given seed stay exactly as they are today.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chime-drawing`: "six tubes" becomes N tubes (2–8) spaced evenly on the ring, with distinct screen positions for every count. The strike-sequence-unchanged guarantee applies at N = 6. The tube readout has N columns.
- `scales`: "Scale to six tubes" becomes scale to N tubes (repeat or cut to N notes), and the SCALE row shows N offsets.
- `ui-controls`: adds the TUBES stepped slider (2–8, step 1) above WIND to the sliders and the popover rows. The tube notes drawer has one pad per tube.
- `midi-output`: in POLY (the default) the re-strike rule applies per tube, not per note, and the same note from different tubes or units overlaps, with one note-off at the latest end. MONO keeps the per-key rule.
- `ui-controls`: also adds the MIDI MODE select under CHANNEL, making eleven popover rows.
- `chime-units`: COPY carries TUBES and MIDI MODE. Saved units store both. Older saves load as 6 tubes and POLY.

The deltas build on the requirement text from `copy-chime-units`, which is complete but not yet archived (`chime-units` exists only in that change). `copy-chime-units` has to be archived before this change.

## Impact

- `lib/engine.js`: `sixOf` → an N-note mapping; the `ANG` table and `makeSim` sized by tube count; `step`, `tubeGeom`/drawing, `strikeAt`, `tubeSegments` and the readout flashes loop over N; `setParams` handles a tube-count change (rebuilds the tube state, keeps the clapper and sail moving). The strike rate per minute changes with N by design; the constants are not retuned.
- `components/Chime.jsx`: a TUBES slider row in the popover, a `tubes` field in unit records (defaults, load validation, COPY), the readout rendering N pads, and TEST NOTE still using tube 1.
- `lib/midiout.js`: `note()` takes an optional source id (unit and tube), and the note-off timers track which sources are sounding each channel:note. Notes on removed tubes end through those timers as before.
- `CLAUDE.md` and the stored-record docs: "six-tube" wording, the record shape and `sixOf`.
- No new dependencies. Saved state stays at `v: 1`, since the new field is optional.
