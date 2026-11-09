# Design

## Context

- **The stored value:** a unit stores `root` as one MIDI note number. The limits are set in four places:
  - `UnitSchema` (`num(48, 84, 72, true)`)
  - `PackedUnitSchema` (`z.int().min(48).max(84)`)
  - `SavedUnitSchema` (the same)
  - dmbk-graphql-api's `INT_FIELDS.root = [48, 84]` in `src/lib/chime/shape.ts`, and the collection validator generated from it
- **The link byte:** the packed link writes `root` as one u8 at offset 7.
- **The UI:** `ROOTS` lists 48–84, and `rootText` shows the name plus Hz.
- **Where notes are computed:**
  - The engine's `noteAt(P, i)` gives each tube's note.
  - `Chime.jsx` repeats `unit.root + offset` in two places: the pad readout and TEST NOTE.
  - `tubeLen` sizes each drawn tube from the ratio between the root and the tube's note.
- **The furin's API title** already uses `root % 12`.

## Goals / Non-Goals

**Goals:**
- A 12-note ROOT plus a −1..8 OCTAVE, over one stored number.
- Every tube note stays within MIDI 0–127.
- No new link version, and old links, saves and stored units are unchanged.

**Non-Goals:**
- Per-voice range limits or warnings for extreme octaves.
- Changing the note pads' Hz.
- Changing how the drawing sizes tubes.

## Decisions

**Keep `root` as the single source of truth.**
- The UI derives `note = root % 12` and `octave = floor(root / 12) − 1`.
- It writes back `root = 12 · (octave + 1) + note`.
- No new field is needed, so links, saves, the API, fingerprints and `localStorage` keep their shape.
- The alternative was storing `note` and `octave` separately. That would need a link version 2 and an API schema change for no behavioral gain.

**The range is 0–119 everywhere.**
- `UnitSchema` becomes `num(0, 119, 72, true)`. It clamps, so a stored 127 loads as 119.
- `PackedUnitSchema` and `SavedUnitSchema` become `min(0).max(119)`.
- The u8 byte already holds this, so the link stays version 1, and any link with a root of 48–84 encodes byte for byte as before.

**Fold notes above 127 in one exported helper.**
- `foldNote(n)` lowers by 12 while `n > 127`.
- `noteAt` returns `foldNote(...)`, so sound, MIDI, recording and `buildMidi` all follow.
- The pad readout and TEST NOTE in `Chime.jsx` switch to the same helper, through an exported function, so the pads show what plays.
- `tubeLen` keeps using the scale offset, not the folded note. The drawing stays a rising set of tubes. A folded tube would otherwise be drawn longer than its neighbours, which reads as a bug rather than as the octave drop.
- The SCALE row's offsets are the scale's own and stay as they are.

**OCTAVE is a `ParamSlider` with `step={1}` and `ticks`, like TUBES.**
- Its range is `min={-1} max={8}`, giving 10 ticks.
- The row value is the plain number. Knif Mono's hyphen serves as the minus sign, to match `noteName`'s `C-1`.

**ROOT stays a `ParamSelect` of 12 items.**
- Each item's value is the pitch class (`"0"`…`"11"`), and its text is the bare note name.
- The row value (`display`) is `noteName(root)`, the full note such as `C5`, so the row still reads the actual root.
- Typing a letter jumps to it, as Radix's typeahead already does.

**The API changes first.**
- Code: `INT_FIELDS.root` becomes `[0, 119]`.
- Then run `npm run chime:collection -- --apply`, with `dbAdmin` temporarily granted to `graphql-api`.
- Then deploy, and only then the front end.
- The GraphQL schema doesn't change (still `Int`), so `pnpm schema:pull` isn't needed.

**Built-in voices at the extremes need no change.**
- `playVoice` already skips partials above 0.45 × the sample rate, so a high FURIN or TUBULAR note just loses its upper partials.
- SF2 samples are pitched by playback rate, and Web Audio handles the 1/64 ratio at MIDI 0.

## Risks / Trade-offs

- **Octaves −1 to 1 are sub-bass or below hearing:** about 8–60 Hz, so near silent on laptop speakers and many voices. That's accepted; it was asked for, and it's useful over MIDI to hardware.
- **Folded tubes can sound out of order:** pitch drops partway along the chime. That's only possible from about octave 7 up with wide scales, and it is the chosen trade-off over capping OCTAVE.
- **Order of deploys:** if the front end ships before the API, saves with roots outside 48–84 fail with `COULD NOT SAVE`. The tasks put the API first.
