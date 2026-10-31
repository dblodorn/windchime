# Tasks

## 1. Baseline

- [x] 1.1 Create branch `add-shadcn-ui` from `main`, then record the baseline: `pnpm build` First Load JS for `/` (expected ~115 kB), and desktop (1280 px) and phone (375 px) screenshots of the page at rest, with MIDI connected via the stub, into the scratchpad. Verify: the numbers and screenshot paths are noted in this task's completion message.

## 2. Tailwind and shadcn setup

- [x] 2.1 Add Tailwind v4 (`tailwindcss`, `@tailwindcss/postcss`, `postcss` as dev deps) and `postcss.config.mjs`. Verify: `pnpm build` succeeds with `@import "tailwindcss"` at the top of `app/globals.css`.
- [x] 2.2 Run `pnpm dlx shadcn@4.23.0 init` for JS (`tsx: false`, `style: "new-york"`, `rsc: true`, `cssVariables: true`, css `app/globals.css`, aliases `@/components`, `@/components/ui`, `@/lib/utils`). Verify: `components.json` and `lib/utils.js` exist, `jsconfig.json` has `"@/*"` paths, and `pnpm build` succeeds.
- [x] 2.3 Run `pnpm dlx shadcn@4.23.0 add button select slider checkbox`. Verify: `components/ui/{button,select,slider,checkbox}.jsx` exist, and their imports resolve in `pnpm build`.
- [x] 2.4 Rename the next/font variable in `app/layout.jsx` to `--font-courier`. Verify: in the built page, `document.documentElement` has the `--font-courier` custom property set.

## 3. Theme

- [x] 3.1 Rewrite the token section of `app/globals.css` per design Decision 2: all shadcn tokens set to `#000`/`#fff`, `--radius: 0rem`, no `.dark` block, `@custom-variant dark` removed, `color-scheme: light`. In `@theme inline`, map the colors, set every `--radius-*` to `0`, every `--shadow-*`/`--inset-shadow-*`/`--drop-shadow-*` to `none`, and `--font-sans`/`--font-mono` to the Courier stack. Verify: `pnpm build` passes, and a rendered `<div class="rounded-lg shadow-md bg-muted">` probe computes to `0px` radius, `none` shadow and a white background.
- [x] 3.2 Move the base rules into `@layer base` (html/body colors, font-sans, 15 px / 1.45, safe-area padding) and keep the component rules from Decision 6 (canvas pixelation, `.lead`, `.tubes .hit`, reduced motion). Verify: body computed font family starts with Courier Prime, and the canvas computed `image-rendering` is `pixelated`.

## 4. Restyle the generated components

- [x] 4.1 Edit `components/ui/button.jsx`: default variant as in Decision 4 (1px border, inverted hover and `aria-pressed`, uppercase, `.06em` tracking, `6px 10px`), disabled `opacity-40 pointer-events-none`, and the dashed focus outline. Remove the shadow, ring and dark classes. Verify: a probe page or the app shows rest, hover, pressed and disabled states in black/white only.
- [x] 4.2 Edit `components/ui/select.jsx`:
  - trigger full width with a 1px border and a `▾` glyph;
  - content `position="popper"`, sized to the trigger width, capped at `100vw-32px` and the available height, and scrollable;
  - items inverted when highlighted, `opacity-40` when disabled, with a `■` indicator;
  - bold uppercase `SelectLabel`;
  - no lucide icons.

  Verify: opening a select shows a black-bordered list with an inverted highlight.
- [x] 4.3 Edit `components/ui/slider.jsx`: `h-[22px] touch-none` root, `h-px` black track, transparent range, `9×17` black thumb. Pass `aria-label`/`aria-labelledby` through to the Thumb. Verify: the thumb has `role="slider"` and the name from `aria-labelledby`.
- [x] 4.4 Edit `components/ui/checkbox.jsx`: a 14 px square with a 1px border, and an 8 px black indicator square when checked, with no icon. Verify: the checked and unchecked computed styles match the spec.
- [x] 4.5 Remove `lucide-react` (and any other unused CLI-added deps) from `package.json`, then run `pnpm install`. Verify: `grep -r lucide components lib app` is empty, and `pnpm build` succeeds.

## 5. Migrate `components/Chime.jsx`

- [ ] 5.1 Update `Param`: utility classes, the `.lead` leader, and a `${id}-label` id on the key span. Convert the layout classes (`main`, stage, sheet, params, status, note, sfrow, checks, transport, tubes grid, h1, lede, hr) to utilities. Verify: the 1280 px and 375 px screenshots match the baseline layout (differences limited to control internals), and there is no horizontal scroll at 375 px.
- [x] 5.2 Replace all buttons with `Button`, keeping `aria-pressed`, `disabled` and `onClick`. Verify: SOUND ON/OFF and REC/STOP invert while pressed, and SAVE MIDI is disabled with no take.
- [x] 5.3 Replace the 4 range inputs with `Slider` (same `min`/`max`/`step`, `value={[x]}`, `onValueChange`, `aria-labelledby`). Verify: arrow keys step WIND 0.45 → 0.46, Home/End on DECAY give 0.3/12.0, and the row values update live.
- [x] 5.4 Replace ROOT, SCALE (with groups), SOUNDFONT (with groups) and CHANNEL with `Select` using string values. Verify: keyboard choose and Escape-keeps-value work on ROOT, the groups render on SCALE and SOUNDFONT, and the voice change still updates `prog` and the MIDI readout.
- [x] 5.5 Replace MIDI OUT with `Select`, using the `"none"` sentinel for NONE and keeping `"wanted"` as a disabled item. Verify with the MIDI stub: choosing a port, choosing NONE, and the disconnected remembered port shown but not choosable.
- [x] 5.6 Replace the 3 checkboxes with `Checkbox` (`checked`, `onCheckedChange`) inside their labels. Verify: clicking the label text toggles, Space toggles, and the stored `windchime.sendProg`/`sendCC` values follow.
- [x] 5.7 Remove the now-unused native-control rules from `globals.css` (`button`, `.param select`, `input[type=range]`, `.checks input`). Verify: `grep -E "input\[type|\.param select|^button" app/globals.css` is empty, and the page still looks right.

## 6. Verification

- [x] 6.1 Update the scratch `midi-check.mjs` to role-based helpers (`pickOption`, `setSlider`, `getByRole("checkbox")`) per design Decision 7, and run it against `next start` and `next dev`. Verify: all 49 checks pass on both.
- [x] 6.2 Write the scratch `ui-check.mjs` covering every `ui-controls` scenario that can be automated:
  - a palette, radius and shadow sweep over all elements in rest, hover, focus, open and disabled states;
  - the font;
  - dark-mode emulation still rendering black on white;
  - row value updates;
  - button states;
  - select keyboard choose, Escape, groups, the disabled option, and the 375 px list fit and scroll;
  - slider keys, Home/End, `aria-value*`, and CC74 sent during a pointer drag;
  - checkbox toggling by label and by Space;
  - the dashed focus outline when tabbing, and none after a mouse click;
  - roles and names;
  - no hydration errors.

  Verify: all checks pass against `next start`.
- [x] 6.3 Record First Load JS after the change and compare it with 1.1. Verify: the growth is noted, and if it exceeds about +40 kB, stop and review before continuing.
  - Result: 115 kB → 165 kB (+50 kB, mostly Radix Select: about +43 kB alone over an empty page). Reviewed with the user, who accepted it (2026-10-31).
- [x] 6.4 Update `CLAUDE.md`: Stack (Tailwind v4 + shadcn/ui, JS), Layout (`components/ui/`, `lib/utils.js`, `components.json`, `postcss.config.mjs`), the visual-language rule extended to shadcn tokens and components (black/white tokens, radius/shadow zeroed, `--font-courier`, text glyphs instead of icons, `"none"` select sentinel), and how to add a component (`pnpm dlx shadcn@4.23.0 add …` then restyle). Verify: every file and name mentioned exists.
- [ ] 6.5 Commit (including `pnpm-lock.yaml`) and push the branch, then check the Vercel preview on a phone. Check:
  - iOS Safari: SOUND starts audio, select lists scroll and fit, slider drag doesn't scroll the page;
  - desktop Chrome: MIDI connect and TEST NOTE.

  Verify: the user confirms before merging to `main`.
