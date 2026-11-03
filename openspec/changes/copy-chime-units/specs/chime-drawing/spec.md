# Spec Delta

## MODIFIED Requirements

### Requirement: Drawing follows the unchanged simulation
Each unit's drawing SHALL show that unit's own simulation. Positions SHALL come from the simulation's state through the existing three-quarter projection, scaled to the paper. Tubes swing with their displacement, the clapper is drawn at its simulated position (so it meets the tube it strikes), and the sail turns with the wind. The simulation itself MUST NOT change: for the same random seed and parameters, it SHALL produce the same sequence of strikes (tube, velocity, time) as before this change, whichever unit it runs in.

#### Scenario: Strike sequence unchanged
- **WHEN** a two-minute take is rendered with a fixed random seed and default parameters, before and after this change
- **THEN** both takes contain the same strikes, with the same tubes, velocities and times

#### Scenario: Clapper meets the struck tube
- **WHEN** a strike on tube k is reported by a unit's simulation
- **THEN** in that frame the unit's clapper outline is drawn within a few pixels of tube k's line

#### Scenario: Each unit draws its own chime
- **WHEN** two units run at WIND 0.45
- **THEN** each drawing shows its own clapper and sail positions, which differ between the two

### Requirement: Strike a tube by tapping
Tapping or clicking a unit's drawing near a tube's line, within the tube's height, SHALL strike that tube of that unit only. The strike has the same effect as before this change: velocity 96, the tube swings, sound plays through that unit's voice, a MIDI note is sent on that unit's channel when a port is selected, and its readout cell flashes. Each tube's hit area MUST extend at least 6 raster pixels to either side of its line, so the target is at least 12 CSS px wide at ×2. When hit areas overlap, the nearest tube wins. Tapping away from every tube strikes nothing; pressing there starts dragging the unit (see `ui-controls`).

#### Scenario: Tap each tube
- **WHEN** a person taps on each tube's line in turn, halfway down its length
- **THEN** each tap strikes that tube and only that tube

#### Scenario: Near miss still strikes
- **WHEN** a person taps 5 raster pixels to the side of a tube's line, with no other tube nearer
- **THEN** that tube is struck

#### Scenario: Empty space
- **WHEN** a person taps the top corner of the paper, away from every tube
- **THEN** no tube is struck

#### Scenario: Only the tapped unit
- **WHEN** two units exist and a person taps a tube on CHIME 2
- **THEN** CHIME 2's tube is struck and CHIME 1 strikes nothing from that tap
