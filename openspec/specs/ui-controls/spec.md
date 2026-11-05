# ui-controls Specification

## Purpose

Defines the parameter sheet's 1-bit visual language and how its controls (buttons, selects, sliders, checkboxes) look and respond to pointer, touch and keyboard, so every control, current or future, reads as part of the same black-on-white instrument.

## Requirements

### Requirement: Two-color, monospace, square visual language
Every element of the page SHALL render using only pure black (`#000000`) and pure white (`#ffffff`) for text, backgrounds, borders, outlines and icons. All control states and popups are included. Disabled controls MAY use reduced opacity of those two colors. All text SHALL use Courier Prime, with a monospace fallback. No element SHALL have a box shadow, and no element SHALL have rounded corners except the four 30 px circular buttons on each unit's drawing: the COPY button in the top-left corner, which shows a copy-plus icon, the SOUND toggle in the top-right corner, which shows a speaker icon (on) or a muted-speaker icon (off), the SETTINGS button in the bottom-right corner, which shows a settings icon, and the NOTES toggle in the bottom-left corner, which shows an eighth-note icon. The page SHALL use a light color scheme only, regardless of the operating system's dark-mode setting.

#### Scenario: Computed styles stay within the palette
- **WHEN** the page is rendered and every control is shown in its resting, hover, pressed, focused, open and disabled states
- **THEN** every computed `color`, `background-color`, `border-color` and `outline-color` is black or white (or one of them at reduced opacity for disabled)
- **AND** every computed `border-radius` is `0px` except on the COPY, SOUND, SETTINGS and NOTES buttons, and every `box-shadow` is `none`

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
ROOT, SCALE, SOUNDFONT, MIDI OUT, CHANNEL and MIDI MODE SHALL be single-choice selects. MIDI MODE offers two options, POLY and MONO, and starts at POLY. Each shows its current choice in a full-width, square, 1px black-bordered field. When open, each SHALL show a black-bordered list of options with the highlighted option inverted. Selects with groups (SCALE groups, SOUNDFONT voice groups) SHALL show group headings. Disabled options (for example a disconnected remembered MIDI port) MUST be shown but not be choosable. A select SHALL open by click, tap, Enter, Space or Arrow Down. It SHALL move with the arrow keys, jump by typing the start of an option, choose with Enter, and close without changing on Escape. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the screen.

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

#### Scenario: MIDI mode options
- **WHEN** the MIDI MODE select is opened
- **THEN** it lists POLY and MONO, with POLY marked on a first visit

### Requirement: Sliders
VOLUME (0–1, step 0.01), TUBES (2–8, step 1), WIND (0–1, step 0.01), DECAY (0.3–12 s, step 0.1), FREQUENCY (0–1, step 0.001) and RESONANCE (Q 0.5–18, step 0.1) SHALL be horizontal sliders with these exact ranges and steps. Each has a 1px black track and a solid black rectangular thumb about 9×17 px, and the whole row width is a pointer and touch target. Each slider SHALL change its value by dragging or tapping the track. It SHALL respond to Arrow Left/Down and Arrow Right/Up by one step, Page Up/Page Down by a larger step, and Home/End to the minimum and maximum. Changes MUST reach the simulation and audio as they happen, not only on release. VOLUME starts at 1.00, the browser sound's level before this change, and scales only that unit's browser sound: 0 is silent, and MIDI output is unaffected.

TUBES SHALL be a stepped slider: it only ever holds a whole number of tubes, its thumb snaps to one of seven evenly spaced positions while being dragged, and a tick mark is drawn under the track at each position, as single-pixel black lines. Its row value is the tube count as a plain number (for example `6`). It starts at 6.

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

#### Scenario: Volume
- **WHEN** a unit with SOUND on has VOLUME lowered from 1.00 to 0.25 while notes ring
- **THEN** its browser sound gets quieter during the drag, and the row shows `0.25`
- **AND** the MIDI velocities it sends are unchanged

#### Scenario: Tubes steps
- **WHEN** the TUBES slider has focus at 6 and the user presses Arrow Right, then End, then Home
- **THEN** the count becomes 7, then 8, then 2, the row shows each number, and the drawing shows that many tubes after each key

#### Scenario: Tubes snaps while dragging
- **WHEN** the user drags the TUBES thumb slowly from one end of the track to the other
- **THEN** the thumb jumps between the seven tick positions, never resting between them, and the count passes through every value from 2 to 8

#### Scenario: Tick marks
- **WHEN** the TUBES row is rendered
- **THEN** seven single-pixel black tick marks are drawn under its track, one at each position, and nothing in the row is a color other than black or white

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
Each unit's parameter rows (VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, CHANNEL, MIDI MODE) SHALL live in a popover opened by that unit's SETTINGS button, a 30 px circular button in the bottom-right corner of its drawing that shows a settings icon. TUBES SHALL be the row directly above WIND, and MIDI MODE the row directly below CHANNEL. While more than one unit exists, the popover SHALL end with a REMOVE button. The popover SHALL be a square white panel with a 1px black border, anchored to the button and kept within the viewport, and it SHALL scroll when it is taller than the space available. The page behind it MUST stay live: every chime keeps animating and sounding. The SETTINGS button SHALL render inverted and report itself expanded while the popover is open. Escape, a tap outside the popover or activating SETTINGS again SHALL close it. Closing MUST NOT change any parameter. Only one settings popover is open at a time.

#### Scenario: Opening the popover
- **WHEN** the user activates SETTINGS on a unit
- **THEN** a panel opens holding that unit's eleven parameter rows, starting with VOLUME, then TUBES, then WIND, and ending with CHANNEL, then MIDI MODE, and its SETTINGS button renders inverted with an expanded state

#### Scenario: Choosing inside the popover
- **WHEN** the user picks a SCALE option from the select inside the popover
- **THEN** that unit's scale changes and the popover stays open

#### Scenario: Closing keeps values
- **WHEN** the user sets WIND to 0.20 and TUBES to 4, presses Escape, and opens SETTINGS again
- **THEN** focus returned to SETTINGS on close, the WIND row reads 0.20 and the TUBES row reads 4

#### Scenario: One popover at a time
- **WHEN** CHIME 1's settings are open and the user activates SETTINGS on CHIME 2
- **THEN** CHIME 1's popover closes and CHIME 2's opens

### Requirement: Tube notes drawer
Each unit's tube readout, one cell per tube, SHALL be hidden on a first visit and SHALL keep its shown or hidden state per unit across visits. Each cell is a note pad showing its tube's note name and frequency, with no tube-number label, and SHALL strike that tube of that unit (sound, MIDI and the cell's flash, exactly as tapping the tube in the drawing) when pressed with a pointer or activated with Enter or Space. A pad SHALL invert on hover. When the unit's tube count changes, the readout SHALL gain or lose pads to match at once. The unit's NOTES toggle, a 30 px circular button in the bottom-left corner of its drawing that shows an eighth-note icon, SHALL show and hide it. When shown, the readout SHALL appear at once, without animation, flush against the drawing's bottom border, the same width as the drawing, sharing that border. While hidden it MUST NOT be reachable by keyboard or exposed to assistive technology.

#### Scenario: Hidden on load
- **WHEN** the page loads with nothing saved
- **THEN** the tube readout is not visible, and NOTES is not pressed

#### Scenario: Showing the readout
- **WHEN** the user turns NOTES on
- **THEN** NOTES renders inverted and pressed, and the readout appears directly under that unit's drawing, its top edge on the drawing's bottom border

#### Scenario: Striking from a pad
- **WHEN** the readout is shown and the user presses the third pad
- **THEN** that unit's third tube is struck once: its note-on goes to the selected MIDI port on the unit's channel and the pad flashes inverted

#### Scenario: Hiding the readout
- **WHEN** the user turns NOTES off again
- **THEN** the readout is hidden

#### Scenario: Remembered per unit
- **WHEN** CHIME 2 has NOTES on, CHIME 1 has it off, and the page is reloaded
- **THEN** CHIME 2's readout is shown and CHIME 1's is hidden

#### Scenario: Pads follow the count
- **WHEN** the readout is shown and TUBES is changed from 6 to 8, then to 2
- **THEN** the readout shows 8 pads, then 2, each with its tube's note, and stays the drawing's width

### Requirement: Centered, draggable unit
Each unit's drawing, four round buttons and tube notes drawer SHALL form one unit. On a first visit the single unit SHALL be shown centered in the viewport. The user SHALL be able to drag a unit by pressing on its drawing away from every tube and moving the pointer or finger; pressing near a tube still strikes it and never starts a drag. A unit MUST stay fully inside the viewport while dragged and when the window is resized. Units MAY overlap. Each unit's last position SHALL be remembered across visits and pulled back inside the viewport if the window is now smaller.

#### Scenario: Centered on first visit
- **WHEN** the page loads with nothing saved
- **THEN** the one unit is centered horizontally and vertically in the viewport

#### Scenario: Dragging from empty paper
- **WHEN** the user presses the top-left area of a unit's drawing, away from every tube and the COPY button, and moves 100 px right and 50 px down
- **THEN** that unit moves 100 px right and 50 px down, no other unit moves, and no tube is struck

#### Scenario: Kept on screen
- **WHEN** the user drags a unit far past the viewport's edge
- **THEN** it stops with its edge inside the viewport

#### Scenario: Remembered
- **WHEN** the user drags two units to different places and reloads the page
- **THEN** each unit appears where it was left

### Requirement: Accessible names and roles
Every control SHALL have an accessible name equal to its visible label (for example "WIND", "TUBES", "MIDI MODE", "MIDI OUT", "SEND PROGRAM CHANGE", "TEST NOTE"), and the correct role (button, combobox, slider, checkbox). Sliders SHALL expose their current, minimum and maximum values. Each unit SHALL be a labelled region named after its number (CHIME 1, CHIME 2, …), holding its drawing, round buttons and notes drawer, and its settings popover SHALL be named SETTINGS followed by the unit's name (for example "SETTINGS CHIME 2"), so a unit's controls can be told apart by where they are. The visible labels, button texts and states named by the `midi-output` capability MUST remain the same.

#### Scenario: Roles and names
- **WHEN** the page's accessibility tree is inspected with one unit
- **THEN** there is a region named CHIME 1 holding buttons named COPY, SOUND, SETTINGS and NOTES, and with its settings popover open there is a slider named TUBES with min 2, max 8 and value 6, a slider named WIND with min 0, max 1 and value 0.45, comboboxes named ROOT, SCALE, SOUNDFONT, CHANNEL and MIDI MODE, and, in the MIDI dialog, a MIDI OUT combobox (after connect) and checkboxes named for each MIDI option

#### Scenario: Units told apart
- **WHEN** two units exist
- **THEN** there are regions named CHIME 1 and CHIME 2, each holding exactly one button named COPY, SOUND, SETTINGS and NOTES

#### Scenario: MIDI controls unchanged
- **WHEN** the MIDI behavior checks from the `midi-output` capability are run using controls by role and name
- **THEN** they all pass

### Requirement: Server render matches the client
The page SHALL prerender every control in its initial state so that hydration produces no mismatch warnings. The controls MUST be operable as soon as the page is interactive, without a visible jump in layout.

#### Scenario: No hydration warnings
- **WHEN** the production page loads in Chromium
- **THEN** the console shows no hydration or React errors
- **AND** each select shows its initial value and each slider its initial position before any interaction
