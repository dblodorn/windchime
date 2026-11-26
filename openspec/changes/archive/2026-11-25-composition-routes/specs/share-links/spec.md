# Spec Delta

## MODIFIED Requirements

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
