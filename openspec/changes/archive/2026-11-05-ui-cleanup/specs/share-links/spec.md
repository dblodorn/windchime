# Spec Delta

## MODIFIED Requirements

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
