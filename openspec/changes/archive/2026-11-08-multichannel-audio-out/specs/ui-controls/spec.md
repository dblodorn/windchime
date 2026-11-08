# Spec Delta

## MODIFIED Requirements

### Requirement: Selects
ROOT, SCALE, SOUNDFONT, OUTPUT, MIDI OUT, CHANNEL, MIDI MODE and the AUDIO OUT dialog's DEVICE SHALL be single-choice selects. MIDI MODE offers two options, POLY and MONO, and starts at POLY. Each shows its current choice in a full-width, square, 1px black-bordered field. When open, each SHALL show a black-bordered list of options with the highlighted option inverted. Selects with groups (SCALE groups, SOUNDFONT voice groups) SHALL show group headings. Disabled options (for example a disconnected remembered MIDI port or audio device, or an OUTPUT the current device does not have) MUST be shown but not be choosable. A select SHALL open by click, tap, Enter, Space or Arrow Down. It SHALL move with the arrow keys, jump by typing the start of an option, choose with Enter, and close without changing on Escape. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the screen.

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

### Requirement: Parameter popover
Each unit's parameter rows (VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, OUTPUT, CHANNEL, MIDI MODE) SHALL live in a popover opened by that unit's SETTINGS button, a 30 px circular button in the bottom-right corner of its drawing that shows a settings icon. TUBES SHALL be the row directly above WIND, OUTPUT the row directly below SOUNDFONT, and MIDI MODE the row directly below CHANNEL. While more than one unit exists, the popover SHALL end with a REMOVE button. On phones and tablets the OUTPUT row is not shown, so the popover holds eleven rows (see the `audio-output` capability). The popover SHALL be a square white panel with a 1px black border, anchored to the button and kept within the viewport, and it SHALL scroll when it is taller than the space available. The page behind it MUST stay live: every chime keeps animating and sounding. The SETTINGS button SHALL render inverted and report itself expanded while the popover is open. Escape, a tap outside the popover or activating SETTINGS again SHALL close it. Closing MUST NOT change any parameter. Only one settings popover is open at a time.

#### Scenario: Opening the popover
- **WHEN** the user activates SETTINGS on a unit in a desktop browser
- **THEN** a panel opens holding that unit's twelve parameter rows, starting with VOLUME, then TUBES, then WIND, with OUTPUT after SOUNDFONT, and ending with CHANNEL, then MIDI MODE, and its SETTINGS button renders inverted with an expanded state

#### Scenario: Choosing inside the popover
- **WHEN** the user picks a SCALE option from the select inside the popover
- **THEN** that unit's scale changes and the popover stays open

#### Scenario: Closing keeps values
- **WHEN** the user sets WIND to 0.20, TUBES to 4 and OUTPUT to `3–4`, presses Escape, and opens SETTINGS again
- **THEN** focus returned to SETTINGS on close, the WIND row reads 0.20, the TUBES row reads 4 and the OUTPUT row reads `3–4`

#### Scenario: One popover at a time
- **WHEN** CHIME 1's settings are open and the user activates SETTINGS on CHIME 2
- **THEN** CHIME 1's popover closes and CHIME 2's opens

### Requirement: Accessible names and roles
Every control SHALL have an accessible name equal to its visible label (for example "WIND", "TUBES", "OUTPUT", "MIDI MODE", "MIDI OUT", "DEVICE", "SEND PROGRAM CHANGE", "TEST NOTE"), and the correct role (button, combobox, slider, checkbox). Sliders SHALL expose their current, minimum and maximum values. Each unit SHALL be a labelled region named after its number (CHIME 1, CHIME 2, …), holding its drawing, round buttons and notes drawer, and its settings popover SHALL be named SETTINGS followed by the unit's name (for example "SETTINGS CHIME 2"), so a unit's controls can be told apart by where they are. The visible labels, button texts and states named by the `midi-output` capability MUST remain the same.

#### Scenario: Roles and names
- **WHEN** the page's accessibility tree is inspected with one unit
- **THEN** there is a region named CHIME 1 holding buttons named COPY, SOUND, SETTINGS and NOTES, and with its settings popover open there is a slider named TUBES with min 2, max 8 and value 6, a slider named WIND with min 0, max 1 and value 0.45, comboboxes named ROOT, SCALE, SOUNDFONT, OUTPUT, CHANNEL and MIDI MODE, in the MIDI dialog a MIDI OUT combobox (after connect) and checkboxes named for each MIDI option, and in the AUDIO OUT dialog a combobox named DEVICE

#### Scenario: Units told apart
- **WHEN** two units exist
- **THEN** there are regions named CHIME 1 and CHIME 2, each holding exactly one button named COPY, SOUND, SETTINGS and NOTES

#### Scenario: MIDI controls unchanged
- **WHEN** the MIDI behavior checks from the `midi-output` capability are run using controls by role and name
- **THEN** they all pass
