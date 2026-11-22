# Spec Delta

## MODIFIED Requirements

### Requirement: Program change and filter CC output
When SEND PROGRAM CHANGE is on, the system SHALL send bank select and program change for a unit's voice, on that unit's channel, whenever that unit's voice or channel changes, a unit is created, or the port changes. A unit whose sound is an external synth has no General MIDI program, so the system SHALL send no bank select or program change for it, whatever its patch, and changing its patch SHALL send nothing. When SEND FILTER AS CC74 / CC71 is on, the system SHALL send CC74 (cutoff slider, 0–127) and CC71 (Q mapped to 0–127) for a unit, on its channel, whenever that unit's filter or channel changes, a unit is created, or the port changes, external synths included. Both options apply to every unit and MUST be saved in browser storage.

#### Scenario: Voice change sends program
- **WHEN** SEND PROGRAM CHANGE is on and the user picks a different voice on a unit on channel 2
- **THEN** CC0, CC32 and a program change for that voice are sent on channel 2

#### Scenario: External synth sends no program
- **WHEN** SEND PROGRAM CHANGE is on and the user picks CASIO VZ-10M, then a different patch, on a unit on channel 2
- **THEN** no bank select or program change is sent on channel 2, and the unit's notes are sent as usual

#### Scenario: Filter move sends CCs
- **WHEN** SEND FILTER AS CC74 / CC71 is on and the user moves the cutoff slider of a unit on channel 1
- **THEN** CC74 with the scaled slider value is sent on channel 1

#### Scenario: New copy sends its setup
- **WHEN** both options are on and the user copies a unit, and the copy takes channel 3
- **THEN** bank select, program change, CC74 and CC71 for the copy are sent on channel 3

#### Scenario: Options off
- **WHEN** both options are off
- **THEN** no program change or CC74/CC71 messages are sent
