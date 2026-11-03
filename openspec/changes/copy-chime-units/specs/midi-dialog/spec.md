# Spec Delta

## MODIFIED Requirements

### Requirement: MIDI dialog holds the MIDI OUT controls
Activating the MIDI button SHALL open a modal dialog titled MIDI OUT. The dialog SHALL contain the MIDI controls shared by every unit, with the same labels, behavior and order as before: CONNECT MIDI (or, once connected, the MIDI OUT port select), SEND PROGRAM CHANGE, SEND FILTER AS CC74 / CC71, PLAY SOUND IN BROWSER TOO, TEST NOTE, PANIC, and the messages for an unsupported browser, blocked or failed access, and no outputs. The per-unit CHANNEL select is not in the dialog; it is in each unit's settings popover. These controls MUST NOT also appear outside the dialog. The dialog's accessible name SHALL be "MIDI OUT". Opening the dialog MUST NOT request MIDI access by itself; access is still requested only when CONNECT MIDI is activated.

#### Scenario: Sheet without MIDI controls
- **WHEN** the page loads with the dialog closed
- **THEN** no CONNECT MIDI button, MIDI OUT select, MIDI checkbox, TEST NOTE or PANIC control is visible on the page

#### Scenario: Open the dialog
- **WHEN** the user activates the MIDI button
- **THEN** a dialog named "MIDI OUT" opens and shows CONNECT MIDI with its help text

#### Scenario: Opening does not ask for permission
- **WHEN** the user opens the dialog and does not activate CONNECT MIDI
- **THEN** the browser has not been asked for MIDI access

#### Scenario: Controls after connecting
- **WHEN** the user activates CONNECT MIDI in the dialog and access is granted
- **THEN** the dialog shows the MIDI OUT port select, the three checkboxes, TEST NOTE and PANIC, and no CHANNEL select, and they behave as specified for MIDI output

### Requirement: Modal behavior and closing
While the dialog is open, keyboard focus SHALL move into it and stay inside it, and the page behind MUST NOT scroll or respond to pointer input. A select opened inside the dialog SHALL show its options above the dialog. The dialog SHALL close when the user activates its CLOSE button, presses Escape, or taps or clicks outside it. When it closes, focus SHALL return to the MIDI button.

#### Scenario: Focus moves in
- **WHEN** the dialog opens from a keyboard activation of the MIDI button
- **THEN** focus is on a control inside the dialog, and Tab cycles only through the dialog's controls

#### Scenario: Close three ways
- **WHEN** the user presses Escape, activates CLOSE, or clicks outside the dialog
- **THEN** the dialog closes and focus is on the MIDI button

#### Scenario: Select inside the dialog
- **WHEN** the user opens the MIDI OUT select inside the dialog
- **THEN** its option list is shown on top of the dialog and an option can be chosen
- **AND** choosing an option closes the list but leaves the dialog open

### Requirement: Closing leaves MIDI running
Closing the dialog SHALL only hide the controls. MIDI access, the selected port and the options MUST stay as they were, and strikes on every unit MUST keep sending notes to the selected port while the dialog is closed. Reopening the dialog SHALL show the current state, without asking to connect again.

#### Scenario: Notes while closed
- **WHEN** a port is selected, the dialog is closed, and the user taps a tube on a unit on channel 2
- **THEN** a note-on for that tube is sent on the chosen port on channel 2

#### Scenario: Reopen keeps state
- **WHEN** the user connects, picks a port, turns SEND PROGRAM CHANGE off, closes the dialog and opens it again
- **THEN** the dialog shows the same port with SEND PROGRAM CHANGE off, and CONNECT MIDI is not shown
