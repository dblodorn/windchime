# chime-drawing Specification

## Purpose

Defines the instrument drawing: a 200×200, 1-bit, single-pixel-line picture of the chime in three-quarter perspective, drawn in the vocabulary of John Maeda's *Design By Numbers* and framed by a 1px border. It shows the simulation's motion, and lets a person strike a tube by tapping it.

## Requirements

### Requirement: Square raster in a 1px border
The drawing SHALL be a 200×200 raster. Each pixel MUST be pure black or pure white, with no anti-aliasing. It is shown with nearest-neighbor scaling:
- at a whole multiple of 200 px where the layout has room for at least 400 px (×2 = 400 px on desktop);
- otherwise at the available width, staying square.

The drawing SHALL be framed by a 1px solid black border at screen resolution, with square corners, outside the raster so it covers no pixels.

#### Scenario: Desktop size
- **WHEN** the page is shown at 1280 px wide
- **THEN** the canvas has an intrinsic size of 200×200, a displayed drawing area of 400×400 px, and image rendering `pixelated`
- **AND** a 1px solid black border surrounds it

#### Scenario: Phone size
- **WHEN** the page is shown at 375 px wide
- **THEN** the drawing area is square and fills the available width inside the page padding
- **AND** the page has no horizontal scroll

#### Scenario: Two colors only
- **WHEN** any frame is read back from the canvas
- **THEN** every pixel is either `#000000` or `#ffffff`

### Requirement: Single-pixel line vocabulary
Every element SHALL be drawn as single-pixel straight lines or runs of short straight segments. No element is drawn as a filled area, a doubled outline, a dotted highlight or a shimmer of dashes. Where lines cross, both stay visible: no element hides another, and the drawing reads as a wireframe.

#### Scenario: No filled areas at rest
- **WHEN** WIND is 0, no tube is ringing, and the chime has come to rest
- **THEN** the frame contains no 3×3 block of all-black pixels

#### Scenario: Lines behind stay visible
- **WHEN** the clapper passes in front of a tube in the drawing
- **THEN** the tube's line stays visible through the clapper outline

### Requirement: Elements of the chime in three-quarter perspective
The drawing SHALL show the chime in the same three-quarter view as before, with the camera turned 20° about the vertical axis so that no two tubes share a screen position (with single-pixel lines, the unturned view merges the back and front tubes into one line per pair). It is scaled to the 200×200 paper and has these elements:
- a hook line from the top edge to the ring;
- the ring as one closed, foreshortened outline that is wider than it is tall;
- six tubes, each an outlined narrow rectangle (two side lines and top and bottom caps, open inside) as wide as the simulated tube, on a short string line, hung from a point on the ring outline at its true angle;
- the clapper as one foreshortened closed outline on a string from the ring's center;
- the sail as an outlined rectangle on a string below the clapper, narrowing as it turns edge-on to the wind.

Depth SHALL read from position: tubes at the back of the ring hang from higher points than tubes at the front. Tube lengths SHALL follow pitch: a lower note gets a longer tube, in proportion to the square root of the frequency ratio to the root. The figure MUST fit inside the 200×200 paper at rest, and SHALL fit in at least 99% of frames at the default WIND (0.45). In stronger gusts the clapper, sail and tubes MAY swing past the edge and be clipped there, as the drawing already does today; the simulation is never limited to keep them on the paper.

#### Scenario: Six tubes from the ring
- **WHEN** the chime is at rest
- **THEN** six outlined tubes hang from six distinct points on the ring outline, at six distinct horizontal positions
- **AND** the two tubes at the back of the ring hang from points higher than the two at the front

#### Scenario: Lengths follow pitch
- **WHEN** the scale is changed to one whose sixth note is an octave above the first
- **THEN** the sixth tube is drawn about 1/√2 the length of the first

#### Scenario: Figure fits the paper at rest
- **WHEN** WIND is 0 and the chime has come to rest
- **THEN** no part of the hook, ring, tubes, clapper or sail is clipped at the edge of the paper

#### Scenario: Default wind mostly fits
- **WHEN** the chime runs for 10 minutes at WIND 0.45
- **THEN** at least 99% of frames have no part of the figure outside the paper

#### Scenario: Strong gusts may clip
- **WHEN** WIND is 1.0 and a gust swings the sail past the edge of the paper
- **THEN** the part beyond the edge is clipped, and the simulation's motion is unaffected

### Requirement: Drawing follows the unchanged simulation
Positions SHALL come from the simulation's state through the existing three-quarter projection, scaled to the new paper. Tubes swing with their displacement, the clapper is drawn at its simulated position (so it meets the tube it strikes), and the sail turns with the wind. The simulation itself MUST NOT change: for the same random seed and parameters, it SHALL produce the same sequence of strikes (tube, velocity, time) as before this change.

#### Scenario: Strike sequence unchanged
- **WHEN** a two-minute take is rendered with a fixed random seed and default parameters, before and after this change
- **THEN** both takes contain the same strikes, with the same tubes, velocities and times

#### Scenario: Clapper meets the struck tube
- **WHEN** a strike on tube k is reported by the simulation
- **THEN** in that frame the clapper outline is drawn within a few pixels of tube k's line

### Requirement: Wind shown as dashes
The drawing SHALL show the wind as sparse, short, single-pixel horizontal dashes that drift with the wind. Their number follows WIND: none at 0, and more as WIND rises.

#### Scenario: Still air
- **WHEN** WIND is 0
- **THEN** no wind dashes are drawn

#### Scenario: Strong wind
- **WHEN** WIND is raised from 0.2 to 0.8
- **THEN** more wind dashes are drawn

### Requirement: Strike a tube by tapping
Tapping or clicking the drawing near a tube's line, within the tube's height, SHALL strike that tube. The strike has the same effect as before this change: velocity 96, the tube swings, sound plays, a MIDI note is sent when a port is selected, and its readout cell flashes. Each tube's hit area MUST extend at least 6 raster pixels to either side of its line, so the target is at least 12 CSS px wide at ×2. When hit areas overlap, the nearest tube wins. Tapping away from every tube strikes nothing.

#### Scenario: Tap each tube
- **WHEN** a person taps on each tube's line in turn, halfway down its length
- **THEN** each tap strikes that tube and only that tube

#### Scenario: Near miss still strikes
- **WHEN** a person taps 5 raster pixels to the side of a tube's line, with no other tube nearer
- **THEN** that tube is struck

#### Scenario: Empty space
- **WHEN** a person taps the top corner of the paper, away from every tube
- **THEN** no tube is struck

### Requirement: Tube readout matches the drawing
The tube readout beneath the drawing SHALL keep its 1px black border and six columns (T1–T6 with note name and frequency). Its width MUST equal the drawing's displayed width at every size, and a struck tube's cell inverts briefly as before.

#### Scenario: Widths match
- **WHEN** the page is shown at 1280 px and at 375 px wide
- **THEN** the readout's outer width equals the canvas's outer width at both sizes
