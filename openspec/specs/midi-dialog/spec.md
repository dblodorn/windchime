# midi-dialog Specification

## Purpose

Defines how a person reaches the MIDI OUT controls: a fixed button with the MIDI logo in the lower-right corner of the viewport opens a modal dialog that holds every MIDI setting, so the parameter sheet stays about the chime and MIDI stays one tap away.

## Requirements

### Requirement: Fixed MIDI button
The page SHALL show a MIDI button fixed to the lower-right corner of the viewport, 16 CSS px from the right and bottom edges, plus the device's safe-area inset where there is one. It MUST stay in that position while the page scrolls, at every viewport width. The button SHALL show the MIDI logo (the block-letter "MIDI" wordmark of the MIDI Manufacturers Association) as a vector drawing in pure black on white, inside a square 1px black border. Its touch target MUST be at least 44×44 CSS px. Its accessible name SHALL be "MIDI", and it SHALL announce that it opens a dialog. On hover it SHALL invert (white logo on black). It SHALL show the dashed keyboard focus outline used by other controls, and activate with a click, a tap, Enter or Space.

#### Scenario: Anchored lower right
- **WHEN** the page is shown at 1280 px and at 375 px wide
- **THEN** the MIDI button's right and bottom edges are 16 px from the viewport's right and bottom edges
- **AND** after scrolling to the end of the page, the button is still at the same viewport position

#### Scenario: Logo in two colors
- **WHEN** the button is rendered at rest
- **THEN** it shows the MIDI logo, and every pixel of the button is black or white

#### Scenario: Touch target
- **WHEN** the button's size is measured
- **THEN** it is at least 44 CSS px wide and 44 CSS px tall

#### Scenario: Accessible name
- **WHEN** the button is found by role and name
- **THEN** a button named "MIDI" exists, and it exposes that it opens a dialog

### Requirement: Button shows when MIDI is live
While a MIDI output port is selected and connected, the MIDI button SHALL show inverted colors (white logo on black) even without hover. In every other state (not connected, no port chosen, remembered port disconnected), it SHALL show the black logo on white. The state change MUST follow the port: plugging out the selected port returns the button to black on white, and plugging it back in inverts it again.

#### Scenario: Not connected
- **WHEN** the page loads and CONNECT MIDI has not been used
- **THEN** the button shows a black logo on white

#### Scenario: Port live
- **WHEN** MIDI access is granted and a connected port is selected
- **THEN** the button shows a white logo on black

#### Scenario: Port unplugged
- **WHEN** the selected port disconnects
- **THEN** the button returns to a black logo on white
- **AND** when a port with the same name connects again, it inverts again

### Requirement: MIDI dialog holds the MIDI OUT controls
Activating the MIDI button SHALL open a modal dialog titled MIDI OUT. The dialog SHALL contain every MIDI OUT control and message, with the same labels, behavior and order as before: CONNECT MIDI (or, once connected, the MIDI OUT port select), CHANNEL, SEND PROGRAM CHANGE, SEND FILTER AS CC74 / CC71, PLAY SOUND IN BROWSER TOO, TEST NOTE, PANIC, and the messages for an unsupported browser, blocked or failed access, and no outputs. These controls MUST NOT also appear on the parameter sheet. The dialog's accessible name SHALL be "MIDI OUT". Opening the dialog MUST NOT request MIDI access by itself; access is still requested only when CONNECT MIDI is activated.

#### Scenario: Sheet without MIDI controls
- **WHEN** the page loads with the dialog closed
- **THEN** no CONNECT MIDI button, MIDI OUT select, CHANNEL select, MIDI checkbox, TEST NOTE or PANIC control is visible on the page

#### Scenario: Open the dialog
- **WHEN** the user activates the MIDI button
- **THEN** a dialog named "MIDI OUT" opens and shows CONNECT MIDI with its help text

#### Scenario: Opening does not ask for permission
- **WHEN** the user opens the dialog and does not activate CONNECT MIDI
- **THEN** the browser has not been asked for MIDI access

#### Scenario: Controls after connecting
- **WHEN** the user activates CONNECT MIDI in the dialog and access is granted
- **THEN** the dialog shows the MIDI OUT port select, CHANNEL, the three checkboxes, TEST NOTE and PANIC, and they behave as specified for MIDI output

### Requirement: Modal behavior and closing
While the dialog is open, keyboard focus SHALL move into it and stay inside it, and the page behind MUST NOT scroll or respond to pointer input. A select opened inside the dialog SHALL show its options above the dialog. The dialog SHALL close when the user activates its CLOSE button, presses Escape, or taps or clicks outside it. When it closes, focus SHALL return to the MIDI button.

#### Scenario: Focus moves in
- **WHEN** the dialog opens from a keyboard activation of the MIDI button
- **THEN** focus is on a control inside the dialog, and Tab cycles only through the dialog's controls

#### Scenario: Close three ways
- **WHEN** the user presses Escape, activates CLOSE, or clicks outside the dialog
- **THEN** the dialog closes and focus is on the MIDI button

#### Scenario: Select inside the dialog
- **WHEN** the user opens the CHANNEL select inside the dialog
- **THEN** its option list is shown on top of the dialog and an option can be chosen
- **AND** choosing an option closes the list but leaves the dialog open

### Requirement: Closing leaves MIDI running
Closing the dialog SHALL only hide the controls. MIDI access, the selected port, the channel and the options MUST stay as they were, and strikes MUST keep sending notes to the selected port while the dialog is closed. Reopening the dialog SHALL show the current state, without asking to connect again.

#### Scenario: Notes while closed
- **WHEN** a port is selected, the dialog is closed, and the user taps a tube
- **THEN** a note-on for that tube is sent on the chosen port and channel

#### Scenario: Reopen keeps state
- **WHEN** the user connects, picks a port and channel 5, closes the dialog and opens it again
- **THEN** the dialog shows the same port and channel 5, and CONNECT MIDI is not shown

### Requirement: Dialog look
The dialog SHALL follow the page's visual language: white background, a 1px solid black border, square corners, no shadow, Courier Prime text, and its title in uppercase. Behind the dialog, the page MUST stay visible in black and white only, with no grey or tinted overlay. The dialog MUST fit within a 375 px wide viewport inside the page padding, and when its contents are taller than the viewport it SHALL scroll inside itself.

#### Scenario: Two colors with the dialog open
- **WHEN** the dialog is open and connected, with every control shown
- **THEN** every computed color, background color, border color and outline color on the page is black or white (or one of them at reduced opacity for disabled controls)
- **AND** the dialog's computed border radius is `0px` and its box shadow is `none`

#### Scenario: Fits a phone
- **WHEN** the dialog is open at 375 px wide and 640 px tall, connected
- **THEN** the dialog is fully inside the viewport horizontally, the page has no horizontal scroll, and every control in it can be reached by scrolling the dialog

### Requirement: Button never hides content
The page SHALL leave enough space at its end that, when scrolled to the bottom, the MIDI button does not cover any text or control.

#### Scenario: Scrolled to the end
- **WHEN** the page is scrolled to the bottom at 375 px and at 1280 px wide
- **THEN** the MIDI button's box does not overlap the box of any text or control on the page

### Requirement: Prerendered closed
The button and the closed dialog SHALL be part of the prerendered page, with the dialog closed and the button in its not-live state. Hydration MUST produce no mismatch warnings.

#### Scenario: Server markup
- **WHEN** the page's server-rendered HTML is fetched
- **THEN** it contains the MIDI button and no open dialog
- **AND** loading the page in a browser logs no hydration warnings
