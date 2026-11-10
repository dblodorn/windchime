# channel-colors Specification

## Purpose
Gives each MIDI channel a fixed ink color, black for channel 1 and a Sanzo Wada color for each of channels 2–16, so a glance at a chime unit tells which channel it plays on, the way patch cable colors identify signals on a modular synth.

## Requirements

### Requirement: Channel palette
The system SHALL assign each MIDI channel a fixed ink color, from this table. Every color except black is from Sanzo Wada's *A Dictionary of Color Combinations*:

| Channel | Name | Hex |
|---|---|---|
| 1 | Black | `#000000` |
| 2 | Carmine | `#d60036` |
| 3 | Blue | `#0d75ff` |
| 4 | Khaki | `#b68400` |
| 5 | Diamine Green | `#1b8e13` |
| 6 | Orange | `#ff5200` |
| 7 | Violet | `#2619d1` |
| 8 | Indian Lake | `#cc1a97` |
| 9 | Antwarp Blue | `#008aa1` |
| 10 | Raw Sienna | `#b85e00` |
| 11 | Light Mauve | `#9161f2` |
| 12 | Buffy Citrine | `#888d2a` |
| 13 | Veronia Purple | `#7e3075` |
| 14 | Red | `#a10045` |
| 15 | Vandar Poel's Blue | `#003e83` |
| 16 | Brown | `#6c2b11` |

Every ink MUST have a contrast ratio of at least 3:1 against white (`#ffffff`), by the WCAG 2.x relative luminance formula. Every pair of inks MUST be at least 10 apart by CIEDE2000 color difference. The palette is not user-editable, and it is the same for every visitor.

#### Scenario: Contrast against white
- **WHEN** the contrast ratio of each of the 16 inks against `#ffffff` is computed
- **THEN** every ratio is at least 3:1

#### Scenario: Inks are distinct
- **WHEN** the CIEDE2000 difference of every pair of the 16 inks is computed
- **THEN** every difference is at least 10

#### Scenario: Channel 1 is unchanged
- **WHEN** a unit is on MIDI channel 1
- **THEN** it renders exactly as before this change, in black on white

### Requirement: A unit draws in its channel's ink
Everything in a chime unit that is black on channel 1 SHALL be drawn in the unit's channel ink instead, with white staying white. This covers:
- the drawing's pixels and its border
- the four round buttons, including their borders, icons and inverted (pressed, open, hover) states
- the tube notes drawer: its pads, border, strike flash and voice/scale line
- the unit's SETTINGS popover: text, dotted leaders, borders, controls, highlighted and selected options, inverted states and the focus outline
- every list opened from that popover (the selects, and the SCALE and SOUNDFONT search lists)

A unit MUST use exactly two colors, its ink and white (with reduced opacity of the ink allowed for disabled controls); while another channel is focused, a 25% tint of the ink replaces the ink (see `channel-focus`). Units on the same channel SHALL share an ink.

#### Scenario: A unit on channel 3
- **WHEN** a unit's CHANNEL is 3 and its NOTES and SETTINGS are open
- **THEN** every computed text, border, outline and inverted-background color in the unit, its drawer, its popover and any list opened from the popover is `#0d75ff` or white
- **AND** every pixel read back from its canvas is `#0d75ff` or `#ffffff`

#### Scenario: Strike flash in ink
- **WHEN** a tube on a channel 5 unit is struck while its notes drawer is shown
- **THEN** that tube's pad briefly shows white text on `#1b8e13`

#### Scenario: Two units on one channel
- **WHEN** two units are both on channel 2
- **THEN** both draw in `#d60036`

### Requirement: Ink follows the channel
A unit's ink SHALL always be its current channel's ink. When the channel changes, the unit SHALL recolor at once, with no reload:
- changing CHANNEL in its popover
- COPY, which gives the new unit the lowest free channel
- RESET, which leaves one unit on channel 1
- opening a share link or a saved composition

The ink MUST NOT be stored, linked or saved separately from the channel, and links and saved compositions MUST stay as they were.

#### Scenario: Change CHANNEL
- **WHEN** the user changes a unit's CHANNEL from 1 to 6
- **THEN** its drawing, buttons, drawer and open popover turn from black to `#ff5200` without a reload

#### Scenario: Copy gets the next channel's ink
- **WHEN** the page has one unit on channel 1 and the user activates COPY
- **THEN** the new unit is on channel 2 and draws in `#d60036`, and the original stays black

#### Scenario: Link carries the color through the channel
- **WHEN** a share link with units on channels 1, 4 and 9 is opened
- **THEN** the units draw in black, `#b68400` and `#008aa1`
- **AND** the link's bytes are the same as before this change for the same units

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
