# Tasks

## 1. Option data and ranking

- [x] 1.1 Add a `name` field to each `voiceGroups()` item: the preset name in uppercase for GM presets, and the voice name for built-in voices. Verify the existing SOUNDFONT select still shows the same numbered text.
- [x] 1.2 Write a pure `rank(groups, q)` helper in `components/ui/search-select.jsx`.
  - An empty query returns the groups unchanged.
  - Otherwise it returns one flat list of the options whose `name` contains `q`, ignoring case: names that start with `q` first, then the rest, each part sorted with `localeCompare("en", { numeric: true })`.
  - Verify in Node that `py` gives PYEONGJO, PYEONGJO HEXATONIC; `bass` gives the order in the spec scenario; `zzz` gives `[]`.

## 2. SearchSelect component

- [x] 2.1 Build `SearchSelect`.
  - The trigger is a `role=combobox` button styled like `SelectTrigger`, with `display` and `▾`.
  - The content is a Radix `Popover` holding the sticky SEARCH searchbox and the `role=listbox` named after the select. Group headings are shown only while the search is empty. A query with no matches shows `NO MATCH`. The current option gets an `aria-hidden` `■` and `aria-selected`, in both the grouped and the filtered list, and the mark never moves with the highlight. The highlighted row is inverted.
  - It is sized and kept in the viewport as design.md says.
  - Verify by eye in `pnpm dev` that the closed field looks the same as the ROOT select.
- [x] 2.2 Add keyboard and pointer handling.
  - On the closed trigger: Enter, Space and ArrowDown open the list, and a printable key opens it with that key as the query.
  - In the search field: ArrowUp and ArrowDown move the highlight, clamped to the ends, Enter chooses, and `aria-activedescendant` follows the highlight.
  - Hovering an option highlights it, and a click or tap chooses it.
  - On open, the current value is highlighted and scrolled into view. After each query change, the first match is highlighted. The query is cleared on every open.
  - Choosing closes the list and returns focus to the trigger.
  - Verify the scenarios in the Searchable selects requirement in Playwright (section 4).
- [x] 2.3 Skip autofocusing the search field on touch-only devices: in `onOpenAutoFocus`, check `matchMedia("(any-hover: none) and (any-pointer: coarse)")` and focus the list instead. Verify with Playwright's iPhone emulation that the search field is not focused after a tap opens SCALE.
- [x] 2.4 Replace the SCALE and SOUNDFONT `ParamSelect`s with `SearchSelect`, keeping their ids, the `aria-labelledby` labels and the row values (`SCALE`'s interval text, `SOUNDFONT`'s GM tag). Verify that choosing a value changes the unit's sound and scale and that the settings popover stays open.

## 3. Notes drawer sound line

- [x] 3.1 Check whether Knif Mono has U+00B7 (`·`), from the WOFF's cmap or by rendering it in the browser, and choose `·` or ` / ` as the separator. Record the result in the design.md Decisions section.
- [x] 3.2 Add the sound line under the `.tubes` grid, inside the `hidden` wrapper: width `canvasPx + 2`, `border border-t-0`, white background, 10 px text, one line ending in an ellipsis, and the text `voiceName + sep + unit.scale`. Verify in Playwright:
  - A first visit reads TUBULAR BELLS and RYUKYU.
  - It follows SOUNDFONT and SCALE changes.
  - It hides with NOTES.
  - It truncates at the smallest drawing size.
  - The readout's outer border is unbroken.

## 4. Verification and docs

- [x] 4.1 Write a Playwright run in the scratchpad, against `pnpm build && pnpm start`, covering every scenario in the delta spec:
  - Searchable selects: filter, order, Enter, arrows, empty search grouped, NO MATCH, Escape keeps the SETTINGS popover open, the search clears on reopen, type to open, and the phone keyboard.
  - The sound line scenarios, and the search roles and names.
  - Re-run the existing selects, notes drawer and MIDI checks.
  - Check the phone-width list fit at 375 px.
  - Check there are no console errors or hydration warnings.
- [x] 4.2 Update `CLAUDE.md`.
  - Describe the `SearchSelect` component and how ranking works.
  - Testing: SCALE and SOUNDFONT are driven through the SEARCH searchbox and `role=option` rows, and their option names have no `■`.
  - Describe the drawer sound line.
  - Verify by re-reading the Radix specifics and Testing sections for statements that are now stale.
- [x] 4.4 Follow-up from the preview on a phone: the panel collapsed on NO MATCH. Fix the panel height at `min(320px, available)` and replace NO MATCH with an empty state (`NO MATCH FOR <query>` and CLEAR SEARCH). Verify in Playwright that the height and top are steady across `py`, `pyz` and CLEAR SEARCH on desktop and iPhone.
- [x] 4.5 Follow-up: narrow SCALE by category. `rank(groups, q, byGroup)` appends the groups whose label contains `q` under their headings; on for SCALE only. Verify in Playwright: `korea` gives the Korea group in order, `hexa` gives name matches then the HEXATONIC group, and `drum kits` in SOUNDFONT gives the empty state.
- [ ] 4.3 Hand check, done by the user: on a real phone, open SCALE and SOUNDFONT inside SETTINGS, tap the search field, type, choose, and confirm that one tap outside closes only the list. Check that the sound line reads well at 1× and 2× drawing sizes.
