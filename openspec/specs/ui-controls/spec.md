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
INSTRUMENT, ROOT, SCALE, SOUNDFONT, OUTPUT, MIDI OUT, CHANNEL, MIDI MODE and the AUDIO OUT dialog's DEVICE SHALL be single-choice selects. SCALE and SOUNDFONT are searchable selects: the rules below apply to them unless the **Searchable selects** requirement says otherwise. INSTRUMENT offers two options, TUBE CHIME and FURIN BELL, and starts at TUBE CHIME. MIDI MODE offers two options, POLY and MONO, and starts at POLY. ROOT offers the twelve note names C, C#, D, D#, E, F, F#, G, G#, A, A# and B, in that order, with no octave number and no frequency, and starts at C; its row value is the full root note, the note with its octave (for example `C5`). Each select shows its current choice in a full-width, square, 1px black-bordered field. When open, each SHALL show a black-bordered list of options with the highlighted option inverted. Selects with groups (SCALE groups, SOUNDFONT voice groups) SHALL show group headings. Disabled options MUST be shown but not be choosable, for example a disconnected remembered MIDI port or audio device, or an OUTPUT the current device does not have. A select SHALL open by click, tap, Enter, Space or Arrow Down. It SHALL move with the arrow keys, choose with Enter, and close without changing on Escape. The selects other than SCALE and SOUNDFONT SHALL also jump to an option when the user types the start of its text. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the screen.

#### Scenario: Choose by keyboard
- **WHEN** ROOT is C5, ROOT has focus, and the user presses Enter, Arrow Down twice, then Enter
- **THEN** the root becomes D5, and the row's value shows `D5`

#### Scenario: Root options
- **WHEN** the ROOT select is opened
- **THEN** it lists exactly the twelve note names from C to B, each without an octave number or a frequency, with the current note marked

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
- **WHEN** CHANNEL, SOUNDFONT or OUTPUT (with an 18-channel device) is opened on a 375 px wide viewport
- **THEN** the list fits the viewport width and can be scrolled to every option

#### Scenario: MIDI mode options
- **WHEN** the MIDI MODE select is opened
- **THEN** it lists POLY and MONO, with POLY marked on a first visit

#### Scenario: Instrument options
- **WHEN** the INSTRUMENT select is opened on a first visit
- **THEN** it lists TUBE CHIME and FURIN BELL, with TUBE CHIME marked

### Requirement: Sliders
VOLUME (0–1, step 0.01), TUBES (2–8, step 1), WIND (0–1, step 0.01), DECAY (0.3–12 s, step 0.1), FREQUENCY (0–1, step 0.001), RESONANCE (Q 0.5–18, step 0.1) and OCTAVE (−1–8, step 1) SHALL be horizontal sliders with these exact ranges and steps. Each has a 1px black track and a solid black rectangular thumb about 9×17 px, and the whole row width is a pointer and touch target. Each slider SHALL change its value by dragging or tapping the track. It SHALL respond to Arrow Left/Down and Arrow Right/Up by one step, Page Up/Page Down by a larger step, and Home/End to the minimum and maximum. Changes MUST reach the simulation and audio as they happen, not only on release. VOLUME starts at 1.00, the browser sound's level before this change, and scales only that unit's browser sound: 0 is silent, and MIDI output is unaffected.

TUBES SHALL be a stepped slider: it only ever holds a whole number of tubes, its thumb snaps to one of seven evenly spaced positions while being dragged, and a tick mark is drawn under the track at each position, as single-pixel black lines. Its row value is the tube count as a plain number (for example `6`). It starts at 6.

OCTAVE SHALL be a stepped slider in the same way, with ten positions and ten tick marks, one for each octave from −1 to 8. Its row value is the octave as a plain number (for example `5`, or `-1`). It starts at 5. Together with ROOT it sets the unit's root note: the note ROOT names, in the octave OCTAVE names, where octave 4 holds middle C (MIDI note 60). Changing OCTAVE MUST keep the ROOT note, and changing ROOT MUST keep the OCTAVE.

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

#### Scenario: Octave steps
- **WHEN** ROOT is A and OCTAVE has focus at 5, and the user presses Arrow Left, then Home, then End
- **THEN** the root becomes A4, then A-1, then A8, the OCTAVE row shows `4`, `-1`, `8`, the ROOT row shows `A4`, `A-1`, `A8`, and the tubes retune after each key

#### Scenario: Octave tick marks
- **WHEN** the OCTAVE row is rendered
- **THEN** ten single-pixel black tick marks are drawn under its track, and its thumb only rests on them

#### Scenario: Note keeps the octave
- **WHEN** the root is C5 and the user picks G# in ROOT
- **THEN** the root becomes G#5 and OCTAVE still reads `5`

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
Each unit's parameter rows (INSTRUMENT, VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, OCTAVE, SCALE, SOUNDFONT, OUTPUT, CHANNEL, MIDI MODE) SHALL live in a popover opened by that unit's SETTINGS button, a 30 px circular button in the bottom-right corner of its drawing that shows a settings icon. Their positions are fixed:
- INSTRUMENT is the first row.
- TUBES is directly above WIND.
- OCTAVE is directly below ROOT.
- OUTPUT is directly below SOUNDFONT.
- MIDI MODE is directly below CHANNEL.

While the unit is a FURIN BELL, the TUBES and SCALE rows SHALL NOT be shown. They return, with their values, when it is a TUBE CHIME again. ROOT and OCTAVE are shown for both instruments. While more than one unit exists, the popover SHALL end with a REMOVE button. On phones and tablets the OUTPUT row is not shown (see the `audio-output` capability). The popover SHALL be a square white panel with a 1px black border, anchored to the button and kept within the viewport, and it SHALL scroll when it is taller than the space available. The page behind it MUST stay live: every chime keeps animating and sounding. The SETTINGS button SHALL render inverted and report itself expanded while the popover is open. Escape, a tap outside the popover or activating SETTINGS again SHALL close it. Closing MUST NOT change any parameter. Changing INSTRUMENT MUST NOT close the popover. Only one settings popover is open at a time.

#### Scenario: Opening the popover
- **WHEN** the user activates SETTINGS on a tube-chime unit in a desktop browser
- **THEN** a panel opens holding that unit's fourteen parameter rows, starting with INSTRUMENT, then VOLUME, then TUBES, then WIND, with OCTAVE after ROOT and OUTPUT after SOUNDFONT, and ending with CHANNEL, then MIDI MODE, and its SETTINGS button renders inverted with an expanded state

#### Scenario: Furin rows
- **WHEN** the user picks FURIN BELL in a unit's INSTRUMENT select
- **THEN** the popover stays open, and its TUBES and SCALE rows are gone, leaving twelve rows in a desktop browser, ROOT and OCTAVE among them

#### Scenario: Choosing inside the popover
- **WHEN** the user picks a SCALE option from the select inside the popover
- **THEN** that unit's scale changes and the popover stays open

#### Scenario: Closing keeps values
- **WHEN** the user sets WIND to 0.20, TUBES to 4, OCTAVE to 3 and OUTPUT to `3–4`, presses Escape, and opens SETTINGS again
- **THEN** focus returned to SETTINGS on close, the WIND row reads 0.20, the TUBES row reads 4, the OCTAVE row reads 3 and the OUTPUT row reads `3–4`

#### Scenario: One popover at a time
- **WHEN** CHIME 1's settings are open and the user activates SETTINGS on CHIME 2
- **THEN** CHIME 1's popover closes and CHIME 2's opens

### Requirement: Tube notes drawer
Each unit's tube readout SHALL be hidden on a first visit and SHALL keep its shown or hidden state per unit across visits. The readout has one cell per tube, or one cell for a furin unit. Under the cells is a line naming that unit's sound. Each cell is a note pad showing its note name and frequency, with no tube-number label. A pad SHALL strike its tube (or the furin) of that unit when pressed with a pointer or activated with Enter or Space, exactly as tapping it in the drawing does: sound, MIDI and the cell's flash. Pads SHALL have an opaque white background, so nothing behind the unit shows through them. A pad SHALL invert on hover. When the unit's tube count or instrument changes, the readout SHALL gain or lose pads to match at once. A furin unit's single pad spans the readout's width and shows its ROOT.

The sound line SHALL show the unit's SOUNDFONT voice name in uppercase, without its program number, then a separator. For a tube chime the separator is followed by its SCALE name, for example `TUBULAR BELLS · RYUKYU`, and for a furin by `FURIN BELL`, for example `FURIN · FURIN BELL`. The line has an opaque white background and shares the readout's borders. It is plain text, not a control, and SHALL update at once when the voice, scale or instrument changes. Text too long for the width SHALL be cut short with an ellipsis, on one line.

The unit's NOTES toggle, a 30 px circular button in the bottom-left corner of its drawing that shows an eighth-note icon, SHALL show and hide the readout. When shown, the readout SHALL appear at once, without animation, flush against the drawing's bottom border, the same width as the drawing, sharing that border. While hidden it MUST NOT be reachable by keyboard or exposed to assistive technology.

#### Scenario: Hidden on load
- **WHEN** the page loads with nothing saved
- **THEN** the tube readout is not visible, and NOTES is not pressed

#### Scenario: Showing the readout
- **WHEN** the user turns NOTES on
- **THEN** NOTES renders inverted and pressed, and the readout appears directly under that unit's drawing, its top edge on the drawing's bottom border

#### Scenario: Opaque over another unit
- **WHEN** a unit's readout is shown on top of another unit's drawing
- **THEN** the pads and the sound line are white, and none of the other unit's lines show through them

#### Scenario: Striking from a pad
- **WHEN** the readout is shown and the user presses the third pad
- **THEN** that unit's third tube is struck once: its note-on goes to the selected MIDI port on the unit's channel and the pad flashes inverted

#### Scenario: Hiding the readout
- **WHEN** the user turns NOTES off again
- **THEN** the readout is hidden, sound line included

#### Scenario: Remembered per unit
- **WHEN** CHIME 2 has NOTES on, CHIME 1 has it off, and the page is reloaded
- **THEN** CHIME 2's readout is shown and CHIME 1's is hidden

#### Scenario: Pads follow the count
- **WHEN** the readout is shown and TUBES is changed from 6 to 8, then to 2
- **THEN** the readout shows 8 pads, then 2, each with its tube's note, and stays the drawing's width

#### Scenario: Furin pad
- **WHEN** the readout is shown, ROOT is D5, and the unit is switched to FURIN BELL
- **THEN** the readout shows one pad, the drawing's width, reading D5 and its frequency, and pressing it strikes the furin

#### Scenario: Sound line on a first visit
- **WHEN** the General MIDI font has loaded on a first visit and NOTES is turned on
- **THEN** the line under the pads reads TUBULAR BELLS, the separator, then RYUKYU

#### Scenario: Sound line follows the settings
- **WHEN** the readout is shown and the unit's SOUNDFONT is changed to VIBRAPHONE and its SCALE to PYEONGJO
- **THEN** the line reads VIBRAPHONE, the separator, then PYEONGJO, without the drawer being reopened

#### Scenario: Furin sound line
- **WHEN** the readout is shown on a unit with the default voice and it is switched to FURIN BELL
- **THEN** the line reads FURIN, the separator, then FURIN BELL

#### Scenario: Long names on a narrow drawing
- **WHEN** a unit's drawing is at its smallest size and its voice and scale names together are wider than the drawing
- **THEN** the sound line stays one line, the drawing's width, and ends with an ellipsis

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
Every control SHALL have an accessible name equal to its visible label (for example "INSTRUMENT", "WIND", "TUBES", "OUTPUT", "MIDI MODE", "MIDI OUT", "DEVICE", "SEND PROGRAM CHANGE", "TEST NOTE"), and the correct role (button, combobox, slider, checkbox). Sliders SHALL expose their current, minimum and maximum values. While SCALE or SOUNDFONT is open, its search field SHALL be a searchbox named SEARCH, and its list SHALL be a listbox named after the select. The listbox holds options named by their text, and the highlighted one is announced as the field's active option. Each unit SHALL be a labelled region named after its number (CHIME 1, CHIME 2, …), holding its drawing, round buttons and notes drawer. Its settings popover SHALL be named SETTINGS followed by the unit's name (for example "SETTINGS CHIME 2"), so a unit's controls can be told apart by where they are. The visible labels, button texts and states named by the `midi-output` capability MUST remain the same.

#### Scenario: Roles and names
- **WHEN** the page's accessibility tree is inspected with one unit
- **THEN** it has a region named CHIME 1 holding buttons named COPY, SOUND, SETTINGS and NOTES
- **AND** with that unit's settings popover open, it has a slider named TUBES (min 2, max 8, value 6), a slider named WIND (min 0, max 1, value 0.45), and comboboxes named INSTRUMENT, ROOT, SCALE, SOUNDFONT, OUTPUT, CHANNEL and MIDI MODE
- **AND** the MIDI dialog has a MIDI OUT combobox after connect, and a checkbox for each MIDI option
- **AND** the AUDIO OUT dialog has a combobox named DEVICE

#### Scenario: Search roles
- **WHEN** SCALE is opened
- **THEN** there is a focused searchbox named SEARCH and a listbox named SCALE, and SCALE is the only combobox named SCALE

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

### Requirement: Searchable selects
The SCALE and SOUNDFONT selects SHALL each open a list headed by a single-line search field. They SHALL open by click, tap, Enter, Space or Arrow Down on the closed field. Typing a letter or digit on the closed field SHALL open it with that character already in the search.

On open, the search field SHALL be focused, except on phones and tablets (every input touch-only). There the list opens with the field unfocused, so the on-screen keyboard does not cover it until the field is tapped.

With an empty search, the list SHALL show every option under its group headings, in the existing order. The current option is marked and highlighted and is scrolled into view. With text in the search, the list SHALL show only the options whose name contains that text, ignoring case, as one list with no headings. Names that start with the text come first, then the other matches, each set in alphabetical order. SCALE SHALL also be narrowed by category: when the text is part of a scale group's name (for example `korea`, `penta`, `maqam`), that group's other scales SHALL follow the name matches, under the group's heading and in the group's own order. The first match is highlighted. The current option SHALL keep its mark wherever it is shown, filtered or not, and the mark stays on it while the highlight moves, so what is selected and what Enter would choose can always be told apart. A SOUNDFONT option's name is its voice name without its program number. The option still shows the same text as in the unfiltered list. When nothing matches, the list SHALL show an empty state in its place: `NO MATCH FOR` and the typed text, and a CLEAR SEARCH button that empties the search, shows the full grouped list and puts focus back in the search field. Nothing can be chosen from the empty state, and Enter changes nothing.

While open, the panel (search field and list) SHALL keep one height, 320 px or the space available if that is less, whatever the number of matches, so filtering never shrinks, moves or flips it. This includes on a phone with the on-screen keyboard up. Focusing the search field MUST NOT zoom the page on iOS Safari, and pinch zoom MUST keep working.

Arrow Down and Arrow Up SHALL move the highlight through the shown options, stopping at the ends. Enter SHALL choose the highlighted option. A tap or click on an option SHALL choose it. Choosing closes the list, returns focus to the closed field and leaves the settings popover open. Escape, a tap outside the list or activating the field again SHALL close the list without changing the value, and Escape MUST NOT also close the settings popover. The search is cleared each time the list opens. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the space available, with the search field staying visible.

#### Scenario: Filter by start of name
- **WHEN** SCALE is opened and the user types `py`
- **THEN** the list shows PYEONGJO and PYEONGJO HEXATONIC, in that order, with no group headings, and PYEONGJO is highlighted

#### Scenario: Narrow scales by category
- **WHEN** SCALE is opened and the user types `korea`
- **THEN** the list shows the KOREA heading with PYEONGJO, UJO, GYEMYEONJO, PYEONGJO HEXATONIC and NANDO-GYEMYEONJO, in that order, and no other scales

#### Scenario: Name matches before a category
- **WHEN** SCALE is opened and the user types `hexa`
- **THEN** the scales whose names contain HEXA come first, with no heading, then the HEXATONIC heading with its scales not already listed

#### Scenario: SOUNDFONT matches names only
- **WHEN** SOUNDFONT is opened and the user types `drum kits`
- **THEN** the list shows the empty state, because SOUNDFONT does not match group names

#### Scenario: Starts-with before contains
- **WHEN** SOUNDFONT is opened after the General MIDI font loads and the user types `bass`
- **THEN** the list starts with BASS & LEAD, then BASSOON, followed by ACOUSTIC BASS, CONTRABASS, FINGERED BASS, FRETLESS BASS, PICKED BASS, SLAP BASS 1, SLAP BASS 2, SYNTH BASS 1 and SYNTH BASS 2

#### Scenario: Selected stays marked while filtering
- **WHEN** the unit's scale is PYEONGJO HEXATONIC, SCALE is opened and the user types `py`
- **THEN** PYEONGJO is highlighted (inverted) and PYEONGJO HEXATONIC carries the selected mark, and both stay that way when the user presses Arrow Down, which moves only the highlight

#### Scenario: Choose with the keyboard
- **WHEN** SCALE has focus, the user types `ujo`, then presses Enter
- **THEN** the unit's scale becomes UJO, the list closes, SCALE has focus and shows UJO, and the settings popover is still open

#### Scenario: Arrow keys through matches
- **WHEN** SCALE is open with `py` typed and the user presses Arrow Down, then Enter
- **THEN** the unit's scale becomes PYEONGJO HEXATONIC

#### Scenario: Empty search keeps groups
- **WHEN** SCALE is opened
- **THEN** the search field is empty and focused, the scales appear under their group headings in the order of the `scales` capability, and the current scale is marked and highlighted

#### Scenario: No match
- **WHEN** SOUNDFONT is opened and the user types `zzz`
- **THEN** the list shows `NO MATCH FOR ZZZ` and a CLEAR SEARCH button, the panel keeps its height and position, and pressing Enter changes nothing

#### Scenario: Clearing from the empty state
- **WHEN** the empty state is shown and the user activates CLEAR SEARCH
- **THEN** the search field is empty and focused and the full grouped list is shown

#### Scenario: Steady height while filtering
- **WHEN** SCALE is opened and the user types `py`, then `pyz`
- **THEN** the panel's height and top edge stay the same as when it opened, with two matches and with none

#### Scenario: Escape closes only the list
- **WHEN** SCALE is open with text typed and the user presses Escape
- **THEN** the list closes, the scale is unchanged, SCALE has focus, and the settings popover is still open

#### Scenario: Search is cleared on reopen
- **WHEN** the user types `py` into SCALE, closes it with Escape and opens it again
- **THEN** the search field is empty and the full grouped list is shown

#### Scenario: Type to open
- **WHEN** SOUNDFONT has focus while closed and the user types `v`
- **THEN** the list opens with `v` in the search field, filtered to voices containing V

#### Scenario: No zoom on focus in iOS Safari
- **WHEN** the search field is tapped in Safari on an iPhone
- **THEN** the page keeps its scale, and pinching still zooms

#### Scenario: Phone does not raise the keyboard
- **WHEN** SCALE is opened by a tap on a phone
- **THEN** the grouped list is shown and the search field is not focused until it is tapped
