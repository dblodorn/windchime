# Proposal

## Why

Every control in the parameter sheet is a hand-styled native element: five `<select>`s, four range sliders, three checkboxes and the buttons. Their look is held together by browser-specific CSS (`::-webkit-slider-thumb`, `appearance: none` checkboxes), and their behavior varies by browser, most visibly native `<select>` popups, which can't be styled at all. Adopting shadcn/ui (Radix primitives with Tailwind) gives accessible, consistent components that we own as source. Retheming them to the existing 1-bit language means new controls can be added without writing a stylesheet for each one.

## What Changes

- Add **Tailwind CSS** (v4, via PostCSS) and the **shadcn/ui** setup for a plain-JavaScript Next.js App Router project: `components.json` with `tsx: false`, the `@/` path alias in `jsconfig.json`, the `cn()` helper in `lib/utils.js`, and components under `components/ui/` as `.jsx`.
- Add a **shadcn theme that matches the current look as closely as possible**:
  - every color token (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--accent`, …) maps to pure black or pure white;
  - `--radius: 0`;
  - no shadows;
  - Courier Prime as the only font;
  - a focus ring that is a 1px dashed black outline, as today;
  - a light color scheme only (no dark variant).
- **Replace the parameter sheet's controls with shadcn components**, restyled to match:
  - `Button` for transport, MIDI, SF2 and PANIC/TEST NOTE. Toggle buttons keep the inverted pressed state.
  - `Select` for ROOT, SCALE, SOUNDFONT (with groups), MIDI OUT and CHANNEL.
  - `Slider` for WIND, DECAY, FREQUENCY and RESONANCE: a 1px track and a 9×17 black block thumb.
  - `Checkbox` for the three MIDI options.
  - The `LABEL ....... value` rows with dotted leaders stay. A small `Param` row component stays local to the app.
- **Move `app/globals.css` to Tailwind:** the Tailwind import, the theme tokens and base layer, plus the few app-specific rules Tailwind can't express cleanly (canvas pixelation, the dotted leader, safe-area padding). The remaining layout moves to utility classes.
- The canvas, the tube readout grid and all engine and MIDI behavior are unchanged.
- **Update `CLAUDE.md`:** "No CSS framework. One global stylesheet." becomes the Tailwind + shadcn setup and theme rules. The visual-language constraint stays, and now applies to shadcn components too.

## Capabilities

### New Capabilities
- `ui-controls`: the parameter sheet's visual language and how its controls behave:
  - two colors, one monospace font, square corners and no shadows;
  - `LABEL ....... value` rows;
  - each control type's appearance and states (pressed, disabled, focus);
  - keyboard and pointer operation of selects, sliders, checkboxes and buttons;
  - controls stay labeled and reachable by their accessible names.

### Modified Capabilities
<!-- None. midi-output requirements are unchanged; its controls (CONNECT MIDI, MIDI OUT, CHANNEL, the three options, TEST NOTE, PANIC) keep the same names, states and behavior and only change implementation. -->

## Impact

- **New dependencies:**
  - `tailwindcss`, `@tailwindcss/postcss` and `postcss` (dev);
  - `class-variance-authority`, `clsx` and `tailwind-merge`;
  - the Radix primitives the chosen components need: `@radix-ui/react-select`, `-slider`, `-checkbox` and `-slot`, or the unified `radix-ui` package if the current shadcn CLI uses it;
  - `lucide-react` for the select and checkbox icons, unless they're replaced with text glyphs.

  `pnpm-lock.yaml` must be updated with them, because Vercel installs with a frozen lockfile.
- **New files:** `components.json`, `postcss.config.mjs`, `lib/utils.js`, and `components/ui/{button,select,slider,checkbox}.jsx`.
- **Changed files:**
  - `app/globals.css` is rewritten;
  - `components/Chime.jsx`: controls swapped for components, and handlers adapted (`onValueChange`/`onCheckedChange` instead of `onChange` events);
  - `jsconfig.json` gets `paths`;
  - `CLAUDE.md`.
- **Bundle size:** First Load JS grows from about 115 kB because of Radix and Tailwind's runtime-free CSS; this is to be measured. The ~6 MB SF2 is unaffected.
- **Constraints kept:**
  - audio still starts inside the SOUND tap;
  - the SSR and hydration rules hold (Radix Select and Slider render on the server);
  - Web MIDI permission is still asked only from CONNECT MIDI;
  - strict-mode-safe listeners.
- **Testing:**
  - The MIDI Playwright check drives native `<select>`s and range inputs (`selectOption`, the value setter). It needs updating to use the new components through their roles (combobox/option, slider with arrow keys, checkbox).
  - The same 49 MIDI checks must pass afterwards, plus new visual and keyboard checks for `ui-controls`.
