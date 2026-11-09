## MODIFIED Requirements

### Requirement: Two-color, monospace, square visual language
Every element of the page SHALL render with white (`#ffffff`) and one ink color for text, backgrounds, borders, outlines and icons. All control states and popups are included. The ink is pure black (`#000000`) everywhere except inside a chime unit, where it is the unit's channel ink (see `channel-colors`): the unit's drawing, round buttons, notes drawer, settings popover and the lists opened from that popover. Channel 1's ink is black. The one other exception is the channel legend's swatches in the MIDI OUT dialog, which show each channel's ink. Disabled controls MAY use reduced opacity of their ink or white. All text SHALL use Courier Prime, with a monospace fallback. No element SHALL have a box shadow, and no element SHALL have rounded corners except the four 30 px circular buttons on each unit's drawing:
- the COPY button in the top-left corner, which shows a copy-plus icon
- the SOUND toggle in the top-right corner, which shows a speaker icon (on) or a muted-speaker icon (off)
- the SETTINGS button in the bottom-right corner, which shows a settings icon
- the NOTES toggle in the bottom-left corner, which shows an eighth-note icon

The page SHALL use a light color scheme only, regardless of the operating system's dark-mode setting.

#### Scenario: Computed styles stay within the palette
- **WHEN** the page is rendered with every unit on channel 1, and every control is shown in its resting, hover, pressed, focused, open and disabled states
- **THEN** every computed `color`, `background-color`, `border-color` and `outline-color` is black or white (or one of them at reduced opacity for disabled)
- **AND** every computed `border-radius` is `0px` except on the COPY, SOUND, SETTINGS and NOTES buttons, and every `box-shadow` is `none`

#### Scenario: A unit's controls use its ink
- **WHEN** a unit is on channel 7 and its settings popover is open, with a select in it open
- **THEN** every computed color in the popover and the open list is `#2619d1` or white (or one of them at reduced opacity for disabled)
- **AND** the controls outside the unit are black or white

#### Scenario: Font
- **WHEN** any label, value, option or button text is rendered
- **THEN** its computed font family starts with the Courier Prime face loaded by the page

#### Scenario: Dark mode preference ignored
- **WHEN** the operating system prefers a dark color scheme
- **THEN** the page still renders its inks on white
