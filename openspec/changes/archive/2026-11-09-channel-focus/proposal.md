# Proposal

## Why

With several units on the page, a performer needs to see which MIDI channels are playing and pick out the units on one channel, for example to tweak everything going to one synth. The channel inks make each channel recognizable. What's missing is an always-visible readout of the active channels and a way to bring one channel's units forward.

## What Changes

- Add an active-channels strip, fixed to the lower left. It is as tall as the lower-right button row (44 px) and holds one 22 px square per channel in use: the square is filled with that channel's ink and shows the channel number centered in small white type. Squares run in channel order and fill an 8-column, 2-row grid (176 × 44 px), wrapping to the second row after 8.
- The strip appears only while the units use two or more distinct channels. With one channel there is nothing to tell apart, so it is hidden.
- Activating a square turns on focus mode for that channel: every unit on another channel fades to 35% opacity, and units on the focused channel stay fully opaque. The square shows as pressed. Activating the pressed square again ends focus. Activating another square moves focus to that channel. One channel is focused at a time.
- Pressing on a faded unit ends focus mode. The press still does what it normally does: it brings the unit to the front, strikes, drags, or works a button.
- Focus also ends when the focused channel is no longer in use, or when the strip hides because fewer than two channels are in use.
- Focus is transient view state. It is not saved and not put in share links or saved compositions.
- On narrow viewports, where the strip doesn't fit to the left of the button row, it sits above the button row, left-aligned, 8 px above it.

## Capabilities

### New Capabilities
- `channel-focus`: the active-channels strip (placement, size, squares, visibility) and channel focus mode (entering, switching, leaving, opacity, and not persisting).

### Modified Capabilities
- `ui-controls`: the two-color requirement gains two exceptions, the strip's filled ink squares with white numbers, and the reduced opacity of unfocused units.
- `channel-colors`: "Page controls stay black" exempts the strip's squares, the same way it exempts the legend's swatches.

## Impact

- `components/Chime.jsx`:
  - `Chime` gets new `focus` state, the strip component, and a check in the existing capture-phase pointerdown on units.
  - `ChimeUnit` takes a `faded` prop that sets its `motion.section` opacity.
- `lib/colors.js`: reused (`CHANNEL_INKS`, `inkOf`). No palette changes.
- `app/globals.css`: possibly nothing; the layout uses Tailwind utilities.
- CLAUDE.md and AGENTS.md: document the strip and focus mode.
- No change to storage, share links, the API schema, MIDI output or audio.
