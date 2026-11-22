# Spec Delta

## ADDED Requirements

### Requirement: Yamaha DX7
The SOUND list's EXTERNAL SYNTHS SHALL include YAMAHA DX7 (`x:yamaha-dx7`, link code 2), played by `@dblodorn/yamaha-dx7-engine`. Its PATCH picker SHALL list the DX7 voices shared from the DX7 editor (`dmbkSoundDx7Voices`), searching at most 10 characters. Its INIT SHALL be bundled and as loud as the built-in voices.

#### Scenario: Pick a shared DX7 patch
- **WHEN** a unit's SOUND is set to YAMAHA DX7 and PATCH to a shared voice
- **THEN** the voice is fetched as a `Dx7Voice` through `SynthPatch`, the unit plays it, and the notes line names it
