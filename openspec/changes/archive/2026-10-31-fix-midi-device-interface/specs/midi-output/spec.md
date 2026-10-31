# Spec Delta

## Purpose

Sends the chime's strikes, voice program and filter settings to a hardware or virtual MIDI device from the browser through Web MIDI. Lets the user connect, pick a port and channel, confirm the device is receiving, and recover from hot-plugging and permission problems.

## ADDED Requirements

### Requirement: Web MIDI support detection
The system SHALL decide whether Web MIDI is supported from the browser the page runs in, not from the server-rendered markup. Where the browser exposes Web MIDI, CONNECT MIDI MUST be enabled once the page is interactive. Where it does not, CONNECT MIDI MUST be disabled and a message MUST say that the browser has no Web MIDI and name supported browsers.

#### Scenario: Supported browser after hydration
- **WHEN** the page loads in a browser that exposes `navigator.requestMIDIAccess` (for example desktop Chrome)
- **THEN** CONNECT MIDI is enabled once the page is interactive
- **AND** no "no Web MIDI" message is shown

#### Scenario: Unsupported browser
- **WHEN** the page loads in a browser without Web MIDI (for example Safari)
- **THEN** CONNECT MIDI is disabled
- **AND** a message says the browser has no Web MIDI and suggests Chrome, Edge or Firefox on a computer

### Requirement: Permission requested only from the connect action
The system MUST NOT request MIDI access on page load. It SHALL request access, without SysEx, only when the user activates CONNECT MIDI.

#### Scenario: No prompt on load
- **WHEN** the page loads and the user does not activate CONNECT MIDI
- **THEN** MIDI access is never requested

#### Scenario: Connect click requests access
- **WHEN** the user activates CONNECT MIDI
- **THEN** the system requests MIDI access without SysEx
- **AND** a message shows that access is being requested until the request settles

### Requirement: Permission failure handling
When the browser refuses MIDI access, the system SHALL show a message saying access was blocked and how to allow it in the browser's site settings. CONNECT MIDI MUST stay available so the user can try again. Other failures SHALL show the browser's error message, and CONNECT MIDI MUST stay available.

#### Scenario: User blocks or dismisses the prompt
- **WHEN** the access request is rejected with `NotAllowedError` or `SecurityError`
- **THEN** a message says MIDI access was blocked and tells the user to allow MIDI for this site in the browser's site settings
- **AND** CONNECT MIDI is still shown and can be activated again

#### Scenario: Retry after allowing
- **WHEN** the user allows MIDI in site settings and activates CONNECT MIDI again
- **THEN** access is granted and the output list is shown

#### Scenario: Other failure
- **WHEN** the access request fails with any other error
- **THEN** the browser's error message is shown (or "MIDI access failed." if it has none)
- **AND** CONNECT MIDI is still available

### Requirement: Output port listing
After access is granted, the system SHALL list every connected MIDI output port by name, with the manufacturer when one is reported, plus a NONE choice. The list MUST update when ports are added or removed. When no outputs exist, a message SHALL explain how to plug in an interface or start a virtual port (IAC Driver on macOS, loopMIDI on Windows).

#### Scenario: Ports listed after connect
- **WHEN** access is granted and two output ports are connected
- **THEN** the port picker shows NONE and both ports by name
- **AND** the MIDI OUT row reads `2 PORTS`

#### Scenario: Port added while connected
- **WHEN** a new output port is connected after access was granted
- **THEN** it appears in the picker without a page reload

#### Scenario: No outputs
- **WHEN** access is granted and no output ports exist
- **THEN** a message explains how to connect an interface or start a virtual port

### Requirement: Port selection and memory
The user SHALL be able to choose one output port, or NONE. The name of the chosen port MUST be saved in browser storage. On connect, the system SHALL select the saved port automatically if one with that name is listed. Otherwise, if exactly one port is listed, it SHALL select that port. Selecting a port SHALL send the current program change and filter CCs when those options are on.

#### Scenario: Remembered port selected on connect
- **WHEN** the user connects and a port with the saved name is listed
- **THEN** that port is selected without the user choosing it

#### Scenario: Single port auto-selected
- **WHEN** the user connects, no saved port matches, and exactly one port is listed
- **THEN** that port is selected

#### Scenario: Selecting a port sends the current setup
- **WHEN** the user selects a port while SEND PROGRAM CHANGE and SEND FILTER AS CC74 / CC71 are on
- **THEN** bank select (CC0, CC32), program change, CC74 and CC71 are sent on the chosen channel

#### Scenario: Selecting NONE
- **WHEN** the user selects NONE
- **THEN** sounding notes on the previous port are ended
- **AND** strikes are no longer sent to any port

### Requirement: Disconnect and reconnect of the selected port
When the selected port disconnects, the system SHALL stop sending to it, end any timers for notes it was sounding, and show that the remembered port is disconnected rather than silently switching to NONE. When a port with the remembered name connects again while access is granted, the system SHALL select it again automatically and resend program change and filter CCs when those options are on.

#### Scenario: Selected device unplugged
- **WHEN** the selected output port disconnects
- **THEN** no further messages are sent to it
- **AND** the panel shows the remembered port name as disconnected

#### Scenario: Device plugged back in
- **WHEN** a port with the remembered name connects again
- **THEN** it is selected again without user action
- **AND** program change and filter CCs are resent when those options are on
- **AND** later strikes are sent to it

#### Scenario: Remembered device plugged in after connect
- **WHEN** access was granted with no port matching the saved name, and such a port connects later
- **THEN** it is selected automatically

### Requirement: Channel selection
The user SHALL be able to choose MIDI channel 1–16, with channel 10 labelled GM DRUMS. The channel MUST be saved in browser storage and restored on load. Changing the channel while notes are sounding SHALL end those notes on the old channel first.

#### Scenario: Channel persisted
- **WHEN** the user picks channel 5 and reloads the page
- **THEN** channel 5 is selected

#### Scenario: Channel change ends sounding notes
- **WHEN** notes are sounding on channel 1 and the user changes to channel 2
- **THEN** note-offs for those notes are sent on channel 1 before later notes go out on channel 2

### Requirement: Strikes sent as notes
Every chime strike, from the wind or from a tap, SHALL send a note-on on the chosen port and channel. The note SHALL be the struck tube's note and the velocity the strike's velocity, clamped to 1–127. A note-off SHALL follow after the current DECAY time. If the same note is struck again while it is sounding, its note-off MUST be sent before the new note-on.

#### Scenario: Strike sends a note
- **WHEN** a port is selected on channel 1 and tube 0 is struck at velocity 80
- **THEN** `0x90, <tube 0 note>, 80` is sent
- **AND** `0x80, <tube 0 note>, 0` is sent after the DECAY time

#### Scenario: Re-strike of a sounding note
- **WHEN** a note is struck again before its note-off
- **THEN** a note-off for that note is sent right before the new note-on

#### Scenario: No port selected
- **WHEN** no port is selected
- **THEN** no MIDI messages are sent on strikes

### Requirement: Program change and filter CC output
When SEND PROGRAM CHANGE is on, the system SHALL send bank select and program change for the current voice whenever the voice, port or channel changes. When SEND FILTER AS CC74 / CC71 is on, the system SHALL send CC74 (cutoff slider, 0–127) and CC71 (Q mapped to 0–127) whenever the filter, port or channel changes. Both options MUST be saved in browser storage.

#### Scenario: Voice change sends program
- **WHEN** SEND PROGRAM CHANGE is on and the user picks a different voice
- **THEN** CC0, CC32 and a program change for that voice are sent on the chosen channel

#### Scenario: Filter move sends CCs
- **WHEN** SEND FILTER AS CC74 / CC71 is on and the user moves the cutoff slider
- **THEN** CC74 with the scaled slider value is sent on the chosen channel

#### Scenario: Options off
- **WHEN** both options are off
- **THEN** no program change or CC74/CC71 messages are sent

### Requirement: Test note
While a port is selected, a TEST NOTE control SHALL send one note-on for the first tube's current note at velocity 100 on the chosen channel, followed by its note-off after 0.5 seconds, whether or not the wind is blowing. TEST NOTE MUST be unavailable while no port is selected.

#### Scenario: Test note sent
- **WHEN** a port is selected on channel 3 and the user activates TEST NOTE
- **THEN** `0x92, <tube 0 note>, 100` is sent
- **AND** `0x82, <tube 0 note>, 0` is sent about 0.5 seconds later

#### Scenario: No port selected
- **WHEN** no port is selected
- **THEN** TEST NOTE cannot be activated

### Requirement: Panic
A PANIC control SHALL end every note the system is sounding on the chosen port. It sends a note-off for each sounding note, then All Notes Off (CC123) and All Sound Off (CC120), on the chosen channel.

#### Scenario: Panic while notes sound
- **WHEN** notes are sounding and the user activates PANIC
- **THEN** a note-off is sent for each sounding note
- **AND** `0xBn 123 0` and `0xBn 120 0` are sent on the chosen channel
- **AND** no delayed note-offs for those notes are sent afterwards

### Requirement: Connection status display
The panel SHALL show the MIDI state in plain text in the existing two-color style. The states are: not connected; connected with no port chosen; a port chosen, with its name, its connection state (connected or disconnected) and whether the port is open; and the channel with a count of notes sent this session.

#### Scenario: Port chosen and open
- **WHEN** a port is selected, connected, and has been opened by sending
- **THEN** the status shows the port name, that it is connected and open, the channel, and the number of notes sent

#### Scenario: Port chosen but disconnected
- **WHEN** the remembered port is disconnected
- **THEN** the status shows its name and that it is disconnected

#### Scenario: Not yet connected
- **WHEN** the user has not activated CONNECT MIDI
- **THEN** the status reads that MIDI is not connected

### Requirement: Browser sound alongside MIDI
The user SHALL be able to turn the browser's own sound on or off while MIDI output is active, without stopping the simulation or MIDI output.

#### Scenario: Browser sound off
- **WHEN** PLAY SOUND IN BROWSER TOO is turned off while a port is selected
- **THEN** strikes still send MIDI notes
- **AND** the browser makes no sound for them
