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
- a SAVE button;
- the list of saved compositions;
- a MORE button while more compositions exist.

The panel SHALL scroll when its content is taller than the viewport. Escape, a press outside it, or a CLOSE button inside it SHALL close it. While it is open, the chimes behind it SHALL keep animating and sounding. The panel SHALL follow the two-color, monospace, square visual rules of `ui-controls`.

#### Scenario: Open and close
- **WHEN** the user opens the panel, then presses Escape
- **THEN** the panel closes, focus returns to MENU, and no unit has changed

#### Scenario: Phone width
- **WHEN** the viewport is 320 px wide and the panel is open
- **THEN** the panel is no wider than the viewport and the page does not scroll sideways

### Requirement: Saving a composition
SAVE SHALL save every unit of the current composition (the same settings, position and stacking order a share link carries; never SOUND, the MIDI port or the SEND options) to the public list, anonymously: no account, name or text is asked for or sent. While a save is in progress the button SHALL read `SAVING…` and be disabled. On success it SHALL read `SAVED` for about 1.5 seconds. The saved composition SHALL appear at the top of the list with the title the API gave it. Saving a composition identical to one already in the list SHALL show that existing entry instead of adding a second. When the save fails, the panel SHALL show a one-line message in plain text: `TOO MANY SAVES, TRY LATER` when the API rate-limits it, and `COULD NOT SAVE` otherwise. The composition on the page SHALL be unchanged either way.

#### Scenario: Save
- **WHEN** the user arranges two units and presses SAVE
- **THEN** a new entry with the title the API gave it appears at the top of the list, and the button shows `SAVED` briefly

#### Scenario: Save again
- **WHEN** the user presses SAVE twice without changing anything
- **THEN** the list still holds one entry for that composition

#### Scenario: Rate-limited
- **WHEN** the API refuses a save as rate-limited
- **THEN** the panel shows `TOO MANY SAVES, TRY LATER`, and nothing else changes

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
- the stored composition (`windchime.units`) becomes the loaded one;
- positions that fall outside the viewport are pulled back inside.

If the browser does not allow sound to start, the units SHALL still load, with SOUND off. SOUND SHALL NOT be stored, so after a reload the loaded units start muted, like every unit on load. Every loaded unit SHALL pass the same checks as stored and linked units. A composition that fails them SHALL NOT replace the page, SHALL NOT start sound, and the panel SHALL show `COULD NOT OPEN`. After loading, the panel SHALL close. A composition loaded this way SHALL produce the same SHARE link as the one it was saved from.

#### Scenario: Load
- **WHEN** a visitor selects a three-unit composition in the list
- **THEN** the page shows exactly those three units with their settings and positions, each with SOUND on and audible in the browser, and the panel closes

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
