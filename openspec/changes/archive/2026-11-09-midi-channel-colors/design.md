# Design

## Context

The 1-bit look is enforced by the theme: every shadcn token in `app/globals.css` is `#000000` or `#ffffff`, and Tailwind's `@theme inline` maps the utility colors (`text-foreground`, `border-border`, `bg-accent`, `outline-foreground`) to `var(--foreground)` and so on. Because those utilities read the custom properties where they are used, redefining the black tokens on an element recolors its whole subtree. The canvas is separate: `present(ch)` in `lib/engine.js` writes black or white RGB into the chime's `ImageData`.

A unit's popover, selects and search lists render in Radix portals under `<body>`, outside the unit's `motion.section`, so they don't inherit custom properties from it.

## Goals / Non-Goals

**Goals**
- One palette table, one source of truth, used by the canvas, the CSS and the legend.
- Recolor a unit by scoping the existing tokens. No per-component color code.
- Channel 1 renders byte-for-byte as today, in pixels and in computed styles.

**Non-Goals**
- User-chosen colors.
- Coloring anything outside units.
- Changing links, saves or the API.
- Dark mode.

## Decisions

### 1. Palette in `lib/colors.js`
The palette is a plain module (no DOM, safe in Node and SSR):

```js
export const CHANNEL_INKS = [
  { name: "BLACK", slug: "black", hex: "#000000" },
  { name: "CARMINE", slug: "carmine", hex: "#d60036" },
  // … 16 entries, channel n at index n − 1 (table in specs/channel-colors)
];
export const inkOf = channel => CHANNEL_INKS[channel - 1] ?? CHANNEL_INKS[0];
```

The slugs are the Sanzo Wada server's slugs (https://sanzo-wada.dmbk.io/swatch/<slug>), kept so a color can be traced back to the book. The colors were chosen with the server's data:
- 88 of its 159 colors reach 3:1 against white.
- From those, a local search maximized the smallest pairwise CIEDE2000 difference, with the patch-cable primaries (red, blue, yellow, green, orange, violet, magenta, teal) fixed on the low channels.
- The result's closest pairs are Indian Lake and Veronia Purple (14.6), and Carmine and Red (14.8). The lowest contrast is Orange at 3.25:1.

*Alternative:* hues generated in OKLCH would separate better, but you asked for Wada colors and a primary-color feel.

### 2. Scope the theme tokens per unit
`inkStyle(hex)` returns a style object that redefines every black token:
- `--foreground`, `--card-foreground`, `--popover-foreground`
- `--primary`, `--secondary-foreground`, `--muted-foreground`
- `--accent`, `--destructive`, `--border`, `--ring`

It also sets `color: var(--foreground)`, so text that inherits plain `color` follows. `ChimeUnit` puts the style on its `motion.section`.

Its portaled content gets the same style:
- `PopoverContent` takes `style` directly.
- `ParamSelect` reads the unit's ink from a small React context (`InkContext`, provided by `ChimeUnit`) and passes it to `SelectContent`.
- `SearchSelect` gets a `contentStyle` prop that is forwarded to its `PopoverPrimitive.Content`.

For channel 1 the style is an empty object, so nothing changes in the default case.

*Alternative:* a `data-ink="3"` attribute plus 16 CSS blocks in `globals.css`. That would duplicate the table in CSS, and the portals would still need the attribute. Inline variables keep one table.

### 3. Canvas ink
The chime gets `setInk(hex)`, which parses the hex to `ch.ink = [r, g, b]` (default `[0, 0, 0]`). `present` writes `ch.ink` for set pixels and white for the rest. `ChimeUnit` calls `setInk` in an effect keyed on the channel. Tests stay simple, since each pixel is one of exactly two RGB values.

### 4. Legend
The legend goes in the MIDI OUT dialog after PANIC, or after CONNECT MIDI before access is granted. It renders whether or not MIDI is connected.
- **Structure:** a `<ul aria-label="CHANNELS">` in an 8-column grid. Each `<li>` holds a filled square swatch (`aspect-ratio: 1`, `background: hex`), the only fills in the UI, and the number below it.
- **In use:** an in-use channel has an underlined number. Its `aria-label` is `"<n> <NAME> IN USE"`, otherwise `"<n> <NAME>"`.
- **Data:** in-use channels come from `units` in `Chime`, which already holds them.
- **Heading:** a `LABEL`-style row reading `CHANNELS`, in the parameter-row style.

### 5. Things that need no change
These follow the tokens on their own:
- the round buttons (border and Lucide icon in `currentColor`)
- the canvas border (`border-foreground`)
- `.tubes .hit` (accent background, accent-foreground text)
- dotted leaders (`var(--foreground)`)
- the dashed focus outline (`outline-foreground`)
- slider track and thumb, and checkbox squares

Each will be confirmed during apply by reading computed styles in Playwright, not assumed.

## Risks / Trade-offs

- **Small text below 4.5:1.** Labels are 10–13 px, and WCAG's 4.5:1 for small text is not met by Orange (3.25), Khaki (3.34), Buffy Citrine (3.57) and a few near 4.0. You chose 3:1, the non-text and large-text minimum. Channel 1 stays black for anyone who needs maximum contrast.
- **Inverted states:** white on an ink has the same ratio as the ink on white, so hover and pressed states are no worse.
- **A token I miss stays black inside a unit.** The Playwright check is the mitigation: with a unit on channel 7, collect the computed colors of every element in the unit and its open popover and list, and flag any black.
- **Portal coverage.** A future component that portals out of a unit without `inkStyle` will render black. This will be documented in CLAUDE.md next to the Radix notes.
- **Index rule.** The palette is indexed by channel, not stored, so it can be changed later without link versioning. Changing it would recolor existing compositions, which is acceptable.

## Migration Plan

None. No stored data changes, and deploying is the rollout.

## Open Questions

None.
