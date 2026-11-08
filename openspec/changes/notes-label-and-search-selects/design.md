# Design

## Context

SCALE and SOUNDFONT are `ParamSelect`s (Radix Select) inside each unit's SETTINGS popover (`components/Chime.jsx`). Radix Select has no text input: its type-ahead only jumps by prefix. Option data already exists as plain arrays: `E.SCALE_LIST` (`{ name, group }`, grouped by `SCALE_GROUPS`) and `voiceGroups()` (`{ label, items: [{ value, text }] }`, where `text` is `"  15  TUBULAR BELLS"` or a built-in voice name). The notes drawer is the `.tubes` grid under the canvas, with a 1px border and no top border, and it is `hidden` while NOTES is off. The 1-bit rules (black and white only, square, no shadows, text glyphs and no new icons) and the SSR rules (no browser capability read during render) apply. See proposal.md for the motivation and the `ui-controls` delta for the behaviour.

## Goals / Non-Goals

**Goals:**
- One reusable `SearchSelect` component for SCALE and SOUNDFONT that matches the existing select field and list exactly, so the two look the same as the other selects until they are opened.
- Ordering that can be predicted exactly: matches that start with the text, then other matches, each set alphabetical.

**Non-Goals:**
- Fuzzy or typo-tolerant matching, or matching on group names or GM program numbers.
- Converting the other selects.
- Showing the voice and scale anywhere else, such as on the canvas or in the trigger.

## Decisions

### Hand-written combobox on the existing Radix Popover, no cmdk

`SearchSelect` uses `components/ui/popover.jsx`. The trigger is a `<button role="combobox" aria-haspopup="listbox" aria-expanded aria-controls>`, styled with `SelectTrigger`'s classes and showing `display` and `▾`. The content is an `<input type="search">` (searchbox, name SEARCH, `aria-controls` the list, `aria-activedescendant` the highlighted option) above a `role="listbox"` named after the select, with `role="option"` rows and `role="group"` headings. The highlight is driven from the input, not by moving focus.

- **Alternative: shadcn `command` (cmdk).** Rejected. cmdk ranks with its own fuzzy `command-score`, and we would have to turn that off (`shouldFilter={false}`) and sort ourselves. That leaves it giving us only keyboard handling, at the cost of a new dependency, its own ARIA (whose names would need overriding to keep SCALE the only combobox called SCALE) and another component to restyle.
- **Alternative: keep Radix Select and put an input in its content.** Rejected. Select's typeahead and focus management fight a text input inside the list, which is a known Radix limitation.
- **Nesting.** The list popover is a child layer of the SETTINGS popover. Radix's DismissableLayer stack sends Escape and outside presses to the topmost layer only, which gives "Escape closes only the list" without extra code. `onCloseAutoFocus` returns focus to the trigger.
- **Size.** `side="bottom"`, `collisionPadding={16}`, width `max(trigger width, 240px)` capped at `100vw - 32px`. `max-h` is `--radix-popover-content-available-height`. The input sits at the top and does not scroll (`sticky`); the list scrolls under it.

### Matching and ordering in one pure helper

`SearchSelect` and `rank` live in `components/ui/search-select.jsx`, next to `select.jsx`, since nothing in them is specific to chimes.

`rank(options, q)`:
- Normalize `q` to trimmed uppercase. An empty `q` returns the grouped input unchanged.
- Otherwise keep the options whose `name.includes(q)`. Split them into `name.startsWith(q)` and the rest, then sort each set with `localeCompare(…, "en", { numeric: true })`, so `SLAP BASS 1` comes before `SLAP BASS 2` and `10` sorts after `9`. Return one flat list.
- Each option is `{ value, name, text, group }`. `name` is what is matched and `text` is what is shown. For scales, both are the scale name. For GM presets, `name` is the preset name and `text` is the existing numbered text. For built-in voices, both are the voice name.
- `voiceGroups()` gains `name` on each item. Ties (the same name) keep their input order, because `sort` is stable.

### Keyboard

- **On the closed trigger:** Enter, Space and ArrowDown open the list. A single printable key (`e.key.length === 1`, no Ctrl, Meta or Alt) opens it with that key as the initial query.
- **In the input:** ArrowDown and ArrowUp move the highlight index, clamped to the ends. Enter chooses. Escape is left to Radix. Home and End stay with the text caret.
- **Highlight rules:** on open with an empty query, the current value is highlighted and scrolled into view with `scrollIntoView({ block: "nearest" })`. After each query change, the first match is highlighted. Hover moves the highlight. Choosing calls `onChange` and closes the list.

### Touch-only: no autofocus

`onOpenAutoFocus` calls `preventDefault()` and focuses the input, except when `matchMedia("(any-hover: none) and (any-pointer: coarse)").matches`. In that case it focuses the list container (`tabIndex=-1`), so arrow keys from a hardware keyboard still work. This is the same query as the `touch` variant. It is read in the open handler, not during render, so SSR is unaffected.

### The selected mark

Rows show `■` after the text for the current value, as `SelectItem`'s indicator does today, in the grouped and the filtered list alike. The mark follows the value, not the highlight, so an inverted highlighted row and a marked selected row can both be shown at once. The selected row also gets `aria-selected="true"`. The mark sits in its own `aria-hidden` span, so option names are clean (the existing Select keeps the `■` in names; tests already strip it). Highlighted rows invert through `bg-foreground text-background`.

### Drawer sound line

A `<p>` under the `.tubes` grid, inside the same `hidden` wrapper:
- Classes: `border border-t-0 border-foreground bg-background px-2 py-1 text-[10px] truncate`, width `canvasPx + 2`, so the readout's outline stays one continuous box.
- Text: `voiceName + " · " + unit.scale`. `voiceName` comes from the item's `name` field, so it matches what the search uses.
- Before the font loads, the default voice is `v0`, which reads TUBULAR BELLS, the built-in name, so the line never shows an empty voice.
- The separator is `·`: Knif Mono's cmap has U+00B7 (checked from the WOFF). It doesn't have `■`, `▾` or `▴`, which fall back as before.

## Risks / Trade-offs

- [A hand-written combobox can miss ARIA details] → Follow the WAI-ARIA 1.2 "combobox with listbox popup" pattern, and check the roles in Playwright: the searchbox, the listbox named SCALE, `aria-activedescendant` following the arrows, and that SCALE is the only combobox named SCALE.
- [Nested popovers on iOS: the first tap outside might close both] → Radix handles layering. Check it on the iPhone emulation in Playwright, and on a real phone during the hand check.
- [Rendering about 140 SOUNDFONT rows on every keystroke] → Plain filtering of about 150 items is negligible. Options are rendered only while the list is open.
- [Existing tests and docs drive SCALE and SOUNDFONT as Radix Selects (`role=option` inside `[data-slot=select-content]`)] → The new list keeps `role=option` with names equal to the visible text. Update CLAUDE.md's Testing notes.

## Migration Plan

UI only, with no data changes, so rollback is a revert. It ships with a normal PR to `main`.
