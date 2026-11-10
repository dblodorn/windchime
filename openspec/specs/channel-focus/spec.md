# channel-focus Specification

## Purpose
Shows which MIDI channels the chime units are using, in a strip of ink squares in the lower left, and lets the user focus one channel so units on the other channels fade back.

## Requirements

### Requirement: Active-channels strip
While the units on the page use two or more distinct MIDI channels, the page SHALL show an active-channels strip fixed to its lower-left corner, 16 CSS px from the left and bottom edges (plus the safe-area inset), above every unit. The strip SHALL hold one square button per channel in use, in ascending channel order. Each square SHALL be 22 × 22 CSS px, filled with that channel's ink (see `channel-colors`), with no gap between squares, and SHALL show the channel number in white, centered horizontally and vertically, in the UI font at a size whose widest number (`16`) fits inside the square. The squares SHALL fill a grid 2 squares tall and up to 8 squares wide (at most 176 × 44 CSS px; the height of the lower-right buttons), column by column: the first square at the top left, the second under it, the third at the top of the second column, and so on. The strip is always 44 CSS px tall and as wide as its columns. While only one channel is in use, the strip MUST NOT be shown.

The strip SHALL be a group named "ACTIVE CHANNELS". Each square SHALL be a button named by its channel number and ink name (for example "3 BLUE"), and SHALL expose whether its channel is focused as a pressed state. Squares SHALL activate with a click, a tap, Enter or Space, and SHALL show the dashed keyboard focus outline. They do not invert on hover.

#### Scenario: Hidden with one channel
- **WHEN** the page has three units, all on channel 1
- **THEN** no ACTIVE CHANNELS group is shown

#### Scenario: Shown with two channels
- **WHEN** the page has units on channels 1, 1 and 4
- **THEN** the ACTIVE CHANNELS group holds two buttons, "1 BLACK" then "4 KHAKI"
- **AND** they are 22 px squares filled with `#000000` and `#b68400`, showing `1` and `4` in white, centered

#### Scenario: Appears when a unit changes channel
- **WHEN** the page has one unit on channel 1 and the user activates COPY
- **THEN** the strip appears with squares 1 and 2

#### Scenario: Packs down the columns
- **WHEN** the page has units on channels 1, 2, 3, 5 and 9
- **THEN** squares 1 and 2 are the first column (1 on top), 3 and 5 the second, and 9 is at the top of the third column
- **AND** the strip is 44 px tall and 66 px wide

#### Scenario: Strip height
- **WHEN** the strip is shown on a wide viewport
- **THEN** its bottom edge lines up with the bottom edge of the SHARE button, and it is no taller than the SHARE button

### Requirement: Strip placement on narrow viewports
On viewports narrower than 640 CSS px, the strip SHALL stand upright: a grid 2 squares wide (44 CSS px) and up to 8 squares tall, filled left to right and upward from its lower-left corner (the first square at the bottom left, the second at the bottom right, the third above the first, and so on), as tall as its rows. It stays in the lower-left corner, its bottom edge level with the bottom edge of the lower-right buttons. While the strip is shown there, the lower-right buttons SHALL narrow (each at most 76 CSS px, all still equal) so the row ends at least 8 CSS px right of the strip, and every button label SHALL still fit. The strip MUST NOT overlap the lower-right buttons at any viewport width from 320 CSS px up.

#### Scenario: Phone width
- **WHEN** the viewport is 375 px wide and units use channels 1, 2, 3, 5 and 9
- **THEN** the strip is 44 px wide and 66 px tall, with 1 and 2 on the bottom row, 3 and 5 above them, and 9 at the top left
- **AND** its bottom edge is level with the SHARE button's bottom edge, and it does not overlap any of the lower-right buttons

#### Scenario: Narrowest width
- **WHEN** the viewport is 320 px wide, the device has a mouse, and units use two channels
- **THEN** the SHARE, RESET, AUDIO and MIDI buttons are equal in width, start at least 8 px right of the strip, and show their labels without clipping

#### Scenario: Desktop width
- **WHEN** the viewport is 1280 px wide and units use 3 channels
- **THEN** the strip sits in the lower-left corner, 2 squares tall and packed down the columns, its bottom edge level with the SHARE button's bottom edge

### Requirement: Channel focus mode
Activating a square SHALL focus its channel: every unit on another channel SHALL be shown at 25% opacity, and every unit on the focused channel SHALL stay fully opaque. The focused channel's square SHALL show as pressed (exposed as pressed, and drawn with a 1 px white frame inset 2 px inside the square). At most one channel SHALL be focused at a time:
- activating the focused channel's square ends focus mode
- activating another channel's square moves focus to that channel

Faded units SHALL stay fully usable. Focus mode SHALL change only opacity: it MUST NOT change any unit's sound, MIDI output, parameters, position or stacking order.

#### Scenario: Focus a channel
- **WHEN** the page has units on channels 1, 2 and 2 and the user activates square 2
- **THEN** the channel 1 unit's computed opacity is 0.25 and both channel 2 units' computed opacity is 1
- **AND** square 2 is pressed and square 1 is not

#### Scenario: Toggle off
- **WHEN** channel 2 is focused and the user activates square 2 again
- **THEN** every unit's opacity is 1 and no square is pressed

#### Scenario: Switch channels
- **WHEN** channel 2 is focused and the user activates square 1
- **THEN** the channel 1 unit is fully opaque, both channel 2 units are at 0.25, and only square 1 is pressed

#### Scenario: Faded units keep playing
- **WHEN** a faded unit's SOUND is on and the wind strikes its tubes
- **THEN** it plays and sends MIDI exactly as when it isn't faded

### Requirement: Leaving focus mode
Pressing on a faded unit (on its drawing, its round buttons, its notes drawer or anything inside it) SHALL end focus mode, so every unit is fully opaque again. The press SHALL also do what it does outside focus mode: bring the unit to the front, and strike, drag or activate the control under it. Pressing on a unit of the focused channel, or on empty page, SHALL NOT end focus mode. Focus mode SHALL also end when the focused channel is no longer used by any unit, or when the strip hides because fewer than two channels are in use (after a unit is removed or changes channel, after RESET, or after a share link or saved composition is opened).

#### Scenario: Press a faded unit
- **WHEN** channel 2 is focused and the user presses empty paper on the faded channel 1 unit
- **THEN** every unit is fully opaque, no square is pressed, and the channel 1 unit is in front

#### Scenario: Strike through the fade
- **WHEN** channel 2 is focused and the user taps a tube on the faded channel 1 unit
- **THEN** that tube strikes and focus mode ends

#### Scenario: Press a focused unit
- **WHEN** channel 2 is focused and the user presses one of the channel 2 units
- **THEN** focus mode stays on

#### Scenario: Focused channel goes away
- **WHEN** channel 3 is focused, units use channels 1, 2 and 3, and the only channel 3 unit is removed
- **THEN** focus mode ends and the strip shows squares 1 and 2, neither pressed

#### Scenario: Reset
- **WHEN** a channel is focused and the user activates RESET
- **THEN** the strip hides and the one remaining unit is fully opaque

### Requirement: Focus is not stored
The focused channel MUST NOT be saved in browser storage, share links or saved compositions. Every page load SHALL start with no channel focused.

#### Scenario: Reload clears focus
- **WHEN** channel 2 is focused and the page is reloaded
- **THEN** every unit is fully opaque and no square is pressed

#### Scenario: Link unchanged
- **WHEN** SHARE is activated with and without a channel focused, for the same units
- **THEN** the two links are identical
