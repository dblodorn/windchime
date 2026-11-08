# audio-output Specification

## Purpose
Lets the browser's sound go to any audio output device the operating system offers, including multichannel USB class-compliant interfaces, and sends each chime unit to its own channels of that device.

## Requirements

### Requirement: AUDIO button
The page SHALL show an AUDIO button fixed to the lower right, immediately left of the MIDI button and right of the RESET button, 8 CSS px from each, with the same height, width, border and style as those buttons, labelled with the text `AUDIO` in the UI font and no icon. It SHALL stay above every unit, invert on hover, show the dashed keyboard focus outline, and activate with a click, a tap, Enter or Space. Its accessible name SHALL be "AUDIO", and it SHALL announce that it opens a dialog. On phones and tablets the AUDIO button MUST NOT be shown (see "Not on phones and tablets").

#### Scenario: Placement
- **WHEN** the page loads in a desktop browser at any viewport width
- **THEN** SHARE, RESET, AUDIO and MIDI sit in one row at the lower right, in that order from left to right, 8 px apart, with the same height, width and bottom edge

#### Scenario: Keyboard
- **WHEN** the AUDIO button has focus and the user presses Enter
- **THEN** the AUDIO OUT dialog opens

### Requirement: AUDIO OUT dialog
Activating the AUDIO button SHALL open a modal dialog whose accessible name is "AUDIO OUT", styled like the MIDI OUT dialog. It SHALL hold, in this order: the DEVICE select, the CHANNELS row (`CHANNELS ....... n`, the number of output channels the current device offers; before browser sound has started on this visit, the count last seen for that device in this browser, or 2 when none is known), the SHOW DEVICE NAMES button while device names are hidden, and the messages for a browser that cannot choose a device. Per-unit OUTPUT is not in the dialog; it is in each unit's settings popover. While the dialog is open, keyboard focus SHALL stay inside it and the page behind MUST NOT respond to pointer input, but every chime SHALL keep animating and sounding. It SHALL close with its CLOSE button, Escape, or a tap outside it, and focus SHALL return to the AUDIO button. Closing MUST NOT change any audio setting. Opening the dialog MUST NOT ask the browser for any permission.

#### Scenario: Open
- **WHEN** the user activates the AUDIO button
- **THEN** a dialog named "AUDIO OUT" opens showing the DEVICE select with SYSTEM DEFAULT chosen on a first visit, and the CHANNELS row

#### Scenario: Close
- **WHEN** the dialog is open and the user presses Escape
- **THEN** it closes, focus returns to the AUDIO button, and the chosen device is unchanged

#### Scenario: No permission on open
- **WHEN** the user opens and closes the dialog without activating any control
- **THEN** the browser has not asked for any permission

### Requirement: Choosing the output device
The DEVICE select SHALL list SYSTEM DEFAULT first, then every audio output device the browser reports, by name. Choosing a device SHALL move the sound of every unit to it, at once and without stopping any simulation, MIDI output or sounding unit. The choice SHALL be remembered in this browser and used on the next visit when that device is present. Any USB class-compliant or otherwise system-installed output device SHALL work; no device SHALL need code of its own. Where the browser cannot send page audio to a chosen device, the DEVICE select SHALL be disabled at SYSTEM DEFAULT, and the dialog SHALL say `THIS BROWSER PLAYS THROUGH THE SYSTEM OUTPUT. CHOOSE THE DEVICE IN YOUR SYSTEM SETTINGS.`

#### Scenario: Choose an interface
- **WHEN** an 18-channel interface is connected and the user chooses it in DEVICE while two units are sounding
- **THEN** both units are heard through the interface, they keep sounding without a restart, and CHANNELS reads 18

#### Scenario: Remembered
- **WHEN** the user chose an interface, reloads the page with it still connected, and turns SOUND on
- **THEN** the sound comes out of that interface

#### Scenario: Browser without device choice
- **WHEN** the dialog is opened in a browser that cannot send page audio to a chosen device
- **THEN** DEVICE shows SYSTEM DEFAULT, disabled, and the dialog shows the system output message

### Requirement: Device names
Where the browser hides output device names until the page has a media permission, the DEVICE select SHALL offer SYSTEM DEFAULT only, and the dialog SHALL show a SHOW DEVICE NAMES button. The permission MUST be asked only when the user activates SHOW DEVICE NAMES, never on load or when the dialog opens. The page MUST NOT record or keep any input it is given access to; any input opened to get the permission SHALL be closed at once. If the permission is refused, the dialog SHALL say `DEVICE NAMES NOT AVAILABLE` and SYSTEM DEFAULT SHALL still work.

#### Scenario: Ask from the button
- **WHEN** device names are hidden and the user activates SHOW DEVICE NAMES and allows it
- **THEN** the DEVICE select lists the output devices by name, the button is no longer shown, and no microphone input stays open

#### Scenario: Refused
- **WHEN** the user refuses the permission
- **THEN** the dialog shows `DEVICE NAMES NOT AVAILABLE`, and the sound keeps playing through the current device

### Requirement: Device unplugged and replugged
When the chosen device disconnects, the sound SHALL move to the system default output, and the DEVICE select SHALL show the chosen device marked DISCONNECTED, still selected but not choosable again until it returns. When a device with the same name connects again, the sound SHALL move back to it without user action. The list SHALL update when devices are connected or disconnected while the page is open.

#### Scenario: Unplug
- **WHEN** units are sounding through a chosen interface and it is unplugged
- **THEN** they keep sounding through the system default output, and DEVICE shows the interface marked DISCONNECTED

#### Scenario: Replug
- **WHEN** the same interface is plugged back in
- **THEN** the sound moves back to it and DEVICE shows it without the DISCONNECTED mark

### Requirement: Per-unit OUTPUT
Each unit SHALL have an OUTPUT row in its settings popover, directly below SOUNDFONT, a single-choice select that offers the stereo pairs `1–2`, `3–4`, … and then the single channels `1`, `2`, …, up to the current device's channel count (a pair is offered only when both its channels exist). A first-visit unit, a unit made by RESET, and every unit opened from a share link or a saved composition SHALL use `1–2`. A unit on a pair SHALL carry its stereo sound on that pair, left on the lower channel and right on the higher; a unit on a single channel SHALL be heard on that channel only, its stereo sound mixed to one channel. A unit's sound MUST NOT reach any channel other than its OUTPUT, and changing one unit's OUTPUT MUST NOT change any other unit's sound. Several units MAY use the same OUTPUT, or overlapping ones (`1–2` and `1`); their sound SHALL be mixed on the channels they share, and choosing an output another unit uses MUST NOT change either unit's OUTPUT. Changing OUTPUT SHALL take effect at once, without stopping the unit's sounding notes. OUTPUT MUST NOT change the unit's MIDI output.

#### Scenario: Options follow the device
- **WHEN** the chosen device has 18 channels and the user opens OUTPUT on a unit
- **THEN** it lists `1–2` through `17–18`, then `1` through `18`, with `1–2` marked on a first visit

#### Scenario: Separate channels
- **WHEN** CHIME 1 is on `1–2` and CHIME 2 is on `5`, and both strike
- **THEN** CHIME 1 is heard only on channels 1 and 2, and CHIME 2 only on channel 5

#### Scenario: Shared output
- **WHEN** CHIME 1 and CHIME 2 are both on `3–4`, CHIME 3 is on `3`, and all three strike
- **THEN** channel 3 carries all three units mixed, channel 4 carries CHIME 1 and CHIME 2 mixed, no other channel carries any of them, and both OUTPUT rows still read `3–4`

#### Scenario: Stereo device
- **WHEN** the device has 2 channels
- **THEN** OUTPUT offers `1–2`, `1` and `2`

#### Scenario: MIDI unchanged
- **WHEN** a MIDI port is live and the user changes a unit's OUTPUT from `1–2` to `3–4`
- **THEN** the unit's MIDI notes, channel and velocities are unchanged

### Requirement: OUTPUT beyond the current device
When a unit's OUTPUT names a channel the current device does not have (a smaller device chosen, the chosen device unplugged, or a stored OUTPUT from another setup), the unit SHALL be heard on `1–2` instead of going silent, and its OUTPUT row SHALL show its stored value marked UNAVAILABLE. Its stored OUTPUT SHALL be kept, and the unit SHALL return to it as soon as the current device has that channel again. Choosing an available option SHALL replace the stored value.

#### Scenario: Smaller device
- **WHEN** a unit is on `7–8` and the user chooses a 2-channel device
- **THEN** the unit is heard on channels 1 and 2, and its OUTPUT row shows `7–8` marked UNAVAILABLE

#### Scenario: Back to the interface
- **WHEN** the user then chooses an 8-channel device again
- **THEN** the unit is heard on channels 7 and 8 again

### Requirement: Output level and dynamics per channel
The page's output level control and compression SHALL apply to every channel, but MUST NOT mix channels together: sound on one channel MUST NOT appear on any other, and two-channel playback through `1–2` SHALL sound as it did before this change.

#### Scenario: Stereo unchanged
- **WHEN** one unit plays on `1–2` through a 2-channel device
- **THEN** it sounds the same as before this change, at the same level

#### Scenario: No bleed
- **WHEN** a single unit on channel 3 strikes loudly through an 8-channel device
- **THEN** channels 1, 2 and 4 to 8 stay silent

### Requirement: Not on phones and tablets
On a device whose every input is touch and none can hover (phones, and tablets without a mouse or trackpad), the AUDIO button and every unit's OUTPUT row MUST NOT be shown or reachable, including by keyboard and assistive technology. The lower-right row SHALL then be SHARE, RESET and MIDI, in that order, 8 CSS px apart and 76 CSS px wide, and the settings popover SHALL hold eleven rows (no OUTPUT). Every unit SHALL play through the device's own output on `1–2`. The server render and the first client render MUST match on every device, so the choice MUST be made by the device's media features, not by script during render. A desktop browser in a narrow window, a laptop with a touchscreen, and a tablet with a mouse or trackpad attached SHALL still show AUDIO and OUTPUT.

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

### Requirement: Audio settings stay in this browser
The chosen device and every unit's OUTPUT SHALL be stored in this browser only. They MUST NOT be sent to the server, carried by a share link, or included in a saved composition, and opening a link or a saved composition MUST NOT change the chosen device. RESET MUST NOT change the chosen device.

#### Scenario: Link from another setup
- **WHEN** a composition shared by someone using an 18-channel interface is opened on a laptop
- **THEN** every unit is on `1–2` and the laptop's chosen device is unchanged

#### Scenario: Reset keeps the device
- **WHEN** the user has chosen an interface and activates RESET
- **THEN** the interface is still chosen, and CHIME 1 is on `1–2`
