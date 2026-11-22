# Spec Delta

## MODIFIED Requirements

### Requirement: Selects
INSTRUMENT, ROOT, SCALE, SOUND, PATCH, OUTPUT, MIDI OUT, CHANNEL, MIDI MODE and the AUDIO OUT dialog's DEVICE SHALL be single-choice selects. SCALE, SOUND and PATCH are searchable selects: the rules below apply to them unless the **Searchable selects** requirement says otherwise. INSTRUMENT offers two options, TUBE CHIME and FURIN BELL, and starts at TUBE CHIME. MIDI MODE offers two options, POLY and MONO, and starts at POLY. ROOT offers the twelve note names C, C#, D, D#, E, F, F#, G, G#, A, A# and B, in that order, with no octave number and no frequency, and starts at C; its row value is the full root note, the note with its octave (for example `C5`). SOUND lists its groups in this order: BUILT-IN SYNTH, then EXTERNAL SYNTHS (CASIO VZ-10M), then the General MIDI soundfont's groups in their existing order. Each select shows its current choice in a full-width, square, 1px black-bordered field. When open, each SHALL show a black-bordered list of options with the highlighted option inverted. Selects with groups (SCALE groups, SOUND voice groups) SHALL show group headings. Disabled options MUST be shown but not be choosable, for example a disconnected remembered MIDI port or audio device, or an OUTPUT the current device does not have. A select SHALL open by click, tap, Enter, Space or Arrow Down. It SHALL move with the arrow keys, choose with Enter, and close without changing on Escape. The selects other than SCALE, SOUND and PATCH SHALL also jump to an option when the user types the start of its text. The list MUST stay within the viewport on a phone-width screen and scroll when it is longer than the screen.

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
- **WHEN** the SOUND select is opened after the General MIDI font loads
- **THEN** voices appear under their group headings, and the current voice is marked

#### Scenario: SOUND group order
- **WHEN** the SOUND select is opened after the General MIDI font loads
- **THEN** the first heading is BUILT-IN SYNTH, the second is EXTERNAL SYNTHS holding CASIO VZ-10M, and the General MIDI groups follow

#### Scenario: Disabled option
- **WHEN** MIDI OUT is open while the remembered port is disconnected
- **THEN** the remembered port appears marked DISCONNECTED and cannot be chosen

#### Scenario: Long list on a phone
- **WHEN** CHANNEL, SOUND or OUTPUT (with an 18-channel device) is opened on a 375 px wide viewport
- **THEN** the list fits the viewport width and can be scrolled to every option

#### Scenario: MIDI mode options
- **WHEN** the MIDI MODE select is opened
- **THEN** it lists POLY and MONO, with POLY marked on a first visit

#### Scenario: Instrument options
- **WHEN** the INSTRUMENT select is opened on a first visit
- **THEN** it lists TUBE CHIME and FURIN BELL, with TUBE CHIME marked

### Requirement: Parameter popover
Each unit's parameter rows (INSTRUMENT, VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, OCTAVE, SCALE, SOUND, PATCH, OUTPUT, CHANNEL, MIDI MODE) SHALL live in a popover opened by that unit's SETTINGS button, a 30 px circular button in the bottom-right corner of its drawing that shows a settings icon. Their positions are fixed:
- INSTRUMENT is the first row.
- TUBES is directly above WIND.
- OCTAVE is directly below ROOT.
- PATCH, when shown, is directly below SOUND.
- OUTPUT is directly below PATCH when PATCH is shown, else directly below SOUND.
- MIDI MODE is directly below CHANNEL.

While the unit is a FURIN BELL, the TUBES and SCALE rows SHALL NOT be shown. They return, with their values, when it is a TUBE CHIME again. ROOT and OCTAVE are shown for both instruments. PATCH SHALL be shown only while the unit's sound is an external synth (see `external-synths`). While more than one unit exists, the popover SHALL end with a REMOVE button. On phones and tablets the OUTPUT row is not shown (see the `audio-output` capability). The popover SHALL be a square white panel with a 1px black border, anchored to the button and kept within the viewport, and it SHALL scroll when it is taller than the space available. The page behind it MUST stay live: every chime keeps animating and sounding. The SETTINGS button SHALL render inverted and report itself expanded while the popover is open. Escape, a tap outside the popover or activating SETTINGS again SHALL close it. Closing MUST NOT change any parameter. Changing INSTRUMENT or SOUND MUST NOT close the popover. Only one settings popover is open at a time.

#### Scenario: Opening the popover
- **WHEN** the user activates SETTINGS on a tube-chime unit with a soundfont voice in a desktop browser
- **THEN** a panel opens holding that unit's fourteen parameter rows, starting with INSTRUMENT, then VOLUME, then TUBES, then WIND, with OCTAVE after ROOT and OUTPUT after SOUND, and ending with CHANNEL, then MIDI MODE, and its SETTINGS button renders inverted with an expanded state

#### Scenario: Furin rows
- **WHEN** the user picks FURIN BELL in a unit's INSTRUMENT select
- **THEN** the popover stays open, and its TUBES and SCALE rows are gone, leaving twelve rows in a desktop browser, ROOT and OCTAVE among them

#### Scenario: PATCH row
- **WHEN** the user picks CASIO VZ-10M in a tube-chime unit's SOUND select in a desktop browser
- **THEN** the popover stays open with fifteen rows, PATCH directly below SOUND and OUTPUT directly below PATCH

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

The sound line SHALL show the unit's SOUND voice name in uppercase, without its program number, then a separator. For an external synth the voice name is the synth's name, a separator and the patch name, for example `CASIO VZ-10M · KILLER ORGAN`. For a tube chime the last separator is followed by its SCALE name, for example `TUBULAR BELLS · RYUKYU`, and for a furin by `FURIN BELL`, for example `FURIN · FURIN BELL`. The line has an opaque white background and shares the readout's borders. It is plain text, not a control, and SHALL update at once when the voice, patch, scale or instrument changes. Text too long for the width SHALL be cut short with an ellipsis, on one line.

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
- **WHEN** the readout is shown and the unit's SOUND is changed to VIBRAPHONE and its SCALE to PYEONGJO
- **THEN** the line reads VIBRAPHONE, the separator, then PYEONGJO, without the drawer being reopened

#### Scenario: External synth sound line
- **WHEN** the readout is shown on a tube chime with scale RYUKYU and its SOUND is changed to CASIO VZ-10M
- **THEN** the line reads CASIO VZ-10M, the separator, INIT, the separator, then RYUKYU

#### Scenario: Furin sound line
- **WHEN** the readout is shown on a unit with the default voice and it is switched to FURIN BELL
- **THEN** the line reads FURIN, the separator, then FURIN BELL

#### Scenario: Long names on a narrow drawing
- **WHEN** a unit's drawing is at its smallest size and its voice and scale names together are wider than the drawing
- **THEN** the sound line stays one line, the drawing's width, and ends with an ellipsis

### Requirement: Searchable selects
The SCALE, SOUND and PATCH selects SHALL each open a list headed by a single-line search field. They SHALL open by click, tap, Enter, Space or Arrow Down on the closed field. Typing a letter or digit on the closed field SHALL open it with that character already in the search.

On open, the search field SHALL be focused, except on phones and tablets (every input touch-only). There the list opens with the field unfocused, so the on-screen keyboard does not cover it until the field is tapped.

With an empty search, the list SHALL show every option under its group headings, in the existing order. The current option is marked and highlighted and is scrolled into view. With text in the search, the list SHALL show only the options whose name contains that text, ignoring case, as one list with no headings. Names that start with the text come first, then the other matches, each set in alphabetical order. SCALE SHALL also be narrowed by category: when the text is part of a scale group's name (for example `korea`, `penta`, `maqam`), that group's other scales SHALL follow the name matches, under the group's heading and in the group's own order. The first match is highlighted. The current option SHALL keep its mark wherever it is shown, filtered or not, and the mark stays on it while the highlight moves, so what is selected and what Enter would choose can always be told apart. A SOUND option's name is its voice name without its program number. The option still shows the same text as in the unfiltered list. When nothing matches, the list SHALL show an empty state in its place: `NO MATCH FOR` and the typed text, and a CLEAR SEARCH button that empties the search, shows the full grouped list and puts focus back in the search field. Nothing can be chosen from the empty state, and Enter changes nothing.

PATCH differs in where its options come from: they are fetched from the synth's library as the list opens, pages and is searched (see `external-synths`, **Fetching the patch list**), its matches keep the library's order (newest first) rather than being re-sorted, its search field accepts at most 12 characters, and its list ends with MORE while more patches exist, `LOADING…` while a fetch is in progress, or `COULD NOT LOAD` with RETRY when one fails. Arrow Down reaching MORE SHALL highlight it, and Enter on it SHALL fetch the next page without closing the list.

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
- **WHEN** SOUND is opened and the user types `drum kits`
- **THEN** the list shows the empty state, because SOUND does not match group names

#### Scenario: Find the VZ-10M
- **WHEN** SOUND is opened and the user types `vz`
- **THEN** the list shows CASIO VZ-10M

#### Scenario: Starts-with before contains
- **WHEN** SOUND is opened after the General MIDI font loads and the user types `bass`
- **THEN** the list starts with BASS & LEAD, then BASSOON, followed by ACOUSTIC BASS, CONTRABASS, FINGERED BASS, FRETLESS BASS, PICKED BASS, SLAP BASS 1, SLAP BASS 2, SYNTH BASS 1 and SYNTH BASS 2

#### Scenario: Selected stays marked while filtering
- **WHEN** the unit's scale is PYEONGJO HEXATONIC, SCALE is opened and the user types `py`
- **THEN** PYEONGJO is highlighted (inverted) and PYEONGJO HEXATONIC carries the selected mark, and both stay that way when the user presses Arrow Down, which moves only the highlight

#### Scenario: MORE by keyboard
- **WHEN** PATCH is open with MORE at the end of its list and the user presses Arrow Down until MORE is highlighted, then Enter
- **THEN** the next page of patches is appended, the list stays open, and nothing is chosen

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
- **WHEN** SOUND is opened and the user types `zzz`
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
- **WHEN** SOUND has focus while closed and the user types `v`
- **THEN** the list opens with `v` in the search field, filtered to voices containing V

#### Scenario: No zoom on focus in iOS Safari
- **WHEN** the search field is tapped in Safari on an iPhone
- **THEN** the page keeps its scale, and pinching still zooms

#### Scenario: Phone does not raise the keyboard
- **WHEN** SCALE is opened by a tap on a phone
- **THEN** the grouped list is shown and the search field is not focused until it is tapped
