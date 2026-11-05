# Spec Delta

## MODIFIED Requirements

### Requirement: Strikes sent as notes
Every chime strike on any unit, from the wind, a tap or a note pad, SHALL send a note-on on the selected port, on that unit's channel. The note SHALL be the struck tube's note and the velocity the strike's velocity, clamped to 1–127. A note-off SHALL follow after that unit's DECAY time. How a strike treats the same note already sounding on its channel follows the striking unit's MIDI MODE:
- **POLY** (the default): strikes are polyphonic across tubes. When the note is sounding from a different tube (of the same unit, where two tubes share a pitch, or of another unit on the same channel), the new strike's note-on MUST be sent without a note-off before it, and that note's note-off SHALL be sent once, when the latest of the overlapping strikes reaches its DECAY time. If the same tube is struck again while its note is sounding, that note's note-off MUST be sent before the new note-on.
- **MONO**: one note per key. When the note is sounding on the channel, from any tube or unit, its note-off MUST be sent before the new note-on, and the note-off then follows this strike by its DECAY time.

In both modes, different notes on the same channel overlap freely. MIDI MODE MUST NOT affect the browser sound.

#### Scenario: Strike sends a note
- **WHEN** a port is selected, a unit is on channel 1, and its tube 0 is struck at velocity 80
- **THEN** `0x90, <tube 0 note>, 80` is sent
- **AND** `0x80, <tube 0 note>, 0` is sent after that unit's DECAY time

#### Scenario: Re-strike of a sounding note
- **WHEN** the same tube is struck again before its note-off
- **THEN** a note-off for that note is sent right before the new note-on

#### Scenario: Two tubes with the same pitch
- **WHEN** a port is selected, a unit on channel 1 in POLY has 8 tubes with ROOT C5 and CHINESE GONG (so tubes 6 and 8 are both C6), DECAY is 4 s, tube 6 is struck, and tube 8 is struck 1 s later
- **THEN** two note-ons for C6 (MIDI note 84) are sent on channel 1 with no note-off between them
- **AND** one note-off for C6 is sent 4 s after the second strike, and none before it

#### Scenario: Two units sharing a channel
- **WHEN** two units in POLY are on channel 1, both tuned so a tube plays C5, and each strikes its C5 tube within its DECAY time of the other
- **THEN** both note-ons are sent with no note-off between them, and a single note-off follows the later strike by its unit's DECAY time

#### Scenario: Mono cuts the same key
- **WHEN** a unit on channel 1 has MIDI MODE MONO, 8 tubes with ROOT C5 and CHINESE GONG, tube 6 is struck, and tube 8 is struck 1 s later
- **THEN** a note-off for C6 is sent right before the second note-on for C6
- **AND** the final note-off for C6 follows the second strike by DECAY

#### Scenario: Mono keeps different keys overlapping
- **WHEN** a unit has MIDI MODE MONO and tubes 1 and 2 (different notes) are struck 0.5 s apart
- **THEN** no note-off is sent for tube 1's note before its DECAY time

#### Scenario: Poly is the default
- **WHEN** the page loads with nothing saved
- **THEN** CHIME 1's MIDI MODE is POLY

#### Scenario: No port selected
- **WHEN** no port is selected
- **THEN** no MIDI messages are sent on strikes
