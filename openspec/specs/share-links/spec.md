# share-links Specification

## Purpose
Lets a composition (every chime unit and its settings) be shared as a link: SHARE copies a URL that opens the same units on any device, in place of whatever that browser had saved.

## Requirements

### Requirement: SHARE button
The page SHALL show a SHARE button fixed to the lower right, immediately left of the RESET button (which sits immediately left of the MIDI button), 8 CSS px from it, with the same height, width, border and style as the MIDI button, labelled with the text `SHARE` in the UI font and no icon. It SHALL stay above every unit and SHALL be reachable by keyboard. Activating it SHALL copy a link to the current composition to the clipboard and change its label to `COPIED` for about 1.5 seconds, then back to `SHARE`. Where the clipboard cannot be written and the system share sheet is available, it SHALL open the share sheet with the link instead. Where neither works, it SHALL show the link in the address bar so it can be copied by hand.

#### Scenario: Placement and size
- **WHEN** the page is shown
- **THEN** a SHARE button sits left of the RESET button, which sits left of the MIDI button, all three with the same height, width and bottom edge

#### Scenario: Copy the link
- **WHEN** the user activates SHARE and the clipboard is available
- **THEN** the clipboard holds a link to the page whose fragment encodes the composition, and the button reads COPIED, then SHARE again

#### Scenario: No clipboard
- **WHEN** the clipboard cannot be written and the browser has a share sheet
- **THEN** the share sheet opens with the link

### Requirement: What a link carries
A link SHALL carry, for each unit in page order: VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, MIDI CHANNEL, MIDI MODE, NOTES state, position and stacking order. Every value SHALL survive the round trip exactly at the precision its control offers (VOLUME and WIND to 0.01, DECAY and RESONANCE to 0.1, FREQUENCY to 0.001, positions to the pixel). A link MUST NOT carry SOUND, the MIDI port, the SEND options or PLAY SOUND IN BROWSER TOO. The composition SHALL be in the URL fragment (after `#`), so it is never sent to the server, and a link for 16 units at their longest values MUST be at most 1,000 characters long.

#### Scenario: Round trip
- **WHEN** three units with different settings, tube counts, scales, sound fonts, channels, MIDI modes, NOTES states and positions are shared and the link is opened in another browser
- **THEN** the same three units appear in the same order with the same values, positions and stacking order

#### Scenario: Link length
- **WHEN** 16 units exist and SHARE is activated
- **THEN** the link is at most 1,000 characters

#### Scenario: Private to the receiver
- **WHEN** the sender had SOUND on, a MIDI port selected and CC74 sending off, and the receiver opens the link
- **THEN** every unit is muted, and the receiver's own MIDI port and SEND options are unchanged

### Requirement: Opening a link
When the page loads with a readable composition in its fragment, the system SHALL show that composition's units instead of the saved ones and SHALL save them over the saved units. Linked values SHALL be checked as saved values are: numbers clamped to their ranges, unknown scales, sound fonts or MIDI modes replaced by their defaults, at most 16 units, and each unit pulled back inside the viewport. After applying it, the system SHALL remove the fragment from the address bar without reloading or adding a history entry, so a later reload shows the composition as edited since. A fragment that cannot be read (wrong format or an unknown version) SHALL be ignored and removed, and the saved composition SHALL load as usual.

#### Scenario: Link replaces saved units
- **WHEN** a browser has two saved units and opens a link with five units
- **THEN** the five linked units appear, and reloading the page shows those five units

#### Scenario: Fragment cleared
- **WHEN** a link is opened, the user changes CHIME 1's WIND and reloads
- **THEN** the address bar has no fragment and CHIME 1 shows the changed WIND

#### Scenario: Broken link
- **WHEN** the page is opened with a fragment that is not a composition
- **THEN** the saved units load unchanged and the fragment is removed

#### Scenario: Off-screen positions
- **WHEN** a link made on a wide screen is opened on a phone
- **THEN** every unit is fully inside the viewport

### Requirement: Link versions
Every link SHALL start with a format version. Links made by an earlier version of the page SHALL keep opening with the same values after the page changes, including after scales or sound-font presets are added.

#### Scenario: Old link after an update
- **WHEN** a link made before a later format version is opened
- **THEN** its units open with the values they had when it was made
