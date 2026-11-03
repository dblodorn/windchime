# Spec Delta

## MODIFIED Requirements

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

### Requirement: Sliders
VOLUME (0–1, step 0.01), WIND (0–1, step 0.01), DECAY (0.3–12 s, step 0.1), FREQUENCY (0–1, step 0.001) and RESONANCE (Q 0.5–18, step 0.1) SHALL be horizontal sliders with these exact ranges and steps. Each has a 1px black track and a solid black rectangular thumb about 9×17 px, and the whole row width is a pointer and touch target. Each slider SHALL change its value by dragging or tapping the track. It SHALL respond to Arrow Left/Down and Arrow Right/Up by one step, Page Up/Page Down by a larger step, and Home/End to the minimum and maximum. Changes MUST reach the simulation and audio as they happen, not only on release. VOLUME starts at 1.00, the browser sound's level before this change, and scales only that unit's browser sound: 0 is silent, and MIDI output is unaffected.

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

### Requirement: Parameter popover
Each unit's parameter rows (VOLUME, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, CHANNEL) SHALL live in a popover opened by that unit's SETTINGS button, a 30 px circular button in the bottom-right corner of its drawing that shows a settings icon. While more than one unit exists, the popover SHALL end with a REMOVE button. The popover SHALL be a square white panel with a 1px black border, anchored to the button and kept within the viewport, and it SHALL scroll when it is taller than the space available. The page behind it MUST stay live: every chime keeps animating and sounding. The SETTINGS button SHALL render inverted and report itself expanded while the popover is open. Escape, a tap outside the popover or activating SETTINGS again SHALL close it. Closing MUST NOT change any parameter. Only one settings popover is open at a time.

#### Scenario: Opening the popover
- **WHEN** the user activates SETTINGS on a unit
- **THEN** a panel opens holding that unit's nine parameter rows, starting with VOLUME, and its SETTINGS button renders inverted with an expanded state

#### Scenario: Choosing inside the popover
- **WHEN** the user picks a SCALE option from the select inside the popover
- **THEN** that unit's scale changes and the popover stays open

#### Scenario: Closing keeps values
- **WHEN** the user sets WIND to 0.20, presses Escape, and opens SETTINGS again
- **THEN** focus returned to SETTINGS on close, and the WIND row reads 0.20

#### Scenario: One popover at a time
- **WHEN** CHIME 1's settings are open and the user activates SETTINGS on CHIME 2
- **THEN** CHIME 1's popover closes and CHIME 2's opens

### Requirement: Tube notes drawer
Each unit's six-cell tube readout SHALL be hidden on a first visit and SHALL keep its shown or hidden state per unit across visits. Each cell is a note pad showing its tube's note name and frequency, with no tube-number label, and SHALL strike that tube of that unit (sound, MIDI and the cell's flash, exactly as tapping the tube in the drawing) when pressed with a pointer or activated with Enter or Space. A pad SHALL invert on hover. The unit's NOTES toggle, a 30 px circular button in the bottom-left corner of its drawing that shows an eighth-note icon, SHALL show and hide it. When shown, the readout SHALL appear at once, without animation, flush against the drawing's bottom border, the same width as the drawing, sharing that border. While hidden it MUST NOT be reachable by keyboard or exposed to assistive technology.

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
Every control SHALL have an accessible name equal to its visible label (for example "WIND", "MIDI OUT", "SEND PROGRAM CHANGE", "TEST NOTE"), and the correct role (button, combobox, slider, checkbox). Sliders SHALL expose their current, minimum and maximum values. Each unit SHALL be a labelled region named after its number (CHIME 1, CHIME 2, …), holding its drawing, round buttons and notes drawer, and its settings popover SHALL be named SETTINGS followed by the unit's name (for example "SETTINGS CHIME 2"), so a unit's controls can be told apart by where they are. The visible labels, button texts and states named by the `midi-output` capability MUST remain the same.

#### Scenario: Roles and names
- **WHEN** the page's accessibility tree is inspected with one unit
- **THEN** there is a region named CHIME 1 holding buttons named COPY, SOUND, SETTINGS and NOTES, and with its settings popover open there is a slider named WIND with min 0, max 1 and value 0.45, comboboxes named ROOT, SCALE, SOUNDFONT and CHANNEL, and, in the MIDI dialog, a MIDI OUT combobox (after connect) and checkboxes named for each MIDI option

#### Scenario: Units told apart
- **WHEN** two units exist
- **THEN** there are regions named CHIME 1 and CHIME 2, each holding exactly one button named COPY, SOUND, SETTINGS and NOTES

#### Scenario: MIDI controls unchanged
- **WHEN** the MIDI behavior checks from the `midi-output` capability are run using controls by role and name
- **THEN** they all pass
