# Spec Delta

## MODIFIED Requirements

### Requirement: COMPOSITIONS panel
MENU SHALL open a panel named "COMPOSITIONS" that covers the full height of the viewport at the right edge. It SHALL be at most 360 CSS px wide and never wider than the viewport, white, with a 1px black left border, and no tint over the rest of the page. From top to bottom it SHALL hold:
- its heading;
- a SAVE button;
- the list of saved compositions;
- a MORE button while more compositions exist;
- a footer.

The heading SHALL stay at the top of the panel. The footer SHALL stay at the bottom, above the device's safe-area inset, and be separated from the content above it by a 1px black rule. The footer SHALL hold a link named CHANGELOG that opens the `/changelog` page. Only the area between the heading and the footer (SAVE, the list and MORE) SHALL scroll when its content is taller than the space it has. Scrolling that area SHALL NOT clip the dashed keyboard focus outline of the controls inside it. Escape, a press outside the panel, or a CLOSE button inside it SHALL close it. While it is open, the chimes behind it SHALL keep animating and sounding. The panel SHALL follow the two-color, monospace, square visual rules of `ui-controls`.

#### Scenario: Open and close
- **WHEN** the user opens the panel, then presses Escape
- **THEN** the panel closes, focus returns to MENU, and no unit has changed

#### Scenario: Phone width
- **WHEN** the viewport is 320 px wide and the panel is open
- **THEN** the panel is no wider than the viewport and the page does not scroll sideways

#### Scenario: Footer stays put
- **WHEN** the list is taller than the panel and the user scrolls it to the end
- **THEN** the heading stays at the top, the CHANGELOG footer stays at the bottom, and the rows scroll between them

#### Scenario: Open the changelog
- **WHEN** the user activates CHANGELOG in the footer
- **THEN** the `/changelog` page opens

#### Scenario: Short list
- **WHEN** the list has only a few rows
- **THEN** the footer is still at the bottom edge of the panel, not directly under the list
