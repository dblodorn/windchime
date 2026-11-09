# Proposal

## Why

Every unit is a tube chime today. A furin, the Japanese summer wind bell, is a different instrument with its own character: one small bell, one pitch, and a clapper on a string, swung by a paper strip that catches the wind. How hard the clapper hits the rim changes each note. Adding it as a second instrument gives a composition a voice that the tube chimes can't make: a single bright note that keeps returning, at a changing velocity, over the tubes' melodies.

## What Changes

- **New INSTRUMENT parameter per unit.** It is a single-choice select with two options, TUBE CHIME (the current instrument, and the default) and FURIN BELL. It is the first row of the SETTINGS popover. Switching takes effect at once, and notes already ringing are not cut.
- **The furin simulation.** A bell hangs from the hook, and a clapper hangs inside it on a string. Below the clapper, a paper strip (tanzaku) catches the wind. The wind pushes the strip, the strip swings the clapper, and every time the clapper reaches the rim the bell strikes. Velocity comes from the clapper's speed at impact, so it changes from strike to strike. It uses the same wind model and 240 Hz fixed step as the tube chime.
- **One note.** A furin unit plays ROOT only. TUBES and SCALE are hidden while FURIN BELL is chosen. They keep their values, so switching back to TUBE CHIME restores the tubes as they were.
- **The furin drawing.** It uses the same 1-bit wireframe language: hook, string, a bell outline (dome and rim), the clapper, its string, the tanzaku and the wind dashes. It uses the same three-quarter view and paper size. Tapping the bell strikes it.
- **The furin voice.** It is a new built-in voice, FURIN: bright, glassy and inharmonic, mapped to a GM program for MIDI. It is the default voice for a furin unit, and SOUNDFONT still offers every voice and preset.
- **NOTES drawer.** A furin unit has one note pad, and its line reads the voice and `FURIN`.
- **MIDI.** Each strike sends that note on the unit's channel at its strike velocity, following the existing POLY/MONO, PROGRAM CHANGE and CC rules. TEST NOTE sends the furin's note.
- **Persistence.** INSTRUMENT is stored in each unit record, copied by COPY, and carried by share links and saved compositions. A link uses one of the two reserved per-unit bytes, so the link version stays 1, and old links (a zero byte) open as TUBE CHIME.
- **Saved compositions.** Saves need the dmbk GraphQL API to accept the instrument and the new voice. That is a matching change in that repo, which must deploy before this one.

## Capabilities

### New Capabilities
- `furin-bell`: the furin instrument. It covers its simulation (bell, clapper, tanzaku, wind, strikes and velocity), its drawing, tap-to-strike, its single note, and its built-in FURIN voice.

### Modified Capabilities
- `ui-controls`: an INSTRUMENT row is added first in the popover's rows, and its accessible name is INSTRUMENT. TUBES and SCALE are hidden for a furin unit. The notes drawer has one pad and the `<voice> · FURIN` line for a furin.
- `chime-units`: the stored parameters include INSTRUMENT, and COPY copies it.
- `chime-drawing`: the tube drawing, tap-to-strike and tube readout requirements apply to TUBE CHIME units. A unit's drawing follows its instrument.
- `share-links`: a link carries INSTRUMENT per unit, and links without it open as TUBE CHIME.
- `saved-compositions`: SAVE carries INSTRUMENT, and loading restores it.
- `midi-output`: TEST NOTE sends the furin's note for a furin unit (its "first tube").

## Impact

- **`lib/engine.js`:**
  - `makeSim` and `step` gain a furin variant.
  - Drawing gains the bell, clapper and tanzaku.
  - `VOICES` gains FURIN, appended at the end to keep the index rule.
  - `noteOf`, `strikeAt`, `strikeTube` and `tubeSegments` cover one bell.
  - `renderTake` honours the instrument.
- **`components/Chime.jsx`:**
  - Adds the INSTRUMENT row.
  - TUBES and SCALE are conditional.
  - The drawer gets one pad.
  - The default voice depends on the instrument.
- **`lib/share.js`:**
  - `UnitSchema` gains an `instrument` field that falls back to `"chime"`.
  - `pack` and `unpack` use a reserved byte.
  - `toSaved` and `fromSaved` handle the instrument.
- **dmbk-graphql-api:**
  - The chime composition schema gains the instrument.
  - The catalog gains the FURIN voice (from `pnpm catalog`).
  - It needs a deploy first, or saves with a furin unit are refused.
- **The strike rate needs measuring:** the furin's strikes per minute against WIND get their own tuning.
- **Docs:** `CLAUDE.md` and `AGENTS.md` are updated.
- **No new dependencies.**
