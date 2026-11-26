# share-links Specification

## Purpose
Lets a composition (every chime unit and its settings) be shared as a link: SHARE copies a URL that opens the same units on any device, in place of whatever that browser had saved.

## Requirements

### Requirement: SHARE button
The page SHALL show a SHARE button fixed to the lower right, immediately left of the RESET button (which sits immediately left of the AUDIO button, itself immediately left of the MIDI button; on phones and tablets, which have no AUDIO button, RESET sits immediately left of MIDI), 8 CSS px from it, with the same height, width, border and style as the MIDI button, labelled with the text `SHARE` in the UI font and no icon. It SHALL stay above every unit and SHALL be reachable by keyboard.

Activating it SHALL save the current composition to the dmbk GraphQL API exactly as SAVE does (the same units, the same rules for what is and isn't sent, and this browser's device key; see `saved-compositions`), and then copy the composition's address, `https://chime.dmbk.io/c/<id>` (see `composition-routes`), to the clipboard. Units identical to a stored composition SHALL get that composition's address and SHALL NOT add a second entry, so sharing an unchanged composition twice copies the same address. While the save is in progress the label SHALL read `SHARING…` and the button SHALL be disabled. On success the label SHALL change to `COPIED` for about 1.5 seconds, then back to `SHARE`, the address bar SHALL show the copied address without reloading or adding a history entry, and the shared composition SHALL appear in COMPOSITIONS like a saved one.

When the save fails for any reason (rate limit, network, API unavailable), SHARE SHALL copy a fragment link that encodes the composition instead (as described under "What a link carries"), with the same `COPIED` feedback, so sharing never stops working.

Where the clipboard cannot be written and the system share sheet is available, it SHALL open the share sheet with the link instead. Where neither works, it SHALL show the link in the address bar so it can be copied by hand.

#### Scenario: Placement and size
- **WHEN** the page is shown in a desktop browser
- **THEN** a SHARE button sits left of the RESET button, which sits left of the AUDIO button, which sits left of the MIDI button, all four with the same height, width and bottom edge

#### Scenario: Copy the link
- **WHEN** the user activates SHARE, the save succeeds and the clipboard is available
- **THEN** the clipboard holds `https://chime.dmbk.io/c/<id>` for the saved composition, the address bar shows that address, and the button reads COPIED, then SHARE again

#### Scenario: Share twice
- **WHEN** the user activates SHARE twice without changing anything
- **THEN** both times the same address is copied, and COMPOSITIONS holds one entry for that composition

#### Scenario: Share after a change
- **WHEN** the user shares, moves one unit, and shares again
- **THEN** the second address differs from the first, and COMPOSITIONS holds an entry for each

#### Scenario: Rate-limited
- **WHEN** the API refuses SHARE's save as rate-limited
- **THEN** the clipboard holds a link whose fragment encodes the composition, and the button reads COPIED

#### Scenario: API down
- **WHEN** the API cannot be reached and the user activates SHARE
- **THEN** the clipboard holds a link whose fragment encodes the composition, and the units are unchanged

#### Scenario: No clipboard
- **WHEN** the clipboard cannot be written and the browser has a share sheet
- **THEN** the share sheet opens with the link

### Requirement: What a link carries
A link SHALL carry, for each unit in page order: INSTRUMENT, VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, the root note (ROOT and OCTAVE, anywhere from C-1 to B8), SCALE, SOUND, the unit's external-synth patch reference when its SOUND is an external synth (see `external-synths`), MIDI CHANNEL, MIDI MODE, NOTES state, position and stacking order. Every value SHALL survive the round trip exactly at the precision its control offers (VOLUME and WIND to 0.01, DECAY and RESONANCE to 0.1, FREQUENCY to 0.001, positions to the pixel). A link MUST NOT carry SOUND on/off, OUTPUT, the audio output device, the MIDI port, the SEND options, PLAY SOUND IN BROWSER TOO, or any patch's bytes or name. Every unit opened from a link SHALL be on OUTPUT `1–2`. The composition SHALL be in the URL fragment (after `#`), so it is never sent to the server, and a link for 16 units at their longest values, every one on an external synth with a shared patch, MUST be at most 1,000 characters long. A FURIN BELL unit's link SHALL also carry its TUBES and SCALE, so it opens with them kept.

#### Scenario: Round trip
- **WHEN** three units with different settings, tube counts, scales, sounds, channels, MIDI modes, NOTES states and positions are shared and the link is opened in another browser
- **THEN** the same three units appear in the same order with the same values, positions and stacking order

#### Scenario: Patch round trip
- **WHEN** a composition with one unit on CASIO VZ-10M with patch KILLER ORGAN and one on CASIO VZ-10M with INIT is shared and the link is opened in another browser
- **THEN** the first unit opens on CASIO VZ-10M with KILLER ORGAN and the second on CASIO VZ-10M with INIT

#### Scenario: Link length
- **WHEN** 16 units exist, each on CASIO VZ-10M with a shared patch, and SHARE is activated
- **THEN** the link is at most 1,000 characters

#### Scenario: Private to the receiver
- **WHEN** the sender had SOUND on, a MIDI port selected, CC74 sending off, an 18-channel interface chosen and units on OUTPUT `3–4` and `7`, and the receiver opens the link
- **THEN** every unit is muted and on OUTPUT `1–2`, and the receiver's own audio device, MIDI port and SEND options are unchanged

#### Scenario: OUTPUT does not change the link
- **WHEN** a composition is shared, one unit's OUTPUT is changed from `1–2` to `5–6`, and SHARE is activated again
- **THEN** the two links are identical

#### Scenario: Furin round trip
- **WHEN** a composition with a TUBE CHIME unit and a FURIN BELL unit is shared and the link is opened in another browser
- **THEN** the first unit is a TUBE CHIME and the second a FURIN BELL, each with its own settings

#### Scenario: Older link
- **WHEN** a link made before this change is opened
- **THEN** it is not read: the fragment is ignored and removed, and the saved units load unchanged

#### Scenario: Link from before the wider range
- **WHEN** a link made before this change, with units at A4 and C6, is opened
- **THEN** it is ignored like any link made before this change

#### Scenario: Extreme root notes round trip
- **WHEN** a composition with one unit at root note C-1 and one at B8 is shared and the link is opened in another browser
- **THEN** the first unit shows ROOT C, OCTAVE -1, and the second ROOT B, OCTAVE 8

### Requirement: Opening a link
When the page loads with a readable composition in its fragment, the system SHALL show that composition's units instead of the saved ones and SHALL save them over the saved units. Linked values SHALL be checked as saved values are: numbers clamped to their ranges, unknown scales, sounds or MIDI modes replaced by their defaults, malformed patch references handled as `external-synths` says, at most 16 units, and each unit pulled back inside the viewport. After applying it, the system SHALL remove the fragment from the address bar without reloading or adding a history entry, so a later reload shows the composition as edited since. A fragment that cannot be read (wrong format, or a version this page does not read, including links made before this change) SHALL be ignored and removed, and the saved composition SHALL load as usual.

#### Scenario: Link replaces saved units
- **WHEN** a browser has two saved units and opens a link with five units
- **THEN** the five linked units appear, and reloading the page shows those five units

#### Scenario: Fragment cleared
- **WHEN** a link is opened, the user changes CHIME 1's WIND and reloads
- **THEN** the address bar has no fragment and CHIME 1 shows the changed WIND

#### Scenario: Broken link
- **WHEN** the page is opened with a fragment that is not a composition
- **THEN** the saved units load unchanged and the fragment is removed

#### Scenario: Link from before this change
- **WHEN** the page is opened with a link made before this change
- **THEN** it is ignored like a broken link: the saved units load unchanged and the fragment is removed

#### Scenario: Off-screen positions
- **WHEN** a link made on a wide screen is opened on a phone
- **THEN** every unit is fully inside the viewport

### Requirement: Link versions
Every link SHALL start with a format version. From this change on, links made by an earlier version of the page SHALL keep opening with the same values after the page changes, including after scales, sound-font presets or external synths are added. Links made before this change are exempt.

#### Scenario: Old link after an update
- **WHEN** a link made after this change, but before a later format version, is opened
- **THEN** its units open with the values they had when it was made

#### Scenario: New synth added later
- **WHEN** a link with a CASIO VZ-10M unit is opened after another external synth has been added to the page
- **THEN** the unit opens on CASIO VZ-10M with the same patch
