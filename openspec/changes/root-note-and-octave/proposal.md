# Proposal

## Why

ROOT is one long select of 37 notes, C3 to C6, each shown with its frequency. That range is narrow: a chime can't be tuned down into bass or up past C6. A 37-item list is also slow to scan. Splitting the root into a note and an octave gives a much wider range with two short, quick controls.

## What Changes

- **ROOT picks only the note:** 12 options, C to B, with no octave number and no frequency (no Hz).
- **A new OCTAVE row sits directly below ROOT.** It is a stepped slider like TUBES, from −1 to 8, with a tick at each step, and it shows the octave number.
- **The range grows** from C3–C6 (MIDI 48–84) to C-1–B8 (MIDI 0–119), using the app's naming, where C4 = 60.
- **The default stays C5** (MIDI 72): note C, octave 5.
- **Tube notes stay valid MIDI.** A tube whose root plus scale offset would go above 127 is played an octave lower, repeated until it is 127 or less. This is reachable: B8 is 119, and QUARTAL on 8 tubes climbs 25 semitones. The tube readout, the sound and the MIDI all use that lowered note.
- **The stored value doesn't change shape:** each unit still keeps one `root`, a MIDI note number. Its allowed range widens to 0–119 in stored units, share links and saved compositions. Existing links, saves and stored units open on exactly the same note.
- **The popover has 14 rows on desktop, or 12 for a furin.** The furin keeps ROOT and OCTAVE; both set its single note.
- The tube note pads keep their frequency line. Only the ROOT picker loses its Hz.

## Capabilities

### New Capabilities

### Modified Capabilities
- `ui-controls`:
  - The parameter popover's rows and their counts gain OCTAVE below ROOT.
  - ROOT becomes a 12-note select.
  - The select list's example scenario changes.
- `scales`: the rule for tube notes above MIDI 127 (lowered by octaves).
- `share-links`: ROOT travels across C-1 to B8. Old links keep their notes.
- `saved-compositions`: a saved `root` may be 0–119.
- `chime-units`:
  - OCTAVE is copied with the unit.
  - Stored roots load as the same note, and out-of-range roots are clamped to C-1–B8.
- `audio-output`: the phone popover's row count, now thirteen for a tube chime and eleven for a furin. It read "eleven" before, which was stale.

## Impact

- **`components/Chime.jsx`:**
  - The ROOT `ParamSelect` lists 12 notes and loses `rootText`'s Hz.
  - A new OCTAVE `ParamSlider` (`step={1}`, `ticks`) is added.
  - Both controls write `root = 12 · (octave + 1) + note`.
- **`lib/share.js`:**
  - The `root` range in `UnitSchema`, `PackedUnitSchema` and `SavedUnitSchema` widens to 0–119.
  - The link stays version 1, since the byte already holds 0–255.
- **`lib/engine.js`:** `noteOf` / `noteAt` lower notes above 127 by octaves.
- **dmbk-graphql-api:**
  - Code: `ROOT` limits in `src/lib/chime/shape.ts` change from `[48, 84]` to `[0, 119]`.
  - The collection's validator needs an update (`npm run chime:collection -- --apply`, with `dbAdmin` granted to `graphql-api` again for that step).
  - It must deploy before the front end, or saves with roots outside 48–84 are refused.
- **CLAUDE.md / AGENTS.md:** document ROOT and OCTAVE, the 0–119 range and the 127 rule.
- **Not affected:**
  - Link version and length.
  - Voice ids.
  - The furin's physics.
  - MIDI channel handling.
