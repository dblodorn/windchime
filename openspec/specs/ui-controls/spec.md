# ui-controls Specification

## Purpose

Defines the parameter sheet's 1-bit visual language and how its controls (buttons, selects, sliders, checkboxes) look and respond to pointer, touch and keyboard, so every control, current or future, reads as part of the same black-on-white instrument.

## Requirements

### Requirement: Two-color, monospace, square visual language
Every element of the page SHALL render using only pure black (`#000000`) and pure white (`#ffffff`) for text, backgrounds, borders, outlines and icons. All control states and popups are included. Disabled controls MAY use reduced opacity of those two colors. All text SHALL use Courier Prime, with a monospace fallback. No element SHALL have a box shadow, and no element SHALL have rounded corners except the three 30 px circular buttons on the drawing: the SOUND toggle in the top-right corner, which shows a speaker icon (on) or a muted-speaker icon (off), the SETTINGS button in the bottom-right corner, which shows a settings icon, and the NOTES toggle in the bottom-left corner, which shows an eighth-note icon. The page SHALL use a light color scheme only, regardless of the operating system's dark-mode setting.

#### Scenario: Computed styles stay within the palette
- **WHEN** the page is rendered and every control is shown in its resting, hover, pressed, focused, open and disabled states
- **THEN** every computed `color`, `background-color`, `border-color` and `outline-color` is black or white (or one of them at reduced opacity for disabled)
- **AND** every computed `border-radius` is `0px` except on the SOUND, SETTINGS and NOTES buttons, and every `box-shadow` is `none`

#### Scenario: Font
- **WHEN** any label, value, option or button text is rendered
- **THEN** its computed font family starts with the Courier Prime face loaded by the page

#### Scenario: Dark mode preference ignored
- **WHEN** the operating system prefers a dark color scheme
- **THEN** the page still renders black on white

### Requirement: Parameter rows
Each parameter SHALL be shown as a row with its uppercase label on the left, a dotted leader filling the space, and its current value on the right (`LABEL ....... value`), with the control beneath. The value text MUST update as the control changes.

#### Scenario: Row layout
- **WHEN** the WIND row is rendered
- **THEN** it shows `WIND`, a dotted black leader, and the current wind value to two decimals on one line, with the slider beneath

#### Scenario: Live value
- **WHEN** the user moves the DECAY slider
- **THEN** the row's value text updates on every change (for example `4.0 S` → `4.1 S`)

### Requirement: Buttons
Buttons SHALL have a 1px black border on white, with uppercase monospace text. On hover, and while a toggle button is pressed (SOUND), a button SHALL show inverted colors (white text on black). A disabled button MUST look dimmed, MUST NOT invert on hover and MUST NOT respond to activation. Buttons SHALL activate with a pointer click, a touch tap, Enter or Space.

#### Scenario: Toggle pressed state
- **WHEN** the user turns SOUND on
- **THEN** the round SOUND button over the drawing shows the speaker-on icon, renders inverted, and exposes a pressed state to assistive technology

#### Scenario: Disabled button
- **WHEN** TEST NOTE is disabled because no MIDI port is selected
- **THEN** it renders dimmed, does not invert on hover, and does nothing on click or key press

#### Scenario: Audio starts inside the tap
- **WHEN** the user taps SOUND on iOS Safari
- **THEN** audio starts from that tap, as before this change

### Requirement: Selects
ROOT, SCALE, SOUNDFONT, MIDI OUT and CHANNEL SHALL be single-choice selects. Each shows its current choice in a full-width, square, 1px black-bordered field. When open, each SHALL show a black-bordered list of options with the highlighted option inverted. Selects with groups (SCALE groups, SOUNDFONT voice groups) SHALL show group headings. Disabled options (for example a disconnected remembered MIDI port) MUST be shown but not be choosable. A select SHALL open by click, tap, Enter, Space or Arrow Down. It SHALL move with the arrow keys, jump by typing the start of an option, choose with Enter, and close without changing on Escape. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the screen.

#### Scenario: Choose by keyboard
- **WHEN** ROOT has focus and the user presses Enter, Arrow Down twice, then Enter
- **THEN** the root becomes the note two steps after the previous one, and the row's value shows its name

#### Scenario: Escape keeps the value
- **WHEN** a select is open and the user presses Escape
- **THEN** it closes and the value is unchanged

#### Scenario: Groups shown
- **WHEN** the SOUNDFONT select is opened after the General MIDI font loads
- **THEN** voices appear under their group headings, and the current voice is marked

#### Scenario: Disabled option
- **WHEN** MIDI OUT is open while the remembered port is disconnected
- **THEN** the remembered port appears marked DISCONNECTED and cannot be chosen

#### Scenario: Long list on a phone
- **WHEN** CHANNEL or SOUNDFONT is opened on a 375 px wide viewport
- **THEN** the list fits the viewport width and can be scrolled to every option

### Requirement: Sliders
WIND (0–1, step 0.01), DECAY (0.3–12 s, step 0.1), FREQUENCY (0–1, step 0.001) and RESONANCE (Q 0.5–18, step 0.1) SHALL be horizontal sliders with these exact ranges and steps. Each has a 1px black track and a solid black rectangular thumb about 9×17 px, and the whole row width is a pointer and touch target. Each slider SHALL change its value by dragging or tapping the track. It SHALL respond to Arrow Left/Down and Arrow Right/Up by one step, Page Up/Page Down by a larger step, and Home/End to the minimum and maximum. Changes MUST reach the simulation and audio as they happen, not only on release.

#### Scenario: Keyboard step
- **WHEN** the WIND slider has focus at 0.45 and the user presses Arrow Right
- **THEN** wind becomes 0.46 and the row shows `0.46`

#### Scenario: Home and End
- **WHEN** the DECAY slider has focus and the user presses Home, then End
- **THEN** decay becomes 0.3 s, then 12.0 s

#### Scenario: Live filter while dragging
- **WHEN** the user drags FREQUENCY with sound on
- **THEN** the low-pass cutoff follows during the drag
- **AND** CC74 is sent during the drag when filter CCs are on

#### Scenario: Touch drag
- **WHEN** the user drags a slider thumb on a touch screen
- **THEN** the value follows the finger, and the page does not scroll horizontally

### Requirement: Checkboxes
The MIDI options (SEND PROGRAM CHANGE, SEND FILTER AS CC74 / CC71, PLAY SOUND IN BROWSER TOO) SHALL be checkboxes drawn as a 14 px square with a 1px black border. The checked state is shown as a solid black inner square inset from the border. Each SHALL toggle by clicking or tapping the box or its label text, or by pressing Space when focused.

#### Scenario: Toggle by label
- **WHEN** the user clicks the text SEND PROGRAM CHANGE
- **THEN** the option toggles and the box shows the new state

#### Scenario: Toggle by keyboard
- **WHEN** a MIDI option has focus and the user presses Space
- **THEN** it toggles

### Requirement: Focus visibility
Every interactive control SHALL show a visible focus indicator when focused by keyboard: a 1px dashed black outline offset from the control. Pointer clicks alone MUST NOT leave the outline showing.

#### Scenario: Tab through the sheet
- **WHEN** the user tabs through the parameter sheet
- **THEN** each button, select, slider and checkbox in turn shows a 1px dashed black outline

### Requirement: Parameter popover
The parameter rows (WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT) SHALL live in a popover opened by the SETTINGS button, a 30 px circular button in the bottom-right corner of the drawing that shows a settings icon. The popover SHALL be a square white panel with a 1px black border, anchored to the button and kept within the viewport, and it SHALL scroll when it is taller than the space available. The page behind it MUST stay live: the chime keeps animating and sounding. The SETTINGS button SHALL render inverted and report itself expanded while the popover is open. Escape, a tap outside the popover or activating SETTINGS again SHALL close it. Closing MUST NOT change any parameter.

#### Scenario: Opening the popover
- **WHEN** the user activates SETTINGS
- **THEN** a panel opens holding the seven parameter rows, and the SETTINGS button renders inverted with an expanded state

#### Scenario: Choosing inside the popover
- **WHEN** the user picks a SCALE option from the select inside the popover
- **THEN** the scale changes and the popover stays open

#### Scenario: Closing keeps values
- **WHEN** the user sets WIND to 0.20, presses Escape, and opens SETTINGS again
- **THEN** focus returned to SETTINGS on close, and the WIND row reads 0.20

### Requirement: Tube notes drawer
The six-cell tube readout (each tube's number, note name and frequency) SHALL be hidden when the page loads. The NOTES toggle, a 30 px circular button in the bottom-left corner of the drawing that shows an eighth-note icon, SHALL show and hide it. When shown, the readout SHALL slide down from under the drawing and sit flush against the drawing's bottom border, the same width as the drawing, sharing that border. While hidden it MUST NOT be reachable by keyboard or exposed to assistive technology. Users who prefer reduced motion SHALL see it appear without the slide.

#### Scenario: Hidden on load
- **WHEN** the page loads
- **THEN** the tube readout is not visible, and NOTES is not pressed

#### Scenario: Showing the readout
- **WHEN** the user turns NOTES on
- **THEN** NOTES renders inverted and pressed, and the readout slides into view directly under the drawing, its top edge on the drawing's bottom border

#### Scenario: Hiding the readout
- **WHEN** the user turns NOTES off again
- **THEN** the readout slides back under the drawing and is hidden

### Requirement: Accessible names and roles
Every control SHALL have an accessible name equal to its visible label (for example "WIND", "MIDI OUT", "SEND PROGRAM CHANGE", "TEST NOTE"), and the correct role (button, combobox, slider, checkbox). Sliders SHALL expose their current, minimum and maximum values. The visible labels, button texts and states named by the `midi-output` capability MUST remain the same.

#### Scenario: Roles and names
- **WHEN** the page's accessibility tree is inspected
- **THEN** there are buttons named SOUND, SETTINGS and NOTES, and with the settings popover open there is a slider named WIND with min 0, max 1 and value 0.45, comboboxes named ROOT, SCALE, SOUNDFONT, MIDI OUT (after connect) and CHANNEL, and checkboxes named for each MIDI option

#### Scenario: MIDI controls unchanged
- **WHEN** the MIDI behavior checks from the `midi-output` capability are run using controls by role and name
- **THEN** they all pass

### Requirement: Server render matches the client
The page SHALL prerender every control in its initial state so that hydration produces no mismatch warnings. The controls MUST be operable as soon as the page is interactive, without a visible jump in layout.

#### Scenario: No hydration warnings
- **WHEN** the production page loads in Chromium
- **THEN** the console shows no hydration or React errors
- **AND** each select shows its initial value and each slider its initial position before any interaction
