# Proposal

## Why

The page has no quick way back to a fresh start: undoing a pile of copies means removing them one by one. The lower-right row is crowded with MENU, SHARE and MIDI. Composition rows repeat a unit count nobody needs. The note pads under a drawing are see-through, so a unit behind shows through them. And loading a saved composition leaves every unit muted, so you hear nothing until you tap each SOUND button, when the point of picking one is to hear it.

## What Changes

- A **RESET** button joins the lower-right row, immediately left of MIDI. It is text only, the same size and style as SHARE and MIDI. Activating it replaces every unit with one default unit, CHIME 1 (the same unit a first visit shows), at the center of the page:
  - the old units' MIDI notes are ended;
  - the new unit starts with SOUND off;
  - the stored composition (`windchime.units`) becomes that single unit.
  It acts at once, with no confirmation. It leaves the MIDI port and the SEND options alone.
- **SHARE** moves one place left to make room: the row is now SHARE, RESET, MIDI from left to right, 8 px apart.
- **MENU** moves out of that row to the upper-right corner of the viewport, 16 px from the top and right edges plus the safe-area inset. It keeps its icon, size and style, and still stays above every unit.
- Composition rows in the COMPOSITIONS panel drop the unit count (`1 CHIME`, `n CHIMES`). A row shows the title and the save date.
- The **note pads** in each unit's notes readout get a white background, so whatever is behind the unit no longer shows through. They still invert on hover and flash on a strike.
- **Loading a saved composition turns SOUND on** for every loaded unit. Selecting a row is a tap, so browser audio can start inside it. Share links still load muted: opening a URL is not a tap, so audio cannot start there.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `chime-units`: a new requirement for RESET (one default unit, old MIDI notes ended, stored composition replaced, muted).
- `saved-compositions`: MENU moves to the upper-right corner; rows no longer show the unit count; a loaded composition starts with SOUND on for every unit instead of muted.
- `ui-controls`: the tube notes readout's pads are opaque white.
- `share-links`: SHARE is no longer immediately left of MIDI; RESET sits between them.

## Impact

- `components/Chime.jsx`: the RESET button and its handler (sharing the replace path that links and saved compositions use), the fixed positions of MENU and SHARE, and starting audio plus turning each loaded unit's SOUND on when a composition is selected.
- `components/Compositions.jsx`: the row text drops the unit count; the row's click must reach the sound start in the same gesture.
- `components/Chime.jsx` also gives the notes readout a white background.
- `lib/engine.js`: `setSound` gains a way to turn sound on without the confirmation arpeggio, for loading many units at once (see design).
- `CLAUDE.md`: the layout notes for MENU, SHARE and the new RESET button, and the saved-composition load path.
- No API, schema, share-link format or storage format change.
