# Spec Delta

## MODIFIED Requirements

### Requirement: Selects
ROOT, SCALE, SOUNDFONT, OUTPUT, MIDI OUT, CHANNEL, MIDI MODE and the AUDIO OUT dialog's DEVICE SHALL be single-choice selects. SCALE and SOUNDFONT are searchable selects: the rules below apply to them unless the **Searchable selects** requirement says otherwise. MIDI MODE offers two options, POLY and MONO, and starts at POLY. Each select shows its current choice in a full-width, square, 1px black-bordered field. When open, each SHALL show a black-bordered list of options with the highlighted option inverted. Selects with groups (SCALE groups, SOUNDFONT voice groups) SHALL show group headings. Disabled options MUST be shown but not be choosable, for example a disconnected remembered MIDI port or audio device, or an OUTPUT the current device does not have. A select SHALL open by click, tap, Enter, Space or Arrow Down. It SHALL move with the arrow keys, choose with Enter, and close without changing on Escape. The selects other than SCALE and SOUNDFONT SHALL also jump to an option when the user types the start of its text. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the screen.

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
- **WHEN** CHANNEL, SOUNDFONT or OUTPUT (with an 18-channel device) is opened on a 375 px wide viewport
- **THEN** the list fits the viewport width and can be scrolled to every option

#### Scenario: MIDI mode options
- **WHEN** the MIDI MODE select is opened
- **THEN** it lists POLY and MONO, with POLY marked on a first visit

### Requirement: Tube notes drawer
Each unit's tube readout SHALL be hidden on a first visit and SHALL keep its shown or hidden state per unit across visits. The readout has one cell per tube and, under the cells, a line naming that unit's sound and scale. Each cell is a note pad showing its tube's note name and frequency, with no tube-number label. A pad SHALL strike that tube of that unit when pressed with a pointer or activated with Enter or Space, exactly as tapping the tube in the drawing does: sound, MIDI and the cell's flash. Pads SHALL have an opaque white background, so nothing behind the unit shows through them. A pad SHALL invert on hover. When the unit's tube count changes, the readout SHALL gain or lose pads to match at once.

The sound line SHALL show the unit's SOUNDFONT voice name in uppercase, without its program number, then a separator, then its SCALE name, for example `TUBULAR BELLS · RYUKYU`. The line has an opaque white background and shares the readout's borders. It is plain text, not a control, and SHALL update at once when the voice or scale changes. Text too long for the width SHALL be cut short with an ellipsis, on one line.

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

#### Scenario: Sound line on a first visit
- **WHEN** the General MIDI font has loaded on a first visit and NOTES is turned on
- **THEN** the line under the pads reads TUBULAR BELLS, the separator, then RYUKYU

#### Scenario: Sound line follows the settings
- **WHEN** the readout is shown and the unit's SOUNDFONT is changed to VIBRAPHONE and its SCALE to PYEONGJO
- **THEN** the line reads VIBRAPHONE, the separator, then PYEONGJO, without the drawer being reopened

#### Scenario: Long names on a narrow drawing
- **WHEN** a unit's drawing is at its smallest size and its voice and scale names together are wider than the drawing
- **THEN** the sound line stays one line, the drawing's width, and ends with an ellipsis

### Requirement: Accessible names and roles
Every control SHALL have an accessible name equal to its visible label (for example "WIND", "TUBES", "OUTPUT", "MIDI MODE", "MIDI OUT", "DEVICE", "SEND PROGRAM CHANGE", "TEST NOTE"), and the correct role (button, combobox, slider, checkbox). Sliders SHALL expose their current, minimum and maximum values. While SCALE or SOUNDFONT is open, its search field SHALL be a searchbox named SEARCH, and its list SHALL be a listbox named after the select. The listbox holds options named by their text, and the highlighted one is announced as the field's active option. Each unit SHALL be a labelled region named after its number (CHIME 1, CHIME 2, …), holding its drawing, round buttons and notes drawer. Its settings popover SHALL be named SETTINGS followed by the unit's name (for example "SETTINGS CHIME 2"), so a unit's controls can be told apart by where they are. The visible labels, button texts and states named by the `midi-output` capability MUST remain the same.

#### Scenario: Roles and names
- **WHEN** the page's accessibility tree is inspected with one unit
- **THEN** it has a region named CHIME 1 holding buttons named COPY, SOUND, SETTINGS and NOTES
- **AND** with that unit's settings popover open, it has a slider named TUBES (min 2, max 8, value 6), a slider named WIND (min 0, max 1, value 0.45), and comboboxes named ROOT, SCALE, SOUNDFONT, OUTPUT, CHANNEL and MIDI MODE
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

## ADDED Requirements

### Requirement: Searchable selects
The SCALE and SOUNDFONT selects SHALL each open a list headed by a single-line search field. They SHALL open by click, tap, Enter, Space or Arrow Down on the closed field. Typing a letter or digit on the closed field SHALL open it with that character already in the search.

On open, the search field SHALL be focused, except on phones and tablets (every input touch-only). There the list opens with the field unfocused, so the on-screen keyboard does not cover it until the field is tapped.

With an empty search, the list SHALL show every option under its group headings, in the existing order. The current option is marked and highlighted and is scrolled into view. With text in the search, the list SHALL show only the options whose name contains that text, ignoring case, as one list with no headings. Names that start with the text come first, then the other matches, each set in alphabetical order. The first match is highlighted. The current option SHALL keep its mark wherever it is shown, filtered or not, and the mark stays on it while the highlight moves, so what is selected and what Enter would choose can always be told apart. A SOUNDFONT option's name is its voice name without its program number. The option still shows the same text as in the unfiltered list. When nothing matches, the list SHALL show `NO MATCH` and nothing can be chosen.

Arrow Down and Arrow Up SHALL move the highlight through the shown options, stopping at the ends. Enter SHALL choose the highlighted option. A tap or click on an option SHALL choose it. Choosing closes the list, returns focus to the closed field and leaves the settings popover open. Escape, a tap outside the list or activating the field again SHALL close the list without changing the value, and Escape MUST NOT also close the settings popover. The search is cleared each time the list opens. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the space available, with the search field staying visible.

#### Scenario: Filter by start of name
- **WHEN** SCALE is opened and the user types `py`
- **THEN** the list shows PYEONGJO and PYEONGJO HEXATONIC, in that order, with no group headings, and PYEONGJO is highlighted

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
- **THEN** the list shows `NO MATCH`, and pressing Enter changes nothing

#### Scenario: Escape closes only the list
- **WHEN** SCALE is open with text typed and the user presses Escape
- **THEN** the list closes, the scale is unchanged, SCALE has focus, and the settings popover is still open

#### Scenario: Search is cleared on reopen
- **WHEN** the user types `py` into SCALE, closes it with Escape and opens it again
- **THEN** the search field is empty and the full grouped list is shown

#### Scenario: Type to open
- **WHEN** SOUNDFONT has focus while closed and the user types `v`
- **THEN** the list opens with `v` in the search field, filtered to voices containing V

#### Scenario: Phone does not raise the keyboard
- **WHEN** SCALE is opened by a tap on a phone
- **THEN** the grouped list is shown and the search field is not focused until it is tapped
