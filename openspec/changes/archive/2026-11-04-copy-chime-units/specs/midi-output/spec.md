# Spec Delta

## MODIFIED Requirements

### Requirement: Port selection and memory
The user SHALL be able to choose one output port, or NONE, shared by every unit. The name of the chosen port MUST be saved in browser storage. On connect, the system SHALL select the saved port automatically if one with that name is listed. Otherwise, if exactly one port is listed, it SHALL select that port. Selecting a port SHALL send each unit's current program change and filter CCs, on that unit's channel, when those options are on.

#### Scenario: Remembered port selected on connect
- **WHEN** the user connects and a port with the saved name is listed
- **THEN** that port is selected without the user choosing it

#### Scenario: Single port auto-selected
- **WHEN** the user connects, no saved port matches, and exactly one port is listed
- **THEN** that port is selected

#### Scenario: Selecting a port sends the current setup
- **WHEN** two units on channels 1 and 2 exist and the user selects a port while SEND PROGRAM CHANGE and SEND FILTER AS CC74 / CC71 are on
- **THEN** bank select (CC0, CC32), program change, CC74 and CC71 are sent on channel 1 for CHIME 1's voice and filter, and on channel 2 for CHIME 2's

#### Scenario: Selecting NONE
- **WHEN** the user selects NONE
- **THEN** sounding notes on the previous port are ended
- **AND** strikes are no longer sent to any port

### Requirement: Channel selection
Each unit SHALL have its own MIDI channel, chosen with a CHANNEL select in its settings popover from channels 1–16, with channel 10 labelled GM DRUMS. Two units MAY use the same channel when the user picks it. Each unit's channel MUST be saved in browser storage and restored on load. Changing a unit's channel while its notes are sounding SHALL end those notes on the old channel first.

#### Scenario: Channel persisted
- **WHEN** the user sets CHIME 2's channel to 5 and reloads the page
- **THEN** CHIME 2 is on channel 5

#### Scenario: Channel change ends sounding notes
- **WHEN** CHIME 1's notes are sounding on channel 1 and the user changes its channel to 2
- **THEN** note-offs for those notes are sent on channel 1 before CHIME 1's later notes go out on channel 2

#### Scenario: Channel per unit
- **WHEN** CHIME 1 is on channel 1 and CHIME 2 on channel 2, and a tube is struck on each
- **THEN** CHIME 1's note-on is sent on channel 1 and CHIME 2's on channel 2

### Requirement: Strikes sent as notes
Every chime strike on any unit, from the wind, a tap or a note pad, SHALL send a note-on on the selected port, on that unit's channel. The note SHALL be the struck tube's note and the velocity the strike's velocity, clamped to 1–127. A note-off SHALL follow after that unit's DECAY time. If the same note is struck again on the same channel while it is sounding, its note-off MUST be sent before the new note-on.

#### Scenario: Strike sends a note
- **WHEN** a port is selected, a unit is on channel 1, and its tube 0 is struck at velocity 80
- **THEN** `0x90, <tube 0 note>, 80` is sent
- **AND** `0x80, <tube 0 note>, 0` is sent after that unit's DECAY time

#### Scenario: Re-strike of a sounding note
- **WHEN** a note is struck again on the same channel before its note-off
- **THEN** a note-off for that note is sent right before the new note-on

#### Scenario: No port selected
- **WHEN** no port is selected
- **THEN** no MIDI messages are sent on strikes

### Requirement: Program change and filter CC output
When SEND PROGRAM CHANGE is on, the system SHALL send bank select and program change for a unit's voice, on that unit's channel, whenever that unit's voice or channel changes, a unit is created, or the port changes. When SEND FILTER AS CC74 / CC71 is on, the system SHALL send CC74 (cutoff slider, 0–127) and CC71 (Q mapped to 0–127) for a unit, on its channel, whenever that unit's filter or channel changes, a unit is created, or the port changes. Both options apply to every unit and MUST be saved in browser storage.

#### Scenario: Voice change sends program
- **WHEN** SEND PROGRAM CHANGE is on and the user picks a different voice on a unit on channel 2
- **THEN** CC0, CC32 and a program change for that voice are sent on channel 2

#### Scenario: Filter move sends CCs
- **WHEN** SEND FILTER AS CC74 / CC71 is on and the user moves the cutoff slider of a unit on channel 1
- **THEN** CC74 with the scaled slider value is sent on channel 1

#### Scenario: New copy sends its setup
- **WHEN** both options are on and the user copies a unit, and the copy takes channel 3
- **THEN** bank select, program change, CC74 and CC71 for the copy are sent on channel 3

#### Scenario: Options off
- **WHEN** both options are off
- **THEN** no program change or CC74/CC71 messages are sent

### Requirement: Test note
While a port is selected, a TEST NOTE control SHALL send, for each unit, one note-on for that unit's first tube's current note at velocity 100 on that unit's channel, followed by its note-off after 0.5 seconds, whether or not the wind is blowing. TEST NOTE MUST be unavailable while no port is selected.

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

### Requirement: Panic
A PANIC control SHALL end every note any unit is sounding on the selected port. It sends a note-off for each sounding note, then All Notes Off (CC123) and All Sound Off (CC120) on every channel that a unit uses.

#### Scenario: Panic while notes sound
- **WHEN** notes are sounding and the user activates PANIC
- **THEN** a note-off is sent for each sounding note
- **AND** `0xBn 123 0` and `0xBn 120 0` are sent on the chosen channel
- **AND** no delayed note-offs for those notes are sent afterwards

#### Scenario: Panic with two units
- **WHEN** units on channels 1 and 4 exist and the user activates PANIC
- **THEN** CC123 and CC120 are sent on channel 1 and on channel 4

### Requirement: Browser sound alongside MIDI
The user SHALL be able to turn the browser's own sound on or off for every unit at once while MIDI output is active, without stopping any simulation or MIDI output. Each unit's SOUND toggle still decides whether that unit is heard while browser sound is on.

#### Scenario: Browser sound off
- **WHEN** PLAY SOUND IN BROWSER TOO is turned off while a port is selected
- **THEN** strikes on every unit still send MIDI notes
- **AND** the browser makes no sound for them
