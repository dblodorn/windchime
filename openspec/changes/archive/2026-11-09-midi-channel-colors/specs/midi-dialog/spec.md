## ADDED Requirements

### Requirement: Channel color legend
The MIDI OUT dialog SHALL end with a CHANNELS legend. It shows all 16 MIDI channels in order, in two rows of 8, each as a square swatch filled with that channel's ink (see `channel-colors`) above its channel number. Channels that one or more units are on SHALL be marked as in use. The mark MUST NOT rely on color alone: the number is underlined and the item's accessible name says it is in use. The legend SHALL be a list named "CHANNELS". Each item's accessible name SHALL give the channel number and the ink's name, followed by "IN USE" for channels in use (for example "2 CARMINE IN USE"). The legend SHALL show whether or not MIDI is connected, and it MUST update at once when a unit is added, removed or changes channel.

#### Scenario: Legend in the dialog
- **WHEN** the user opens the MIDI OUT dialog
- **THEN** a list named "CHANNELS" shows 16 items, numbered 1 to 16, each with a swatch in that channel's ink

#### Scenario: Channels in use
- **WHEN** the page has units on channels 1 and 3 and the dialog is opened
- **THEN** items 1 and 3 have underlined numbers, and their accessible names are "1 BLACK IN USE" and "3 BLUE IN USE"
- **AND** the other 14 items are not marked

#### Scenario: Before connecting
- **WHEN** MIDI has not been connected and the dialog is opened
- **THEN** the legend is shown after CONNECT MIDI and its help text

## MODIFIED Requirements

### Requirement: Dialog look
The dialog SHALL follow the page's visual language: white background, a 1px solid black border, square corners, no shadow, Knif Mono text, and its title in uppercase. The channel legend's swatches are the only color in the dialog. Behind the dialog, the page MUST stay visible as it is drawn, in each unit's ink on white, with no grey or tinted overlay. The dialog MUST fit within a 375 px wide viewport inside the page padding, and when its contents are taller than the viewport it SHALL scroll inside itself.

#### Scenario: Two colors with the dialog open
- **WHEN** the dialog is open and connected, with every control shown, and every unit is on channel 1
- **THEN** every computed color, background color, border color and outline color on the page, other than the legend's swatch fills, is black or white (or one of them at reduced opacity for disabled controls)
- **AND** the dialog's computed border radius is `0px` and its box shadow is `none`

#### Scenario: Fits a phone
- **WHEN** the dialog is open at 375 px wide and 640 px tall, connected
- **THEN** the dialog is fully inside the viewport horizontally, the page has no horizontal scroll, and every control in it, including the legend, can be reached by scrolling the dialog
