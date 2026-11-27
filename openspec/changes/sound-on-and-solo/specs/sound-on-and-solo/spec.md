## ADDED Requirements

### Requirement: SOUND ON button
While the page's audio is not running, the page SHALL show a button named SOUND ON, fixed in the upper-left corner (16 px from the top and left edges plus the safe area), 44 px tall, above the units. It SHALL be filled with the design system's alert color, with white text. Audio is not running before the first tap that starts it, and whenever the browser has suspended or interrupted it. The server render SHALL include the button, since audio is never running on load. Once audio is running, the button SHALL hide, whether or not any unit's SOUND is on.

#### Scenario: First visit
- **WHEN** the page loads
- **THEN** a button named SOUND ON is shown in the upper-left corner, filled with the alert color, with white text

#### Scenario: Hidden once audio runs
- **WHEN** the user turns one unit's SOUND on with its own button
- **THEN** the SOUND ON button hides
- **AND** it stays hidden after the user turns that unit's SOUND off again

#### Scenario: Audio interrupted
- **WHEN** audio was running and the browser suspends the audio context
- **THEN** the SOUND ON button shows again

### Requirement: SOUND ON turns every unit on
Pressing SOUND ON SHALL start audio inside that press and then turn on every unit's SOUND, without each unit's confirming arpeggio. It SHALL NOT change anything else: parameters, MIDI output, positions, focus.

#### Scenario: Three muted units
- **WHEN** the page has three muted units and the user presses SOUND ON
- **THEN** all three SOUND buttons are pressed and the SOUND ON button hides
- **AND** no unit plays its arpeggio

#### Scenario: Some units already on
- **WHEN** audio was interrupted while one of two units was sounding, and the user presses SOUND ON
- **THEN** both units' SOUND is on

### Requirement: Notice placement
While the SOUND ON button and the address notice (COMPOSITION NOT FOUND, COULD NOT OPEN) both show, the notice SHALL sit directly below the button, 8 px apart, and they MUST NOT overlap.

#### Scenario: Missing composition
- **WHEN** the user opens the address of a composition that doesn't exist
- **THEN** SOUND ON shows in the upper-left corner and COMPOSITION NOT FOUND shows below it

### Requirement: SOLO tip
While the page has two or more units, each unit's SOUND button SHALL have a tip, a small popup beside it named "SOLO CHIME n", holding one button:
- SOLO, on a unit that isn't soloed
- SOLO OFF, on the soloed unit

The tip SHALL open:
- when the pointer rests on the SOUND button
- when the SOUND button gets keyboard focus
- after a long press (about 500 ms) on the SOUND button on touch screens; that press SHALL NOT also toggle SOUND

The tip SHALL stay open while the pointer is on the button or the tip. It SHALL close when the pointer leaves both, on Escape, on a press outside it, and after its button is activated. Tab from the SOUND button SHALL move focus into the tip. The tip SHALL draw in the unit's ink, square, with a 1 px border on white. With one unit on the page, the SOUND button SHALL have no tip.

#### Scenario: Hover
- **WHEN** the page has two units and the pointer rests on CHIME 2's SOUND button
- **THEN** a tip named "SOLO CHIME 2" shows a button named SOLO, drawn in CHIME 2's ink

#### Scenario: Keyboard
- **WHEN** CHIME 1's SOUND button gets keyboard focus and the user presses Tab
- **THEN** focus is on the tip's SOLO button
- **AND** Enter solos CHIME 1

#### Scenario: Long press on touch
- **WHEN** on a touch screen the user holds CHIME 1's SOUND button for 500 ms and releases
- **THEN** the tip shows SOLO and CHIME 1's SOUND is unchanged

#### Scenario: One unit
- **WHEN** the page has one unit and the pointer rests on its SOUND button
- **THEN** no tip shows

### Requirement: Soloing a unit
Activating SOLO on a unit SHALL start audio inside that press, turn that unit's SOUND on (without its arpeggio), turn every other unit's SOUND off, and bring the unit to the front. While a unit is soloed, every other unit SHALL be drawn in the 25% tint of its ink that channel focus uses, on opaque white, and stay fully usable. Soloing SHALL end any channel focus. Activating SOLO on another unit while one is soloed SHALL move solo to that unit. At most one unit SHALL be soloed at a time. Solo SHALL change only the units' browser sound: MIDI output MUST NOT change.

#### Scenario: Solo one of three
- **WHEN** CHIME 1 and CHIME 3 are sounding, CHIME 2 is muted, and the user activates SOLO on CHIME 2
- **THEN** only CHIME 2's SOUND is on, CHIME 2 is in front, and CHIME 1 and CHIME 3 draw in their 25% tint

#### Scenario: MIDI unchanged
- **WHEN** a MIDI port is connected, units 1 and 2 send MIDI, and the user solos CHIME 1
- **THEN** both units keep sending their notes over MIDI

#### Scenario: Move solo
- **WHEN** CHIME 1 is soloed and the user activates SOLO on CHIME 2
- **THEN** only CHIME 2's SOUND is on and CHIME 1 draws in its tint

#### Scenario: Channel focus ends
- **WHEN** channel 2 is focused and the user solos the channel 1 unit
- **THEN** no channel square is pressed, and every unit but the soloed one draws in its tint

### Requirement: Ending solo
Activating SOLO OFF SHALL set every unit's SOUND back to what it was before the first SOLO (units turning back on don't play their arpeggio) and draw every unit in its full ink. Solo SHALL also end, without restoring any unit's SOUND, when:
- the user changes any unit's SOUND with its SOUND button or with SOUND ON
- a unit is added (COPY) or removed (REMOVE)
- the page is reset (RESET)
- a share link or a saved composition opens

Pressing a faded unit while soloed SHALL NOT end solo.

#### Scenario: SOLO OFF restores
- **WHEN** CHIME 1 and CHIME 3 were sounding and CHIME 2 muted, the user soloed CHIME 2, then soloed CHIME 3, then activated SOLO OFF
- **THEN** CHIME 1 and CHIME 3 are sounding, CHIME 2 is muted, and every unit draws in its full ink

#### Scenario: Manual SOUND ends solo
- **WHEN** CHIME 2 is soloed and the user turns CHIME 1's SOUND on with its own button
- **THEN** CHIME 1 and CHIME 2 are sounding, no unit is faded, and CHIME 2's tip shows SOLO

#### Scenario: Removing a unit ends solo
- **WHEN** CHIME 2 is soloed and the user removes CHIME 3
- **THEN** no unit is faded and the remaining units' SOUND is unchanged

#### Scenario: Press a faded unit
- **WHEN** CHIME 2 is soloed and the user drags CHIME 1 by its paper
- **THEN** CHIME 1 moves, comes to the front, and still draws in its tint

### Requirement: Solo is not stored
Solo MUST NOT be saved in browser storage, share links or saved compositions. Every page load SHALL start with no unit soloed.

#### Scenario: Reload
- **WHEN** a unit is soloed and the page is reloaded
- **THEN** no unit is soloed, every unit is muted and draws in its full ink

#### Scenario: Link carries no solo
- **WHEN** a unit is soloed and the user presses SHARE
- **THEN** the copied address opens the same composition with no unit soloed
