# Spec Delta

## ADDED Requirements

### Requirement: Tube count
Each unit SHALL have between 2 and 8 tubes, set by its TUBES control (see `ui-controls`), with 6 as the default. A change of count SHALL take effect at once, while the chime keeps moving: the drawing, the hit areas, the tube readout, sound and MIDI all follow the new count from the next frame. Tubes that remain keep their tube numbers, so tubes 1 to N of the new count are tubes 1 to N of the old one. Notes already sounding from tubes that are removed SHALL end as they would have (their sound decays, and their MIDI note-offs are sent at the usual time), so no note is left stuck on. The wind, clapper and sail MUST NOT be reset by a change of count. The rate of strikes SHALL follow from the count with no compensation: more tubes give the clapper more to strike, and fewer tubes make a sparser chime.

#### Scenario: Default count
- **WHEN** the page loads with nothing saved
- **THEN** CHIME 1 has 6 tubes

#### Scenario: Fewer tubes
- **WHEN** TUBES is set to 3
- **THEN** the drawing shows 3 tubes, the readout shows 3 pads, and only tubes 1 to 3 are ever struck

#### Scenario: More tubes
- **WHEN** TUBES is set to 8
- **THEN** the drawing shows 8 tubes, the readout shows 8 pads, and tapping each of the 8 tubes strikes it

#### Scenario: Removed tube's note ends
- **WHEN** a MIDI port is selected, tube 8 has just been struck, and TUBES is lowered from 8 to 4 before its note-off is due
- **THEN** tube 8's note-off is still sent on the unit's channel at its usual time

#### Scenario: Motion carries on
- **WHEN** TUBES is changed while the wind is blowing
- **THEN** the clapper and sail continue from where they were, with no jump to rest

#### Scenario: Density follows the count
- **WHEN** a unit runs for 5 minutes at WIND 0.45 with 2 tubes, and again with 8 tubes
- **THEN** the run with 8 tubes has more strikes than the run with 2

## MODIFIED Requirements

### Requirement: Elements of the chime in three-quarter perspective
The drawing SHALL show the chime in the same three-quarter view as before, with the camera turned 20° about the vertical axis so that no two tubes share a screen position (with single-pixel lines, the unturned view merges the back and front tubes into one line per pair). It is scaled to the 200×200 paper and has these elements:
- a hook line from the top edge to the ring;
- the ring as one closed, foreshortened outline that is wider than it is tall;
- one tube per the unit's tube count (2 to 8), each an outlined narrow rectangle (two side lines and top and bottom caps, open inside) as wide as the simulated tube, on a short string line, hung from a point on the ring outline at its true angle. The tubes SHALL be spaced evenly around the ring, and at 6 tubes they hang at exactly the angles they do today;
- the clapper as one foreshortened closed outline on a string from the ring's center;
- the sail as an outlined rectangle on a string below the clapper, narrowing as it turns edge-on to the wind.

For every tube count, no two tubes SHALL hang at the same horizontal screen position. Depth SHALL read from position: tubes at the back of the ring hang from higher points than tubes at the front. Tube lengths SHALL follow pitch: a lower note gets a longer tube, in proportion to the square root of the frequency ratio to the root. The figure MUST fit inside the 200×200 paper at rest, for every tube count, and SHALL fit in at least 99% of frames at the default WIND (0.45). In stronger gusts the clapper, sail and tubes MAY swing past the edge and be clipped there, as the drawing already does today; the simulation is never limited to keep them on the paper.

#### Scenario: Six tubes from the ring
- **WHEN** the chime has 6 tubes and is at rest
- **THEN** six outlined tubes hang from six distinct points on the ring outline, at six distinct horizontal positions
- **AND** the two tubes at the back of the ring hang from points higher than the two at the front

#### Scenario: Every count has distinct tubes
- **WHEN** the tube count is set to each of 2, 3, 4, 5, 6, 7 and 8 in turn, with the chime at rest
- **THEN** that many outlined tubes hang from that many distinct points on the ring outline, at that many distinct horizontal positions

#### Scenario: Lengths follow pitch
- **WHEN** the scale is changed to one whose sixth note is an octave above the first
- **THEN** the sixth tube is drawn about 1/√2 the length of the first

#### Scenario: Figure fits the paper at rest
- **WHEN** WIND is 0 and the chime has come to rest, at any tube count from 2 to 8
- **THEN** no part of the hook, ring, tubes, clapper or sail is clipped at the edge of the paper

#### Scenario: Default wind mostly fits
- **WHEN** the chime runs for 10 minutes at WIND 0.45
- **THEN** at least 99% of frames have no part of the figure outside the paper

#### Scenario: Strong gusts may clip
- **WHEN** WIND is 1.0 and a gust swings the sail past the edge of the paper
- **THEN** the part beyond the edge is clipped, and the simulation's motion is unaffected

### Requirement: Drawing follows the unchanged simulation
Each unit's drawing SHALL show that unit's own simulation. Positions SHALL come from the simulation's state through the existing three-quarter projection, scaled to the paper. Tubes swing with their displacement, the clapper is drawn at its simulated position (so it meets the tube it strikes), and the sail turns with the wind. At 6 tubes the simulation itself MUST NOT change: for the same random seed and parameters, it SHALL produce the same sequence of strikes (tube, velocity, time) as before this change, whichever unit it runs in. Other tube counts use the same physics with their own tube positions.

#### Scenario: Strike sequence unchanged
- **WHEN** a two-minute take is rendered with 6 tubes, a fixed random seed and default parameters, before and after this change
- **THEN** both takes contain the same strikes, with the same tubes, velocities and times

#### Scenario: Clapper meets the struck tube
- **WHEN** a strike on tube k is reported by a unit's simulation, at any tube count
- **THEN** in that frame the unit's clapper outline is drawn within a few pixels of tube k's line

#### Scenario: Each unit draws its own chime
- **WHEN** two units run at WIND 0.45
- **THEN** each drawing shows its own clapper and sail positions, which differ between the two

### Requirement: Tube readout matches the drawing
The tube readout beneath the drawing SHALL keep its 1px black border and have one column per tube (2 to 8, each a note pad with note name and frequency), in tube order. The columns SHALL share the readout's width equally. Its width MUST equal the drawing's displayed width at every size and every tube count, and a struck tube's cell inverts briefly as before.

#### Scenario: Widths match
- **WHEN** the page is shown at 1280 px and at 375 px wide
- **THEN** the readout's outer width equals the canvas's outer width at both sizes

#### Scenario: Eight pads on a phone
- **WHEN** a unit has 8 tubes, its readout is shown, and the page is 375 px wide
- **THEN** the readout shows 8 pads in one row, its outer width equals the canvas's, and the page has no horizontal scroll
