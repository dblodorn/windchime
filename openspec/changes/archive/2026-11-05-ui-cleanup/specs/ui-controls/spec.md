# Spec Delta

## MODIFIED Requirements

### Requirement: Tube notes drawer
Each unit's tube readout, one cell per tube, SHALL be hidden on a first visit and SHALL keep its shown or hidden state per unit across visits. Each cell is a note pad showing its tube's note name and frequency, with no tube-number label, and SHALL strike that tube of that unit (sound, MIDI and the cell's flash, exactly as tapping the tube in the drawing) when pressed with a pointer or activated with Enter or Space. Pads SHALL have an opaque white background, so nothing behind the unit shows through them. A pad SHALL invert on hover. When the unit's tube count changes, the readout SHALL gain or lose pads to match at once. The unit's NOTES toggle, a 30 px circular button in the bottom-left corner of its drawing that shows an eighth-note icon, SHALL show and hide it. When shown, the readout SHALL appear at once, without animation, flush against the drawing's bottom border, the same width as the drawing, sharing that border. While hidden it MUST NOT be reachable by keyboard or exposed to assistive technology.

#### Scenario: Hidden on load
- **WHEN** the page loads with nothing saved
- **THEN** the tube readout is not visible, and NOTES is not pressed

#### Scenario: Showing the readout
- **WHEN** the user turns NOTES on
- **THEN** NOTES renders inverted and pressed, and the readout appears directly under that unit's drawing, its top edge on the drawing's bottom border

#### Scenario: Opaque over another unit
- **WHEN** a unit's readout is shown on top of another unit's drawing
- **THEN** the pads are white, and none of the other unit's lines show through them

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
