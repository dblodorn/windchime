## MODIFIED Requirements

### Requirement: Selects
INSTRUMENT, ROOT, SCALE, SOUNDFONT, OUTPUT, MIDI OUT, CHANNEL, MIDI MODE and the AUDIO OUT dialog's DEVICE SHALL be single-choice selects. SCALE and SOUNDFONT are searchable selects: the rules below apply to them unless the **Searchable selects** requirement says otherwise. INSTRUMENT offers two options, TUBE CHIME and FURIN BELL, and starts at TUBE CHIME. MIDI MODE offers two options, POLY and MONO, and starts at POLY. Each select shows its current choice in a full-width, square, 1px black-bordered field. When open, each SHALL show a black-bordered list of options with the highlighted option inverted. Selects with groups (SCALE groups, SOUNDFONT voice groups) SHALL show group headings. Disabled options MUST be shown but not be choosable, for example a disconnected remembered MIDI port or audio device, or an OUTPUT the current device does not have. A select SHALL open by click, tap, Enter, Space or Arrow Down. It SHALL move with the arrow keys, choose with Enter, and close without changing on Escape. The selects other than SCALE and SOUNDFONT SHALL also jump to an option when the user types the start of its text. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the screen.

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

#### Scenario: Instrument options
- **WHEN** the INSTRUMENT select is opened on a first visit
- **THEN** it lists TUBE CHIME and FURIN BELL, with TUBE CHIME marked

### Requirement: Parameter popover
Each unit's parameter rows (INSTRUMENT, VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, OUTPUT, CHANNEL, MIDI MODE) SHALL live in a popover opened by that unit's SETTINGS button, a 30 px circular button in the bottom-right corner of its drawing that shows a settings icon. Their positions are fixed:
- INSTRUMENT is the first row.
- TUBES is directly above WIND.
- OUTPUT is directly below SOUNDFONT.
- MIDI MODE is directly below CHANNEL.

While the unit is a FURIN BELL, the TUBES and SCALE rows SHALL NOT be shown. They return, with their values, when it is a TUBE CHIME again. While more than one unit exists, the popover SHALL end with a REMOVE button. On phones and tablets the OUTPUT row is not shown (see the `audio-output` capability). The popover SHALL be a square white panel with a 1px black border, anchored to the button and kept within the viewport, and it SHALL scroll when it is taller than the space available. The page behind it MUST stay live: every chime keeps animating and sounding. The SETTINGS button SHALL render inverted and report itself expanded while the popover is open. Escape, a tap outside the popover or activating SETTINGS again SHALL close it. Closing MUST NOT change any parameter. Changing INSTRUMENT MUST NOT close the popover. Only one settings popover is open at a time.

#### Scenario: Opening the popover
- **WHEN** the user activates SETTINGS on a tube-chime unit in a desktop browser
- **THEN** a panel opens holding that unit's thirteen parameter rows, starting with INSTRUMENT, then VOLUME, then TUBES, then WIND, with OUTPUT after SOUNDFONT, and ending with CHANNEL, then MIDI MODE, and its SETTINGS button renders inverted with an expanded state

#### Scenario: Furin rows
- **WHEN** the user picks FURIN BELL in a unit's INSTRUMENT select
- **THEN** the popover stays open, and its TUBES and SCALE rows are gone, leaving eleven rows in a desktop browser

#### Scenario: Choosing inside the popover
- **WHEN** the user picks a SCALE option from the select inside the popover
- **THEN** that unit's scale changes and the popover stays open

#### Scenario: Closing keeps values
- **WHEN** the user sets WIND to 0.20, TUBES to 4 and OUTPUT to `3–4`, presses Escape, and opens SETTINGS again
- **THEN** focus returned to SETTINGS on close, the WIND row reads 0.20, the TUBES row reads 4 and the OUTPUT row reads `3–4`

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
