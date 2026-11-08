# Proposal

## Why

With the notes drawer open you see a unit's pitches but not what is making them: the voice and scale are two clicks away, inside SETTINGS. The SCALE (32 scales) and SOUNDFONT (about 200 GM presets plus the built-in voices) lists are long, and Radix's type-ahead only jumps to the first option that starts with what you type, so finding "BELLS" or "GAMELAN" means scrolling.

## What Changes

- The tube notes drawer gains one line, under the note pads, that shows that unit's SOUNDFONT voice and SCALE, for example `TUBULAR BELLS · RYUKYU`. It updates as either changes, is the drawing's width, and is shown and hidden with the drawer.
- SCALE and SOUNDFONT become searchable selects: opening one shows a text field above the list, with focus in it. Typing filters the options as you type: names that start with the text come first, then names that contain it anywhere, each set in alphabetical order. Group headings are kept for the empty search and dropped while filtering. Arrow keys move through the matches, Enter chooses one, Escape closes without changing, and a search with no matches shows `NO MATCH`.
- The other selects (ROOT, OUTPUT, CHANNEL, MIDI MODE, MIDI OUT, DEVICE) are unchanged.
- No stored data, share link or saved composition format changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-controls`: the **Selects** requirement splits off SCALE and SOUNDFONT as searchable selects, with their own keyboard and filtering rules. The **Tube notes drawer** requirement gains the voice and scale line. The **Accessible names and roles** requirement covers the search field and the list inside them.

## Impact

- `components/Chime.jsx`: a searchable select component used by the SCALE and SOUNDFONT rows; the label line in the notes drawer.
- `components/ui/`: probably a shadcn `command` component (cmdk) inside the existing `popover.jsx`, restyled to the 1-bit theme. That would add the `cmdk` dependency and an update to `pnpm-lock.yaml`. design.md decides whether to use it or hand-write the component.
- `CLAUDE.md`: describe the new component, how to drive it in Playwright tests, and the drawer line.
- No engine, schema, share-link or API changes. The `scales` spec's group order and default are kept, because the unfiltered list is still grouped.
