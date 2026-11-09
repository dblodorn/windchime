## MODIFIED Requirements

### Requirement: Scale to the tubes
Choosing a scale SHALL tune the unit's tubes (2 to 8 of them, set by TUBES), from tube 1 up, to the scale's notes counted from the root note (ROOT in the octave OCTAVE). When a scale has at least as many notes as there are tubes, its first notes SHALL be used, one per tube. When it has fewer, its notes SHALL wrap around: they repeat from the start one octave higher, and again an octave above that if needed, until every tube is filled. Changing TUBES SHALL retune the tubes by the same rule, keeping the scale and the root note. A tube whose note would be above MIDI note 127 (G9) SHALL instead be tuned one octave lower, and again until it is at most 127, so it keeps its note name; its sound, its MIDI note and its pad in the tube readout SHALL all use that lowered note. The SCALE row's value SHALL show the scale's offsets in semitones, one per tube, as the scale defines them, and the tube readout SHALL show each tube's note name and frequency.

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

#### Scenario: Notes above the MIDI range
- **WHEN** a unit has 8 tubes, the root note is B8 (MIDI 119) and PYEONGJO is chosen
- **THEN** the tubes are B8, C#9, E9, F#9, G#8, B8, C#9 and E9 (every tube at most MIDI 127), the SCALE row still reads `0 +2 +5 +7 +9 +12 +14 +17`, and striking each tube sends that tube's note number

#### Scenario: Lowest root
- **WHEN** the root note is C-1 (MIDI 0) and a tube is struck
- **THEN** tube 1 plays and sends MIDI note 0
