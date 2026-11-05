# scales Specification

## Purpose

Defines the SCALE menu's catalog of tunings for a chime's tubes (2 to 8 of them): how scales are grouped and ordered, which one is the default, how a scale's intervals become one pitch per tube, and the contents of the Korean group.

## Requirements

### Requirement: Grouped scale catalog
The SCALE select SHALL offer named scales in groups, each under its group heading. The groups SHALL appear in this order: Japan and Okinawa, Korea, Pentatonic, Hexatonic, Modes and maqam, Chords and series. RYUKYU, the first scale of the first group, SHALL be selected when the page loads. Two scales MAY share the same intervals under different names, in the same group or in different groups. Scale names SHALL be shown in uppercase, with no notes or annotations beside them.

#### Scenario: Default scale
- **WHEN** the page loads
- **THEN** the SCALE field shows RYUKYU and the tubes are tuned to it

#### Scenario: Group order
- **WHEN** the SCALE select is opened
- **THEN** its group headings read, in order: Japan and Okinawa, Korea, Pentatonic, Hexatonic, Modes and maqam, Chords and series

#### Scenario: Catalog size
- **WHEN** every option in the SCALE select is counted
- **THEN** there are 32 scales

### Requirement: Scale to six tubes
Choosing a scale SHALL tune the six tubes, from tube 1 up, to the scale's notes counted from the ROOT. When a scale has fewer than six notes, its notes SHALL repeat from the start one octave higher until six tubes are filled. When it has six or more, the first six notes SHALL be used. The SCALE row's value SHALL show the six resulting offsets in semitones, and the tube readout SHALL show each tube's note name and frequency.

#### Scenario: Five-note scale
- **WHEN** ROOT is C5 and PYEONGJO is chosen
- **THEN** the tubes are C5, D5, F5, G5, A5 and C6, and the SCALE row reads `0 +2 +5 +7 +9 +12`

#### Scenario: Six-note scale
- **WHEN** ROOT is C5 and PYEONGJO HEXATONIC is chosen
- **THEN** the tubes are C5, D5, F5, G5, A5 and A#5, and the SCALE row reads `0 +2 +5 +7 +9 +10`

### Requirement: Korean scales
The catalog SHALL include a Korea group, headed "Korea", with these scales in this order. Each scale is given as semitones above the root:

| Name | Semitones |
|---|---|
| PYEONGJO | 0 2 5 7 9 |
| UJO | 0 2 5 7 9 |
| GYEMYEONJO | 0 3 5 7 10 |
| PYEONGJO HEXATONIC | 0 2 5 7 9 10 |
| NANDO-GYEMYEONJO | 0 2 3 5 7 |

Names SHALL use Revised Romanization. Choosing any of them MUST set the tubes, the tube readout, sound and MIDI notes the same way as any other scale.

#### Scenario: Korea group contents
- **WHEN** the SCALE select is opened
- **THEN** under the Korea heading it lists PYEONGJO, UJO, GYEMYEONJO, PYEONGJO HEXATONIC and NANDO-GYEMYEONJO, in that order

#### Scenario: Gyemyeonjo is the la mode
- **WHEN** ROOT is A4 and GYEMYEONJO is chosen
- **THEN** the tubes are A4, C5, D5, E5, G5 and A5

#### Scenario: Korean scale sends its notes over MIDI
- **WHEN** a MIDI port is selected, ROOT is C5, NANDO-GYEMYEONJO is chosen, and the user taps tube 2
- **THEN** a note-on for D5 (MIDI note 74) is sent on the chosen channel
