# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Scale to six tubes`
- TO: `### Requirement: Scale to the tubes`

## MODIFIED Requirements

### Requirement: Scale to the tubes
Choosing a scale SHALL tune the unit's tubes (2 to 8 of them, set by TUBES), from tube 1 up, to the scale's notes counted from the ROOT. When a scale has at least as many notes as there are tubes, its first notes SHALL be used, one per tube. When it has fewer, its notes SHALL wrap around: they repeat from the start one octave higher, and again an octave above that if needed, until every tube is filled. Changing TUBES SHALL retune the tubes by the same rule, keeping the scale and ROOT. The SCALE row's value SHALL show the resulting offsets in semitones, one per tube, and the tube readout SHALL show each tube's note name and frequency.

#### Scenario: Five-note scale
- **WHEN** a unit has 6 tubes, ROOT is C5 and PYEONGJO is chosen
- **THEN** the tubes are C5, D5, F5, G5, A5 and C6, and the SCALE row reads `0 +2 +5 +7 +9 +12`

#### Scenario: Six-note scale
- **WHEN** a unit has 6 tubes, ROOT is C5 and PYEONGJO HEXATONIC is chosen
- **THEN** the tubes are C5, D5, F5, G5, A5 and A#5, and the SCALE row reads `0 +2 +5 +7 +9 +10`

#### Scenario: Wrapping to eight tubes
- **WHEN** a unit has 8 tubes, ROOT is C5 and PYEONGJO is chosen
- **THEN** the tubes are C5, D5, F5, G5, A5, C6, D6 and F6, and the SCALE row reads `0 +2 +5 +7 +9 +12 +14 +17`

#### Scenario: Seven-note scale on eight tubes
- **WHEN** a unit has 8 tubes, ROOT is C5 and DORIAN is chosen
- **THEN** the tubes are C5, D5, D#5, F5, G5, A5, A#5 and C6, and the SCALE row reads `0 +2 +3 +5 +7 +9 +10 +12`

#### Scenario: First notes on fewer tubes
- **WHEN** a unit has 3 tubes, ROOT is C5 and PYEONGJO is chosen
- **THEN** the tubes are C5, D5 and F5, and the SCALE row reads `0 +2 +5`

#### Scenario: Changing the count retunes
- **WHEN** ROOT is C5, PYEONGJO is chosen, and TUBES is raised from 5 to 7
- **THEN** the scale stays PYEONGJO and the tubes become C5, D5, F5, G5, A5, C6 and D6
