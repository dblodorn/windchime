# Spec Delta

## MODIFIED Requirements

### Requirement: SHARE button
The page SHALL show a SHARE button fixed to the lower right, immediately left of the RESET button (which sits immediately left of the AUDIO button, itself immediately left of the MIDI button; on phones and tablets, which have no AUDIO button, RESET sits immediately left of MIDI), 8 CSS px from it, with the same height, width, border and style as the MIDI button, labelled with the text `SHARE` in the UI font and no icon. It SHALL stay above every unit and SHALL be reachable by keyboard. Activating it SHALL copy a link to the current composition to the clipboard and change its label to `COPIED` for about 1.5 seconds, then back to `SHARE`. Where the clipboard cannot be written and the system share sheet is available, it SHALL open the share sheet with the link instead. Where neither works, it SHALL show the link in the address bar so it can be copied by hand.

#### Scenario: Placement and size
- **WHEN** the page is shown in a desktop browser
- **THEN** a SHARE button sits left of the RESET button, which sits left of the AUDIO button, which sits left of the MIDI button, all four with the same height, width and bottom edge

#### Scenario: Copy the link
- **WHEN** the user activates SHARE and the clipboard is available
- **THEN** the clipboard holds a link to the page whose fragment encodes the composition, and the button reads COPIED, then SHARE again

#### Scenario: No clipboard
- **WHEN** the clipboard cannot be written and the browser has a share sheet
- **THEN** the share sheet opens with the link

### Requirement: What a link carries
A link SHALL carry, for each unit in page order: VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, MIDI CHANNEL, MIDI MODE, NOTES state, position and stacking order. Every value SHALL survive the round trip exactly at the precision its control offers (VOLUME and WIND to 0.01, DECAY and RESONANCE to 0.1, FREQUENCY to 0.001, positions to the pixel). A link MUST NOT carry SOUND, OUTPUT, the audio output device, the MIDI port, the SEND options or PLAY SOUND IN BROWSER TOO. Every unit opened from a link SHALL be on OUTPUT `1–2`. The composition SHALL be in the URL fragment (after `#`), so it is never sent to the server, and a link for 16 units at their longest values MUST be at most 1,000 characters long. Links made before this change SHALL open exactly as before, and a composition SHALL give the same link as before this change.

#### Scenario: Round trip
- **WHEN** three units with different settings, tube counts, scales, sound fonts, channels, MIDI modes, NOTES states and positions are shared and the link is opened in another browser
- **THEN** the same three units appear in the same order with the same values, positions and stacking order

#### Scenario: Link length
- **WHEN** 16 units exist and SHARE is activated
- **THEN** the link is at most 1,000 characters

#### Scenario: Private to the receiver
- **WHEN** the sender had SOUND on, a MIDI port selected, CC74 sending off, an 18-channel interface chosen and units on OUTPUT `3–4` and `7`, and the receiver opens the link
- **THEN** every unit is muted and on OUTPUT `1–2`, and the receiver's own audio device, MIDI port and SEND options are unchanged

#### Scenario: OUTPUT does not change the link
- **WHEN** a composition is shared, one unit's OUTPUT is changed from `1–2` to `5–6`, and SHARE is activated again
- **THEN** the two links are identical
