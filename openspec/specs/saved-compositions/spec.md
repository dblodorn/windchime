# saved-compositions Specification

## Purpose
How a visitor saves the current composition, without an account, to the public list kept by the dmbk GraphQL API, and how anyone browses that list from a side panel and loads a composition into the player.

## Requirements

### Requirement: MENU button
The page SHALL show a MENU button fixed to the upper-right corner of the viewport, 16 CSS px from the top and right edges, plus the device's safe-area inset where there is one, with the same height, border and style as SHARE and MIDI, and a square 44×44 CSS px touch target. It SHALL show the hamburger (three-line menu) icon in pure black on white, with square corners, and it SHALL invert on hover. Its accessible name SHALL be "MENU", and it SHALL announce that it opens a dialog. It SHALL stay above every unit, show the dashed keyboard focus outline, and activate with a click, a tap, Enter or Space. Apart from the four round buttons on each unit, it SHALL be the only control on the page that shows an icon.

#### Scenario: Placement
- **WHEN** the page loads at any viewport width
- **THEN** MENU's top and right edges are 16 px from the viewport's top and right edges, and it is not in the lower-right row

#### Scenario: Above the units
- **WHEN** a unit is dragged under the upper-right corner
- **THEN** MENU stays visible above it and still opens the panel

#### Scenario: Keyboard
- **WHEN** MENU has keyboard focus and Enter is pressed
- **THEN** the COMPOSITIONS panel opens

### Requirement: COMPOSITIONS panel
MENU SHALL open a panel named "COMPOSITIONS" that covers the full height of the viewport at the right edge. It SHALL be at most 360 CSS px wide and never wider than the viewport, white, with a 1px black left border, and no tint over the rest of the page. From top to bottom it SHALL hold:
- its heading;
- the list of saved compositions;
- a MORE button while more compositions exist;
- a footer holding the SAVE button (and its message) above two links.

The heading SHALL stay at the top of the panel, spanning its full width with a 1px black rule under it, and SHALL hold a CLOSE text button at its right, the same size and style as the CLOSE buttons of the MIDI OUT and AUDIO OUT dialogs. The list SHALL scroll up under that rule. The footer SHALL stay at the bottom edge and span the panel's full width, with a 1px black rule along its top and its content clear of the device's safe-area inset. Under SAVE it SHALL hold two underlined text links, at opposite ends: CHANGELOG on the left, which opens the `/changelog` page, and GITHUB on the right, which opens https://github.com/dblodorn/windchime in a new tab. Only the area between the heading and the footer (the list and MORE) SHALL scroll when its content is taller than the space it has. Scrolling that area SHALL NOT clip the dashed keyboard focus outline of the controls inside it. Escape, a press outside the panel, or a CLOSE button inside it SHALL close it. While it is open, the chimes behind it SHALL keep animating and sounding. The panel SHALL follow the two-color, monospace, square visual rules of `ui-controls`.

#### Scenario: Open and close
- **WHEN** the user opens the panel, then presses Escape
- **THEN** the panel closes, focus returns to MENU, and no unit has changed

#### Scenario: Phone width
- **WHEN** the viewport is 320 px wide and the panel is open
- **THEN** the panel is no wider than the viewport and the page does not scroll sideways

#### Scenario: Footer stays put
- **WHEN** the list is taller than the panel and the user scrolls it to the end
- **THEN** the heading stays at the top, the footer with SAVE and the links stays at the bottom, and the rows scroll between them

#### Scenario: Open the changelog
- **WHEN** the user activates CHANGELOG in the footer
- **THEN** the `/changelog` page opens

#### Scenario: Short list
- **WHEN** the list has only a few rows
- **THEN** the footer is still at the bottom edge of the panel, not directly under the list

#### Scenario: Repository link
- **WHEN** the user activates GITHUB in the footer
- **THEN** the repository opens in a new tab and the player keeps running

### Requirement: Saving a composition
SAVE SHALL save every unit of the current composition (the same settings, instrument, root note and external-synth patch reference included, position and stacking order a share link carries; never SOUND on/off, OUTPUT, the audio output device, the MIDI port, the SEND options, or a patch's bytes or name) to the public list, anonymously: no account, name or text is asked for or sent. Any root note from C-1 to B8 SHALL be saveable, and any patch reference a unit can hold SHALL be saveable. While a save is in progress the button SHALL read `SAVING…` and be disabled. On success it SHALL read `SAVED` for about 1.5 seconds. The saved composition SHALL appear at the top of the list with the title the API gave it. Saving a composition identical to one already in the list SHALL show that existing entry instead of adding a second; compositions that differ only in their units' OUTPUT are identical. A composition with no unit on an external synth SHALL be sent exactly as it was before this change, so a composition saved before this change and saved again unchanged is recognized as the same entry. When the save fails, the panel SHALL show a one-line message in plain text: `TOO MANY SAVES, TRY LATER` when the API rate-limits it, and `COULD NOT SAVE` otherwise. The composition on the page SHALL be unchanged either way.

#### Scenario: Save
- **WHEN** the user arranges two units and presses SAVE
- **THEN** a new entry with the title the API gave it appears at the top of the list, and the button shows `SAVED` briefly

#### Scenario: Save again
- **WHEN** the user presses SAVE twice without changing anything
- **THEN** the list still holds one entry for that composition

#### Scenario: Saved before, saved again
- **WHEN** a composition saved before this change is loaded and saved again without changes
- **THEN** the list still holds one entry for it

#### Scenario: OUTPUT is not saved
- **WHEN** the user saves a composition with units on OUTPUT `3–4` and `7`, changes them to `1–2`, and saves again
- **THEN** the list still holds one entry for that composition, and the data sent to the API holds no output or device field

#### Scenario: Rate-limited
- **WHEN** the API refuses a save as rate-limited
- **THEN** the panel shows `TOO MANY SAVES, TRY LATER`, and nothing else changes

#### Scenario: Save a furin
- **WHEN** the user saves a composition with a FURIN BELL unit and then loads it from the list
- **THEN** that unit loads as a FURIN BELL with its settings, and the data sent to the API marked it as a furin

#### Scenario: Save extreme root notes
- **WHEN** the user saves a composition with units at root notes C-1 and B8 and then loads it from the list
- **THEN** the save succeeds, and the units load at C-1 and B8

#### Scenario: Save an external synth
- **WHEN** the user saves a composition with a unit on CASIO VZ-10M with patch KILLER ORGAN and another on CASIO VZ-10M with INIT, then loads it from the list
- **THEN** the units load on CASIO VZ-10M with KILLER ORGAN and INIT, and the data sent to the API held each unit's synth and patch id and no patch bytes or name

#### Scenario: Patch changes the composition
- **WHEN** the user saves a composition, changes one VZ-10M unit's patch, and saves again
- **THEN** the list holds two entries

### Requirement: Browsing saved compositions
When the panel opens, it SHALL fetch the newest 20 visible compositions and show each as one row, a button whose accessible name begins with the composition's title. Each row SHALL show the title and the save date, and SHALL NOT show the unit count. MORE SHALL fetch the next 20 and append them. While a fetch is in progress the list SHALL show `LOADING…`. When it fails, it SHALL show `COULD NOT LOAD` with a RETRY button. The page SHALL NOT contact the API before the panel is first opened or SAVE is pressed.

#### Scenario: First open
- **WHEN** the panel is opened for the first time
- **THEN** up to 20 rows appear, newest first, and MORE is shown only if more exist

#### Scenario: Row text
- **WHEN** the list shows a three-unit composition
- **THEN** its row shows the title and the save date, and no `3 CHIMES` text

#### Scenario: No network on load
- **WHEN** the page loads and the panel is never opened
- **THEN** no request is made to the GraphQL route

#### Scenario: API down
- **WHEN** the API cannot be reached as the panel opens
- **THEN** the list shows `COULD NOT LOAD` and RETRY, and the chimes keep running

### Requirement: Loading a saved composition
Activating a row SHALL replace the page's units with the composition's units, as opening a share link does, except for SOUND:
- the old units' MIDI notes are ended;
- every new unit starts with SOUND on, its browser sound started within the same tap or key press that activated the row;
- every new unit is on OUTPUT `1–2`, and the chosen audio output device is unchanged;
- the stored composition (`windchime.units`) becomes the loaded one;
- positions that fall outside the viewport are pulled back inside.

If the browser does not allow sound to start, the units SHALL still load, with SOUND off. SOUND SHALL NOT be stored, so after a reload the loaded units start muted, like every unit on load. Every loaded unit SHALL pass the same checks as stored and linked units. A composition that fails them SHALL NOT replace the page, SHALL NOT start sound, and the panel SHALL show `COULD NOT OPEN`. After loading, the panel SHALL close. A composition loaded this way SHALL produce the same SHARE link as the one it was saved from. Every composition saved before this change SHALL load with exactly the values it loaded with before; it has no external-synth units. A saved unit referring to an external synth this page does not know SHALL load with its instrument's default sound rather than fail the composition, and a saved patch that is no longer in the synth's library SHALL load and then fall back to INIT as `external-synths` says.

#### Scenario: Load
- **WHEN** a visitor selects a three-unit composition in the list
- **THEN** the page shows exactly those three units with their settings and positions, each with SOUND on, on OUTPUT `1–2` and audible in the browser, and the panel closes

#### Scenario: Volume zero
- **WHEN** a loaded unit has VOLUME 0
- **THEN** its SOUND button shows on, and it makes no browser sound until VOLUME is raised

#### Scenario: Survives reload
- **WHEN** the visitor reloads after loading a composition
- **THEN** the loaded composition is what appears, muted

#### Scenario: Bad composition
- **WHEN** a selected composition fails the checks
- **THEN** the page's units and their SOUND states are unchanged, and the panel shows `COULD NOT OPEN`

#### Scenario: Round trip
- **WHEN** a composition is saved, then loaded, and SHARE is pressed
- **THEN** the copied link is identical to the link SHARE gave before the save

#### Scenario: Saved before this change
- **WHEN** a composition saved before this change is loaded
- **THEN** its units load with the same settings, sounds and positions as before this change

#### Scenario: Deleted patch in a saved composition
- **WHEN** a loaded composition has a VZ-10M unit whose patch has since been deleted
- **THEN** the composition loads, and that unit plays and shows INIT

### Requirement: Server route to the API
The browser SHALL reach the dmbk GraphQL API only through this app's own route, which SHALL:
- accept only same-origin POST requests carrying the id of an operation compiled from this app's source;
- refuse anything else (query text, unknown ids, other methods, cross-origin requests) without contacting the API;
- forward the operation with windchime's API key and the visitor's IP (from the platform's forwarded-for header);
- forward no cookie and no other request header;
- answer with the API's response;
- report an unreachable API as a GraphQL error with code `API_UNAVAILABLE`.

The API key SHALL exist only in the server's environment and SHALL never reach the browser.

#### Scenario: Unknown operation
- **WHEN** a script on the page posts query text, or an id the compiler did not write, to the route
- **THEN** the route answers with an error and makes no request to the API

#### Scenario: Cross-origin
- **WHEN** another site posts a valid operation id to the route
- **THEN** the route refuses it with `FORBIDDEN`

#### Scenario: Key stays server-side
- **WHEN** the page's scripts and every response the browser receives are searched for the API key
- **THEN** it is not found
