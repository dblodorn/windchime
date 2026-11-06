# Spec Delta

## ADDED Requirements

### Requirement: Resetting the page
The page SHALL show a RESET button fixed to the lower right, immediately left of the MIDI button and right of the SHARE button, 8 CSS px from each, with the same height, width, border and style as those buttons, labelled with the text `RESET` in the UI font and no icon. It SHALL stay above every unit, invert on hover, show the dashed keyboard focus outline, and activate with a click, a tap, Enter or Space. Its accessible name SHALL be "RESET".

Activating RESET SHALL, at once and without asking for confirmation, replace every unit on the page with one unit, CHIME 1, with the default parameters (the unit a first visit shows), on MIDI channel 1, at the center of the page, with SOUND off and its notes readout hidden. The MIDI notes of the units it replaces SHALL be ended. The stored composition SHALL become that single unit, so a reload shows it. RESET SHALL NOT change the MIDI port, the SEND options or PLAY SOUND IN BROWSER TOO.

#### Scenario: Placement
- **WHEN** the page loads at any viewport width
- **THEN** SHARE, RESET and MIDI sit in one row at the lower right, in that order from left to right, 8 px apart, with the same height and bottom edge

#### Scenario: Reset several units
- **WHEN** three units exist with changed settings and positions, and the user activates RESET
- **THEN** exactly one unit, CHIME 1, is shown at the center with WIND 0.45, DECAY 4.0 S, ROOT C5, SCALE RYUKYU on MIDI channel 1, muted

#### Scenario: Notes end
- **WHEN** a MIDI port is live, units are sounding notes on channels 1 and 2, and the user activates RESET
- **THEN** note-offs are sent for every sounding note on channels 1 and 2, and the MIDI port stays selected

#### Scenario: Survives reload
- **WHEN** the user activates RESET, then reloads the page
- **THEN** the page shows the single default unit
