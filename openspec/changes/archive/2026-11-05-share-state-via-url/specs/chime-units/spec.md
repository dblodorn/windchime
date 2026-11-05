# Spec Delta

## MODIFIED Requirements

### Requirement: Units saved across visits
The system SHALL save every unit in browser storage: its parameters (including TUBES and MIDI MODE), NOTES state, MIDI channel, position and stacking order. It SHALL save after each change and restore all units on load, except when the page is opened from a readable share link, whose units SHALL load instead and replace the saved ones. Each restored unit SHALL be pulled back inside the viewport if the window is now smaller. SOUND is not restored: every unit starts muted on load, because browser sound MUST start only from a tap on a SOUND button. Data saved before this change SHALL be carried over: a saved position and MIDI channel become CHIME 1's, and a saved unit with no tube count loads with 6 tubes, and one with no MIDI MODE (or an unknown one) loads as POLY. A saved tube count outside 2 to 8, or not a whole number, SHALL be brought to the nearest whole number in that range.

#### Scenario: Reload restores units
- **WHEN** three units exist with different scales, tube counts, channels and positions, and the user reloads the page
- **THEN** the same three units appear with the same scales, tube counts, channels and positions, in the same stacking order

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

#### Scenario: Out-of-range tube count
- **WHEN** a saved unit has a tube count of 12
- **THEN** it loads with 8 tubes

#### Scenario: Storage unavailable
- **WHEN** browser storage cannot be read or written
- **THEN** the page shows one default unit and copying, removing and dragging still work for the visit
