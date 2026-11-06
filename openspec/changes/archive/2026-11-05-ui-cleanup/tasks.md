# Tasks

## 1. Engine

- [x] 1.1 Give `setSound(on, { quiet } = {})` in `lib/engine.js` a `quiet` option that skips the confirmation arpeggio and still builds the graph, loads samples and sets the level. Verify in Node: the smoke test still prints `32 function`, and `createChime().setSound` accepts the second argument without error

## 2. Layout

- [x] 2.1 Move MENU to the upper-right corner (`top` and `right` 16 px plus safe-area insets, still `z-40`). Verify at 375 and 1280 px wide: MENU's top and right edges are 16 px from the viewport's, and it stays above a unit dragged under it
- [x] 2.2 Add RESET (text-only `Button`, `h-11 w-[76px]`, `aria-label` from its text) at `right: 16px + 84px`, and move SHARE to `16px + 168px`. Verify: SHARE, RESET and MIDI sit in one row at the lower right, 8 px apart, same height and bottom edge, and the page doesn't scroll sideways at 320 px

## 3. RESET

- [x] 3.1 Add `reset()` in `Chime`: `replaceComposition([defaultUnit(newId())])`, wired to RESET. Verify in Playwright with a stubbed MIDI port: with three units sounding notes on channels 1–3, RESET leaves one CHIME 1 at the center, muted, on channel 1 with the default parameters, note-offs go out on channels 1–3, and the port stays selected
- [x] 3.2 Verify a reload after RESET shows the single default unit (`windchime.units` holds one record)

## 4. Saved compositions

- [x] 4.1 Drop the unit count from composition rows in `components/Compositions.jsx` (remove `chimes()`; the second line is the date). Verify with the stubbed `/api/graphql` list: each row shows the title and date, and no `CHIMES` text
- [x] 4.2 In `openSaved`, start `E.startAudio()` synchronously in the click, replace the units and close the panel as now, then on success set `sound: true, soundQuiet: true` on the loaded ids still on the page; on failure log and leave them muted. Verify in Playwright: selecting a three-unit composition shows three units whose SOUND buttons are `aria-pressed=true`, and the panel closes
- [x] 4.3 Pass `{ quiet: unit.soundQuiet }` to `chime.setSound` in `ChimeUnit`, have the SOUND button set `soundQuiet: false`, and strip `soundQuiet` along with `sound` in the save effect. Verify: `windchime.units` never contains `sound` or `soundQuiet`, and a reload after loading shows the units muted
- [x] 4.4 Verify a composition that fails `fromSaved` shows `COULD NOT OPEN` and leaves the page's units and their SOUND states unchanged

## 5. Note pads

- [x] 5.1 Add `bg-background` to the `.tubes` grid container (not the pads). Verify in the browser: with a readout shown over another unit, no lines show through; hover still inverts a pad and a strike still flashes it black

## 6. Wrap-up

- [x] 6.1 Update `CLAUDE.md`: MENU's new position, the SHARE / RESET / MIDI row, RESET's behavior, sound on when a saved composition loads (with the quiet sound-on), the row text, and the readout background
- [x] 6.2 `pnpm build` passes; then by hand: loading a saved composition is audible in desktop Safari and Chrome, and on iOS
