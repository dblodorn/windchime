## Why

Someone who lands on chime.dmbk.io, or on a composition's address, sees the chimes moving but hears nothing until they find the small SOUND button on each unit. Browsers only start audio from a tap, so the page needs one obvious control that starts it for everything. Once several units are playing, there's also no quick way to hear one on its own: today you mute every other unit by hand and then turn them all back on.

## What Changes

- **SOUND ON button, upper left:** shown while the page's audio isn't running (before the first tap, or after the browser suspends or interrupts it). It is filled with the design system's new alert color (Sanzo Wada's Spectrum Red) with white text. Pressing it starts audio inside the tap and turns on SOUND for every unit, quietly (no confirming arpeggio per unit, as when a saved composition loads). It hides once audio is running. The address notice (COMPOSITION NOT FOUND, COULD NOT OPEN) moves below it while both show.
- **SOLO tip on each unit's SOUND button:** hovering SOUND (or focusing it with the keyboard, or a long press on touch screens) shows a small tip holding one button:
  - **SOLO** turns that unit's SOUND on and every other unit's SOUND off, brings it to the front, and fades every other unit to the 25% tint that channel focus uses, so the soloed unit stands out.
  - On the soloed unit, the tip offers **SOLO OFF**, which puts every unit's SOUND back as it was before SOLO and ends the fade.
  - Solo ends without restoring anything when the user changes any unit's SOUND by hand, or when units are added, removed, reset or replaced (COPY, REMOVE, RESET, a link, a saved composition).
- Solo and SOUND ON change only the browser's sound (each unit's SOUND), never MIDI output. Neither is stored, linked or saved.
- New design-system parts, from the sound-design-system change `alert-color-and-tip`: the `alert` color, the `Button` variant `alert`, and `ActionTip`. windchime moves to `@dblodorn/sound-tokens` 0.2.0 and `@dblodorn/sound-ui` 0.4.0.
- A changelog entry for each of the two features.

## Capabilities

### New Capabilities
- `sound-on-and-solo`: the SOUND ON button (when it shows, what it does, where it sits) and solo (the tip, SOLO, SOLO OFF, the fade, when solo ends, what isn't stored).

### Modified Capabilities
- `ui-controls`: the two-color rule gains two exceptions: the SOUND ON button's alert fill, and the solo fade of the units that aren't soloed.

## Impact

- `components/Chime.tsx`: the SOUND ON button and the notice's placement in `Chime`, solo state (`solo`: the soloed unit's id and every unit's SOUND before it) in `Chime`, the SOLO tip around each `ChimeUnit`'s SOUND button, `faded` also covering solo.
- `lib/engine.ts`: `audioRunning()` and `onAudioState(fn)`, so the page knows when audio is running, suspended or interrupted.
- `lib/changelog.ts`: two FEATURE entries.
- `package.json`, `pnpm-lock.yaml`: the design-system packages at their new versions, published from the sound-design-system change first.
- `CLAUDE.md`: the SOUND ON button and solo under the UI notes, and the new exceptions under visual language.
- No change to links, saved compositions, browser storage or the API.
