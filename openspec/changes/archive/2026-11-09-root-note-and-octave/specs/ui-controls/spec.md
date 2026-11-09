## MODIFIED Requirements

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
