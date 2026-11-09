## MODIFIED Requirements

### Requirement: What a link carries
A link SHALL carry, for each unit in page order: INSTRUMENT, VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, MIDI CHANNEL, MIDI MODE, NOTES state, position and stacking order. Every value SHALL survive the round trip exactly at the precision its control offers (VOLUME and WIND to 0.01, DECAY and RESONANCE to 0.1, FREQUENCY to 0.001, positions to the pixel). A link MUST NOT carry SOUND, OUTPUT, the audio output device, the MIDI port, the SEND options or PLAY SOUND IN BROWSER TOO. Every unit opened from a link SHALL be on OUTPUT `1–2`. The composition SHALL be in the URL fragment (after `#`), so it is never sent to the server, and a link for 16 units at their longest values MUST be at most 1,000 characters long. Links made before this change SHALL open exactly as before, with every unit a TUBE CHIME, and a composition of tube chimes SHALL give the same link as before this change. A FURIN BELL unit's link SHALL also carry its TUBES and SCALE, so it opens with them kept.

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

#### Scenario: Furin round trip
- **WHEN** a composition with a TUBE CHIME unit and a FURIN BELL unit is shared and the link is opened in another browser
- **THEN** the first unit is a TUBE CHIME and the second a FURIN BELL, each with its own settings

#### Scenario: Older link
- **WHEN** a link made before this change is opened
- **THEN** every unit opens as a TUBE CHIME with the values it had when the link was made
