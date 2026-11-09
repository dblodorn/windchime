## MODIFIED Requirements

### Requirement: Test note
While a port is selected, a TEST NOTE control SHALL send, for each unit, one note-on for that unit's first tube's current note (a FURIN BELL unit's ROOT) at velocity 100 on that unit's channel, followed by its note-off after 0.5 seconds, whether or not the wind is blowing. TEST NOTE MUST be unavailable while no port is selected.

#### Scenario: Test note sent
- **WHEN** a port is selected, one unit is on channel 3, and the user activates TEST NOTE
- **THEN** `0x92, <tube 0 note>, 100` is sent
- **AND** `0x82, <tube 0 note>, 0` is sent about 0.5 seconds later

#### Scenario: Test note with two units
- **WHEN** units on channels 1 and 2 exist and the user activates TEST NOTE
- **THEN** a note-on for each unit's first tube is sent, one on channel 1 and one on channel 2

#### Scenario: No port selected
- **WHEN** no port is selected
- **THEN** TEST NOTE cannot be activated

#### Scenario: Test note on a furin
- **WHEN** a FURIN BELL unit with ROOT D5 is on channel 1 and the user activates TEST NOTE
- **THEN** `0x90, 74, 100` is sent, and its note-off about 0.5 seconds later
