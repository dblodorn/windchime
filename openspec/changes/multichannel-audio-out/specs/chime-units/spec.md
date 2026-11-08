# Spec Delta

## MODIFIED Requirements

### Requirement: Copying a unit
Each unit SHALL have a COPY button: a 30 px circular button in the top-left corner of its drawing that shows a copy-plus icon. Activating COPY SHALL add a new unit with the copied unit's current parameters (VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, OUTPUT, MIDI MODE) and its SOUND and NOTES states. The new unit's MIDI channel SHALL be the lowest channel from 1 to 16 that no other unit uses. The new unit SHALL get its own simulation, starting from rest with its own random wind, so the two units do not move or strike in step. It SHALL appear 24 px right and 24 px below the copied unit, moved back inside the viewport if that would put it outside, and above every other unit. While 16 units exist, COPY MUST be disabled on every unit.

#### Scenario: Copy inherits the state
- **WHEN** a unit is set to VOLUME 0.50, TUBES 4, WIND 0.20, SCALE PYEONGJO, ROOT A4, SOUNDFONT CHURCH ORGAN, OUTPUT `3–4`, MIDI MODE MONO, with NOTES on, and the user activates its COPY
- **THEN** a new unit appears showing VOLUME 0.50, TUBES 4, WIND 0.20, SCALE PYEONGJO, ROOT A4, SOUNDFONT CHURCH ORGAN, OUTPUT `3–4` and MIDI MODE MONO, with 4 tubes drawn and its notes drawer shown

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

### Requirement: Units saved across visits
The system SHALL save every unit in browser storage: its parameters (including TUBES, OUTPUT and MIDI MODE), NOTES state, MIDI channel, position and stacking order. It SHALL save after each change and restore all units on load, except when the page is opened from a readable share link, whose units SHALL load instead and replace the saved ones. Each restored unit SHALL be pulled back inside the viewport if the window is now smaller. SOUND is not restored: every unit starts muted on load, because browser sound MUST start only from a tap on a SOUND button. Data saved before this change SHALL be carried over: a saved position and MIDI channel become CHIME 1's, and a saved unit with no tube count loads with 6 tubes, one with no MIDI MODE (or an unknown one) loads as POLY, and one with no OUTPUT (or an unreadable one) loads on `1–2`. A saved tube count outside 2 to 8, or not a whole number, SHALL be brought to the nearest whole number in that range.

#### Scenario: Reload restores units
- **WHEN** three units exist with different scales, tube counts, outputs, channels and positions, and the user reloads the page
- **THEN** the same three units appear with the same scales, tube counts, outputs, channels and positions, in the same stacking order

#### Scenario: Share link takes precedence
- **WHEN** units are saved and the page is opened from a share link
- **THEN** the linked units appear instead of the saved ones, and are saved in their place

#### Scenario: Units load muted
- **WHEN** a unit had SOUND on and the page is reloaded
- **THEN** its SOUND button shows the muted icon and it makes no browser sound until the user taps it

#### Scenario: Earlier saved data
- **WHEN** the page loads with a position and channel 5 saved by the single-unit version, and no unit list
- **THEN** CHIME 1 appears at that position on channel 5

#### Scenario: Units saved before tube counts
- **WHEN** the page loads a unit list saved before this change, whose units have no tube count
- **THEN** every unit appears with 6 tubes, MIDI MODE POLY and its other saved settings

#### Scenario: Units saved before outputs
- **WHEN** the page loads a unit list whose units have no OUTPUT
- **THEN** every unit appears on OUTPUT `1–2` with its other saved settings

#### Scenario: Out-of-range tube count
- **WHEN** a saved unit has a tube count of 12
- **THEN** it loads with 8 tubes

#### Scenario: Storage unavailable
- **WHEN** browser storage cannot be read or written
- **THEN** the page shows one default unit and copying, removing and dragging still work for the visit

### Requirement: Resetting the page
The page SHALL show a RESET button fixed to the lower right, immediately left of the AUDIO button (of the MIDI button on phones and tablets, which have no AUDIO button) and right of the SHARE button, 8 CSS px from each, with the same height, width, border and style as those buttons, labelled with the text `RESET` in the UI font and no icon. It SHALL stay above every unit, invert on hover, show the dashed keyboard focus outline, and activate with a click, a tap, Enter or Space. Its accessible name SHALL be "RESET".

Activating RESET SHALL, at once and without asking for confirmation, replace every unit on the page with one unit, CHIME 1, with the default parameters (the unit a first visit shows), on MIDI channel 1 and OUTPUT `1–2`, at the center of the page, with SOUND off and its notes readout hidden. The MIDI notes of the units it replaces SHALL be ended. The stored composition SHALL become that single unit, so a reload shows it. RESET SHALL NOT change the MIDI port, the SEND options, PLAY SOUND IN BROWSER TOO or the chosen audio output device.

#### Scenario: Placement
- **WHEN** the page loads in a desktop browser at any viewport width
- **THEN** SHARE, RESET, AUDIO and MIDI sit in one row at the lower right, in that order from left to right, 8 px apart, with the same height and bottom edge

#### Scenario: Reset several units
- **WHEN** three units exist with changed settings and positions, and the user activates RESET
- **THEN** exactly one unit, CHIME 1, is shown at the center with WIND 0.45, DECAY 4.0 S, ROOT C5, SCALE RYUKYU on MIDI channel 1 and OUTPUT `1–2`, muted

#### Scenario: Notes end
- **WHEN** a MIDI port is live, units are sounding notes on channels 1 and 2, and the user activates RESET
- **THEN** note-offs are sent for every sounding note on channels 1 and 2, and the MIDI port stays selected

#### Scenario: Survives reload
- **WHEN** the user activates RESET, then reloads the page
- **THEN** the page shows the single default unit
