# chime-units Specification

## Purpose
Lets the page hold up to 16 independent chime units, one per MIDI channel, made by copying an existing unit with its current state. Every unit's settings and position are kept across visits.

## Requirements

### Requirement: Units on the page
The page SHALL show between 1 and 16 chime units. Each unit is a drawing with its own simulation and its own SOUND, SETTINGS, NOTES and COPY buttons, settings popover, notes drawer and MIDI channel. Units SHALL be numbered CHIME 1, CHIME 2, … in the order they were created, renumbering after a removal so the numbers stay consecutive. On a first visit, with nothing saved, the page SHALL show one unit with the default parameters.

#### Scenario: First visit
- **WHEN** the page loads with nothing saved
- **THEN** exactly one unit, CHIME 1, is shown with the default parameters (WIND 0.45, DECAY 4.0 S, ROOT C5, SCALE RYUKYU) on MIDI channel 1

#### Scenario: Numbering after a removal
- **WHEN** units CHIME 1, CHIME 2 and CHIME 3 exist and the user removes CHIME 2
- **THEN** the remaining units are named CHIME 1 and CHIME 2

### Requirement: Copying a unit
Each unit SHALL have a COPY button: a 30 px circular button in the top-left corner of its drawing that shows a copy-plus icon. Activating COPY SHALL add a new unit with the copied unit's current parameters (VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, MIDI MODE) and its SOUND and NOTES states. The new unit's MIDI channel SHALL be the lowest channel from 1 to 16 that no other unit uses. The new unit SHALL get its own simulation, starting from rest with its own random wind, so the two units do not move or strike in step. It SHALL appear 24 px right and 24 px below the copied unit, moved back inside the viewport if that would put it outside, and above every other unit. While 16 units exist, COPY MUST be disabled on every unit.

#### Scenario: Copy inherits the state
- **WHEN** a unit is set to VOLUME 0.50, TUBES 4, WIND 0.20, SCALE PYEONGJO, ROOT A4, SOUNDFONT CHURCH ORGAN, MIDI MODE MONO, with NOTES on, and the user activates its COPY
- **THEN** a new unit appears showing VOLUME 0.50, TUBES 4, WIND 0.20, SCALE PYEONGJO, ROOT A4, SOUNDFONT CHURCH ORGAN and MIDI MODE MONO, with 4 tubes drawn and its notes drawer shown

#### Scenario: Copy takes the lowest free channel
- **WHEN** units use channels 1 and 3, and the user copies the unit on channel 3
- **THEN** the new unit uses channel 2

#### Scenario: Copies move on their own
- **WHEN** a unit is copied and both run for 10 seconds at WIND 0.45
- **THEN** their strike sequences differ

#### Scenario: Placement
- **WHEN** the user copies a unit
- **THEN** the new unit's top-left corner is 24 px right and 24 px below the copied unit's, or as close as the viewport allows, and the new unit is drawn above the others

#### Scenario: Limit of sixteen
- **WHEN** 16 units exist
- **THEN** every COPY button is disabled, dimmed, and does nothing when activated

### Requirement: Units are independent
Changing a parameter, SOUND or NOTES on one unit MUST NOT change any other unit. Tapping a tube or a note pad SHALL strike only the unit it belongs to. Each unit's strikes SHALL play through its own voice, filter and VOLUME. Pressing on a unit, to drag it, strike it or use one of its controls, SHALL bring it above the other units.

#### Scenario: Parameters stay per unit
- **WHEN** two units exist and the user sets WIND to 0 on CHIME 2
- **THEN** CHIME 1's WIND is unchanged

#### Scenario: Volume per unit
- **WHEN** two units have SOUND on and the user sets CHIME 2's VOLUME to 0
- **THEN** CHIME 2 makes no browser sound, CHIME 1 is as loud as before, and CHIME 2's strikes still send MIDI notes with unchanged velocities

#### Scenario: Strikes stay per unit
- **WHEN** the user taps a tube on CHIME 1
- **THEN** only CHIME 1's tube swings and its readout cell flashes

#### Scenario: Pressed unit comes to the front
- **WHEN** two units overlap and the user presses on the one underneath
- **THEN** that unit is drawn above the other

### Requirement: Removing a unit
Each unit's settings popover SHALL end with a REMOVE button while more than one unit exists. Activating it SHALL remove that unit at once, without a confirmation step, and end its sounding notes. While only one unit exists, REMOVE MUST NOT be shown, so the page always keeps one unit.

#### Scenario: Remove a copy
- **WHEN** two units exist and the user activates REMOVE in CHIME 2's settings
- **THEN** CHIME 2 disappears, CHIME 1 is unchanged, and a note-off is sent for every note CHIME 2 was sounding on MIDI

#### Scenario: Last unit cannot be removed
- **WHEN** one unit exists and the user opens its settings
- **THEN** no REMOVE button is shown

### Requirement: Units saved across visits
The system SHALL save every unit in browser storage: its parameters (including TUBES and MIDI MODE), NOTES state, MIDI channel, position and stacking order. It SHALL save after each change and restore all units on load. Each restored unit SHALL be pulled back inside the viewport if the window is now smaller. SOUND is not restored: every unit starts muted on load, because browser sound MUST start only from a tap on a SOUND button. Data saved before this change SHALL be carried over: a saved position and MIDI channel become CHIME 1's, and a saved unit with no tube count loads with 6 tubes, and one with no MIDI MODE (or an unknown one) loads as POLY. A saved tube count outside 2 to 8, or not a whole number, SHALL be brought to the nearest whole number in that range.

#### Scenario: Reload restores units
- **WHEN** three units exist with different scales, tube counts, channels and positions, and the user reloads the page
- **THEN** the same three units appear with the same scales, tube counts, channels and positions, in the same stacking order

#### Scenario: Units load muted
- **WHEN** a unit had SOUND on and the page is reloaded
- **THEN** its SOUND button shows the muted icon and it makes no browser sound until the user taps it

#### Scenario: Earlier saved data
- **WHEN** the page loads with a position and channel 5 saved by the single-unit version, and no unit list
- **THEN** CHIME 1 appears at that position on channel 5

#### Scenario: Units saved before tube counts
- **WHEN** the page loads a unit list saved before this change, whose units have no tube count
- **THEN** every unit appears with 6 tubes, MIDI MODE POLY and its other saved settings

#### Scenario: Out-of-range tube count
- **WHEN** a saved unit has a tube count of 12
- **THEN** it loads with 8 tubes

#### Scenario: Storage unavailable
- **WHEN** browser storage cannot be read or written
- **THEN** the page shows one default unit and copying, removing and dragging still work for the visit
