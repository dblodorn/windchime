# Spec Delta

## MODIFIED Requirements

### Requirement: Page controls stay black
Everything outside the chime units SHALL stay black on white:
- the SHARE, RESET, AUDIO and MIDI buttons
- MENU and the COMPOSITIONS panel
- the MIDI OUT and AUDIO OUT dialogs, apart from the legend's swatches

The active-channels strip (see `channel-focus`) is the other exception: each of its squares is filled with its channel's ink and shows the channel number in white.

#### Scenario: Fixed buttons with colored units
- **WHEN** units on channels 2, 3 and 4 are on the page
- **THEN** the SHARE, RESET, AUDIO, MIDI and MENU buttons are drawn in black on white

#### Scenario: Strip squares in ink
- **WHEN** units on channels 1, 2 and 3 are on the page
- **THEN** the active-channels strip's squares are filled with `#000000`, `#d60036` and `#0d75ff`, each with its number in white
