# Proposal

## Why

With up to 16 units on the page, each on its own MIDI channel, there is no way to see at a glance which unit plays on which channel. You have to open each unit's SETTINGS to read its CHANNEL. Modular synths solve the same problem with patch cable colors: a color stands for a signal, so you can follow it across the panel. The Buchla Music Easel's panel shows how this can look, with a few strong, flat primaries on a plain ground. Giving each MIDI channel a color, and drawing each unit in its channel's color, makes the channel assignment readable from across the room while keeping the 1-bit look: still one ink on white, just a different ink per channel.

## What Changes

- **Channel palette.** MIDI channel 1 stays black (`#000000`). Channels 2–16 each get a fixed color from Sanzo Wada's *A Dictionary of Color Combinations* (looked up through the sanzo-wada.dmbk.io MCP server; the chosen set is in design.md):
  - The set should feel like primaries: flat reds, blues, yellows and greens in the spirit of patch cables and the Music Easel's panel, not pastels or muddy tones.
  - Every color must reach at least a 3:1 contrast ratio against white (WCAG 2.x, non-text and large-text minimum).
  - The 15 colors must be distinct enough from each other, and from black, to tell units apart.
  - The palette is fixed and ordered by channel. It is not user-editable.
- **A unit draws in its channel's color.** Whatever is black in a chime unit becomes that unit's channel color, and white stays white:
  - the canvas drawing's pixels and border
  - the four round buttons (border, icon, inverted states)
  - the notes drawer (pads, flash, border, voice/scale line)
  - that unit's SETTINGS popover (text, leaders, borders, controls, inverted highlights, focus outline), including the nested SCALE/SOUNDFONT lists
  - Changing CHANNEL recolors the unit at once.
  - Units on the same channel share a color.
- **Legend in the MIDI OUT dialog.** The dialog gets a CHANNELS legend that lists 1–16, each with its color swatch. Channels that units are using are marked.
- **Everything outside the units stays black on white:** the SHARE/RESET/AUDIO/MIDI row, MENU, the COMPOSITIONS panel, and the MIDI and AUDIO dialogs (except the legend's swatches).
- **BREAKING (design rule):** the strict two-color rule (`#000000` and `#ffffff` only) is relaxed. Each unit is still exactly two colors, ink and white, but the ink is the channel's color.
- **Nothing stored or shared changes.** The color follows the existing `channel` field, which links and saves already carry. There are no new record fields, no share-link version bump, and no API change.

## Capabilities

### New Capabilities
- `channel-colors`: the 16-entry channel palette (channel 1 black, 2–16 Wada colors), its contrast and distinctness requirements, how a unit takes its channel's color, and the legend.

### Modified Capabilities
- `ui-controls`: the two-color rule becomes "white plus one ink". The ink is black for page-level controls and the unit's channel color inside a unit, including its popover and nested lists.
- `chime-drawing`: pixels are white or the unit's ink instead of white or black. The drawing's border and the tube readout's border use the ink.
- `midi-dialog`: the dialog gains the channel color legend. Its visual-language requirement allows the legend's colored swatches.

How a unit's color follows its channel (changing CHANNEL, COPY, RESET and loading) lives in `channel-colors`, so `chime-units` is unchanged.

## Impact

- **`lib/engine.js`:**
  - `present(ch)` writes black pixels. It needs the chime's ink as RGB.
  - A palette export, or a separate `lib/colors.js`, holds the 16 colors.
- **`components/Chime.jsx`:**
  - Each `ChimeUnit` sets a CSS custom property (for example `--ink`) from its channel.
  - Its popover and search-select content, which portal outside the section, need the same property.
  - The MIDI OUT dialog renders the legend.
- **`app/globals.css`:**
  - Theme tokens such as `--foreground`, `--border` and `--accent` are scoped per unit to `var(--ink)`, so the shadcn components recolor without per-component changes.
  - `.tubes .hit` and the canvas border follow it.
- **`components/ui/*`:** probably unchanged, if they already use the theme tokens. Portaled content must carry the unit's `--ink`.
- **CLAUDE.md / AGENTS.md:** update the visual-language section and the two-color enforcement notes.
- **External dependency:** none at runtime. The sanzo-wada.dmbk.io MCP server was used at design time to pick the colors, which are hard-coded.
- **Unaffected:** share links, saved compositions, the API, MIDI bytes and audio.
