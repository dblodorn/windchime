# Proposal

## Why

On a phone, a unit fills the screen's whole width: about 343 px on a 375 px screen, plus its notes drawer. With two or more units on the page, they cover each other almost completely and there is no room to arrange them. A smaller unit on narrow screens leaves space to see and drag several chimes at once.

## What Changes

- **On narrow screens a unit is at most 300 px wide.** "Narrow" means a viewport under 640 CSS px wide. The 300 px is the whole unit: the drawing plus its 1 px border, so the drawing is 298 px. The breakpoint is the screen's width, not the input type, so a narrow desktop window gets the small size too, and a tablet (768 px and up) keeps the current size.
- **The notes drawer and its sound line follow the drawing's width,** as they already do.
- **Screens narrower than 300 px are unchanged:** the unit fills the available width, as now.
- **Wider screens are unchanged:** the drawing is 400 px wherever there is room, and otherwise fills the available width.
- **Moving across the breakpoint resizes the unit at once.** Rotating a phone, or resizing a window across 640 px, does this, and positions are pulled back inside the viewport as they already are on resize.
- **Everything around the unit keeps its size:** the round buttons, the SETTINGS popover, the MENU button and the lower-right button row.

## Capabilities

### New Capabilities

### Modified Capabilities
- `chime-drawing`: the sizing rule in "Square raster in a 1px border" gains the narrow-screen cap of 298 px for the drawing, 300 px with its border, and the phone scenario changes.

## Impact

- **`components/Chime.jsx`:** the `ChimeUnit` fit effect caps the drawing width at 298 px while `window.innerWidth < 640`. The `motion.section` width class needs the same cap.
- **`CLAUDE.md` and `AGENTS.md`:** the layout notes.
- **Not affected:** stored positions, share links and saved compositions. Positions are offsets from the center and are clamped to the viewport as before.
