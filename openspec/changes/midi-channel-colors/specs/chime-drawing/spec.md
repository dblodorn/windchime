## MODIFIED Requirements

### Requirement: Square raster in a 1px border
The drawing SHALL be a 200×200 raster. Each pixel MUST be pure white or the unit's channel ink (black on channel 1, see `channel-colors`), with no anti-aliasing. It is shown with nearest-neighbor scaling, at the first of these that applies:
- **Narrow viewport** (under 640 CSS px wide, phones and narrow windows): 298 px, so the unit with its border is 300 px wide. Where the available width is smaller, the drawing fills it instead, staying square.
- **Room for at least 400 px:** a whole multiple of 200 px (×2 = 400 px on desktop).
- **Otherwise:** the available width, staying square.

The size SHALL follow the viewport when it changes (a phone rotated, a window resized across 640 px), at once. The unit's notes drawer and sound line SHALL keep the drawing's width, and its position SHALL be pulled back inside the viewport as on any resize. The round buttons, the settings popover and the page's fixed buttons MUST keep their size.

The drawing SHALL be framed by a 1px solid border in the unit's ink at screen resolution, with square corners, outside the raster so it covers no pixels.

#### Scenario: Desktop size
- **WHEN** the page is shown at 1280 px wide
- **THEN** the canvas has an intrinsic size of 200×200, a displayed drawing area of 400×400 px, and image rendering `pixelated`
- **AND** a 1px solid border in the unit's ink surrounds it

#### Scenario: Phone size
- **WHEN** the page is shown at 375 px wide
- **THEN** the drawing area is 298×298 px and the unit, border included, is 300 px wide
- **AND** the page has no horizontal scroll

#### Scenario: Smallest phone
- **WHEN** the page is shown at 320 px wide
- **THEN** the drawing area is square and fills the available width inside the page padding, under 298 px
- **AND** the page has no horizontal scroll

#### Scenario: Narrow desktop window
- **WHEN** a desktop browser window is 600 px wide
- **THEN** the drawing area is 298×298 px

#### Scenario: Across the breakpoint
- **WHEN** the window is resized from 600 px wide to 800 px wide, and back
- **THEN** the drawing area becomes 400×400 px, then 298×298 px again, with no reload, and the unit stays fully inside the viewport

#### Scenario: Drawer follows on a phone
- **WHEN** the page is shown at 375 px wide and a unit's NOTES is on
- **THEN** the readout and its sound line are 300 px wide, the same as the drawing with its border

#### Scenario: Two colors only
- **WHEN** any frame is read back from the canvas of a unit on channel 1
- **THEN** every pixel is either `#000000` or `#ffffff`

#### Scenario: Two colors in the channel ink
- **WHEN** any frame is read back from the canvas of a unit on channel 8
- **THEN** every pixel is either `#cc1a97` or `#ffffff`

### Requirement: Single-pixel line vocabulary
Every element SHALL be drawn as single-pixel straight lines or runs of short straight segments. No element is drawn as a filled area, a doubled outline, a dotted highlight or a shimmer of dashes. Where lines cross, both stay visible: no element hides another, and the drawing reads as a wireframe.

#### Scenario: No filled areas at rest
- **WHEN** WIND is 0, no tube is ringing, and the chime has come to rest
- **THEN** the frame contains no 3×3 block of all-ink pixels

#### Scenario: Lines behind stay visible
- **WHEN** the clapper passes in front of a tube in the drawing
- **THEN** the tube's line stays visible through the clapper outline

### Requirement: Tube readout matches the drawing
The tube readout beneath the drawing SHALL keep its 1px border, in the unit's ink. It SHALL have one column per tube (2 to 8, each a note pad with note name and frequency) in tube order, or a single column for a FURIN BELL unit. The columns SHALL share the readout's width equally. Its width MUST equal the drawing's displayed width at every size, every tube count and either instrument. A struck tube's cell inverts briefly as before, to white on the unit's ink.

#### Scenario: Widths match
- **WHEN** the page is shown at 1280 px and at 375 px wide
- **THEN** the readout's outer width equals the canvas's outer width at both sizes

#### Scenario: Eight pads on a phone
- **WHEN** a unit has 8 tubes, its readout is shown, and the page is 375 px wide
- **THEN** the readout shows 8 pads in one row, its outer width equals the canvas's, and the page has no horizontal scroll
