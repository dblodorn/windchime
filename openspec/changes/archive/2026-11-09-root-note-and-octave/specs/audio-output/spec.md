## MODIFIED Requirements

### Requirement: Not on phones and tablets
On a device whose every input is touch and none can hover (phones, and tablets without a mouse or trackpad), the AUDIO button and every unit's OUTPUT row MUST NOT be shown or reachable, including by keyboard and assistive technology. The lower-right row SHALL then be SHARE, RESET and MIDI, in that order, 8 CSS px apart and 76 CSS px wide, and the settings popover SHALL hold thirteen rows for a tube chime and eleven for a furin bell (no OUTPUT). Every unit SHALL play through the device's own output on `1–2`. The server render and the first client render MUST match on every device, so the choice MUST be made by the device's media features, not by script during render. A desktop browser in a narrow window, a laptop with a touchscreen, and a tablet with a mouse or trackpad attached SHALL still show AUDIO and OUTPUT.

#### Scenario: Touchscreen laptop
- **WHEN** the page is opened on a laptop with a touchscreen and a trackpad
- **THEN** the AUDIO button and each unit's OUTPUT row are shown and work by touch and by pointer

#### Scenario: Phone
- **WHEN** the page is opened on a phone
- **THEN** the lower-right row shows SHARE, RESET and MIDI, there is no AUDIO button, and a unit's settings have no OUTPUT row

#### Scenario: Narrow desktop window
- **WHEN** the page is opened in a desktop browser 375 px wide with a mouse
- **THEN** the lower-right row shows SHARE, RESET, AUDIO and MIDI, and each unit's settings have an OUTPUT row

#### Scenario: No hydration mismatch
- **WHEN** the production page loads on a phone
- **THEN** the console shows no hydration or React errors
