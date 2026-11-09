# Tasks

## 1. Palette

- [x] 1.1 Add `lib/colors.js` with `CHANNEL_INKS` (16 `{ name, slug, hex }` entries from the spec table), `inkOf(channel)` and `inkStyle(hex)`. `inkStyle` returns `undefined` for black and otherwise redefines every black theme token plus `color`. Verify in Node: all 16 reach ≥ 3:1 against white and every pair is ≥ 10 apart by CIEDE2000.

## 2. Canvas

- [x] 2.1 In `lib/engine.js`, add `setInk(hex)` to `createChime`, which stores `ch.ink` as RGB (default black), and make `present` write `ch.ink` for set pixels. Verify in Node: a default chime's `ImageData` holds only 0/255 values as before, and after `setInk("#cc1a97")` only that RGB and white.

## 3. Unit styling

- [x] 3.1 In `components/Chime.jsx`, have `ChimeUnit` compute the ink from `unit.channel`, call `setInk` in an effect keyed on the channel, put `inkStyle` on its `motion.section` and provide it through `InkContext`. Verify in Playwright: a channel 3 unit's canvas pixels are `#0d75ff`/white, and its border, round buttons and drawer compute to `#0d75ff`.
- [x] 3.2 Pass the ink style to the portaled content: `PopoverContent` (`style`), `SelectContent` in `ParamSelect` (from `InkContext`), and a new `contentStyle` prop on `SearchSelect` forwarded to its content. Verify in Playwright: with a channel 7 unit's SETTINGS open, plus a select and the SCALE list each open in turn, every computed text, border, outline and inverted background in them is `#2619d1` or white.
- [x] 3.3 Fix any element that still computes black inside a non-black unit, if 3.1 and 3.2 turn one up. Verify: the Playwright sweep in 3.2 reports no `rgb(0, 0, 0)` inside the unit, its popover or its lists.

## 4. Legend

- [x] 4.1 Add the CHANNELS legend to the MIDI OUT dialog: an 8×2 list of swatches, in-use channels underlined, accessible names `"<n> <NAME>"` / `"<n> <NAME> IN USE"`, shown both before and after connecting. Verify in Playwright: the list has 16 items, units on channels 1 and 3 give "1 BLACK IN USE" and "3 BLUE IN USE", and the dialog still fits and scrolls at 375×640.

## 5. Regression and docs

- [x] 5.1 Re-run the existing Playwright suites in the scratchpad (`pw/t3.js`, `t4.js`, `t6.js`, `t8.js` and the rest) against `pnpm build && pnpm start -p 3456`. Verify: all pass, and a channel 1 page's computed colors and canvas pixels are still only black and white.
- [x] 5.2 Verify in Playwright that changing CHANNEL 1 → 6 recolors at once, that COPY makes a channel 2 Carmine unit, that RESET goes back to black, that SHARE gives the same link bytes as before for the same units, and that the fixed buttons and MENU stay black.
- [x] 5.3 Update CLAUDE.md, and copy it to AGENTS.md. In the visual-language section and the theme-enforcement notes, cover channel inks, `lib/colors.js`, `inkStyle`/`InkContext`, that portaled content must carry the ink, and the legend. Verify: `diff CLAUDE.md AGENTS.md` is empty.
- [x] 5.4 Run `openspec validate midi-channel-colors --strict` and `pnpm build`. Verify: both pass.
