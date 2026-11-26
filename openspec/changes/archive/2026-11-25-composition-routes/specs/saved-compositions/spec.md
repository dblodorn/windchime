# Spec Delta

## ADDED Requirements

### Requirement: Device key
The first time this browser saves or shares a composition, it SHALL make a device key (32 random bytes, written as 43 base64url characters) and keep it in this browser's storage. Every save and share SHALL send it to the API as the composition's creator key; the API stores only a hash of it. A composition made by a save or share with this key SHALL be "yours" in this browser. A save or share that returns an already stored composition SHALL NOT change whose it is, and compositions saved before this change SHALL belong to no one. The key SHALL never be put in a link, a saved composition's units, or the address bar.

The panel SHALL hold a collapsible DEVICE KEY section (closed by default) under the list, which:
- explains in a short note that the key is what makes a composition yours, that it is kept only in this browser with only its hash on the server, that copying it to another browser shows the same compositions as yours there, and that clearing the site's data without a copy loses it while the compositions stay public;
- shows the key masked, with SHOW / HIDE and COPY buttons, or `No key yet: one is made the first time you save or share.` when there is none;
- has a field named `PASTE A DEVICE KEY` and a USE KEY button that replaces this browser's key with a pasted one, answering `THIS BROWSER NOW USES THAT KEY.`, or `THAT ISN'T A DEVICE KEY (43 LETTERS, DIGITS, - AND _).` and changing nothing when it isn't one.

#### Scenario: Key made on first save
- **WHEN** a browser with no key presses SAVE
- **THEN** a 43-character key is stored in this browser, the save sends it, and the DEVICE KEY section shows it masked

#### Scenario: Key made on first share
- **WHEN** a browser with no key activates SHARE
- **THEN** a key is made and sent with SHARE's save

#### Scenario: Move the key
- **WHEN** a key is copied from browser A and used in browser B
- **THEN** compositions saved or shared in browser A are marked yours in browser B

#### Scenario: Not a key
- **WHEN** the visitor pastes `hello` and presses USE KEY
- **THEN** the panel says it isn't a device key, and the stored key is unchanged

#### Scenario: Never in a link
- **WHEN** a composition is shared, saved and its address opened
- **THEN** the key appears in neither the copied link, the address bar, nor the units sent to the API

## MODIFIED Requirements

### Requirement: Saving a composition
SAVE SHALL save every unit of the current composition (the same settings, instrument, root note and external-synth patch reference included, position and stacking order a share link carries; never SOUND on/off, OUTPUT, the audio output device, the MIDI port, the SEND options, or a patch's bytes or name) to the public list, anonymously: no account, name or text is asked for or sent. It SHALL send this browser's device key with the units (see "Device key"). Any root note from C-1 to B8 SHALL be saveable, and any patch reference a unit can hold SHALL be saveable. While a save is in progress the button SHALL read `SAVING…` and be disabled. On success it SHALL read `SAVED` for about 1.5 seconds. The saved composition SHALL appear at the top of the list with the title the API gave it. Saving a composition identical to one already in the list SHALL show that existing entry instead of adding a second; compositions that differ only in their units' OUTPUT are identical. A composition with no unit on an external synth SHALL send the same units as it did before this change, so a composition saved before this change and saved again unchanged is recognized as the same entry. When the save fails, the panel SHALL show a one-line message in plain text: `TOO MANY SAVES, TRY LATER` when the API rate-limits it, and `COULD NOT SAVE` otherwise. The composition on the page SHALL be unchanged either way. SAVE and SHARE SHALL draw from the same save budget the API keeps per visitor.

#### Scenario: Save
- **WHEN** the user arranges two units and presses SAVE
- **THEN** a new entry with the title the API gave it appears at the top of the list, marked YOURS, and the button shows `SAVED` briefly

#### Scenario: Save again
- **WHEN** the user presses SAVE twice without changing anything
- **THEN** the list still holds one entry for that composition

#### Scenario: Saved before, saved again
- **WHEN** a composition saved before this change is loaded and saved again without changes
- **THEN** the list still holds one entry for it, and it is not marked YOURS

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
When the panel opens, it SHALL fetch the newest 20 visible compositions and show each as one row, a button whose accessible name begins with the composition's title. Each row SHALL show the title and the save date, and SHALL NOT show the unit count. A row for a composition that is yours (see "Device key") SHALL also show a `YOURS` badge. MORE SHALL fetch the next 20 and append them. While a fetch is in progress the list SHALL show `LOADING…`. When it fails, it SHALL show `COULD NOT LOAD` with a RETRY button.

Above the list, a group named `SHOW` SHALL hold two toggle buttons, ALL (pressed by default) and YOURS. YOURS SHALL be disabled while this browser has no device key; pressed, the list SHALL hold only compositions that are yours, newest first, with MORE as above. Pressing ALL SHALL show every visible composition again.

The page at `/` SHALL NOT contact the API before the panel is first opened, SAVE is pressed or SHARE is activated.

#### Scenario: First open
- **WHEN** the panel is opened for the first time
- **THEN** up to 20 rows appear, newest first, and MORE is shown only if more exist

#### Scenario: Row text
- **WHEN** the list shows a three-unit composition
- **THEN** its row shows the title and the save date, and no `3 CHIMES` text

#### Scenario: Yours
- **WHEN** this browser has saved two compositions and shared one, and the visitor presses YOURS
- **THEN** the list holds exactly those three, each with the YOURS badge

#### Scenario: No key yet
- **WHEN** a browser that has never saved or shared opens the panel
- **THEN** YOURS is disabled, ALL is pressed, and no row shows the YOURS badge

#### Scenario: No network on load
- **WHEN** the page loads at `/` and the panel, SAVE and SHARE are never used
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
- positions that fall outside the viewport are pulled back inside;
- the address bar shows the composition's address, `/c/<id>`, without reloading or adding a history entry, and follows the editing rule of `composition-routes`.

If the browser does not allow sound to start, the units SHALL still load, with SOUND off. SOUND SHALL NOT be stored, so after a reload the loaded units start muted, like every unit on load. Every loaded unit SHALL pass the same checks as stored and linked units. A composition that fails them SHALL NOT replace the page, SHALL NOT start sound, and the panel SHALL show `COULD NOT OPEN`. After loading, the panel SHALL close. Activating SHARE on a composition loaded this way, unchanged, SHALL copy that composition's own address. Every composition saved before this change SHALL load with exactly the values it loaded with before; it has no external-synth units. A saved unit referring to an external synth this page does not know SHALL load with its instrument's default sound rather than fail the composition, and a saved patch that is no longer in the synth's library SHALL load and then fall back to INIT as `external-synths` says.

#### Scenario: Load
- **WHEN** a visitor selects a three-unit composition in the list
- **THEN** the page shows exactly those three units with their settings and positions, each with SOUND on, on OUTPUT `1–2` and audible in the browser, the address bar shows `/c/<id>`, and the panel closes

#### Scenario: Volume zero
- **WHEN** a loaded unit has VOLUME 0
- **THEN** its SOUND button shows on, and it makes no browser sound until VOLUME is raised

#### Scenario: Survives reload
- **WHEN** the visitor reloads after loading a composition
- **THEN** the loaded composition is what appears, muted

#### Scenario: Bad composition
- **WHEN** a selected composition fails the checks
- **THEN** the page's units, their SOUND states and the address bar are unchanged, and the panel shows `COULD NOT OPEN`

#### Scenario: Round trip
- **WHEN** a composition is loaded from the list and SHARE is activated without changes
- **THEN** the copied address is that composition's `/c/<id>`, and no new entry is added

#### Scenario: Saved before this change
- **WHEN** a composition saved before this change is loaded
- **THEN** its units load with the same settings, sounds and positions as before this change

#### Scenario: Deleted patch in a saved composition
- **WHEN** a loaded composition has a VZ-10M unit whose patch has since been deleted
- **THEN** the composition loads, and that unit plays and shows INIT
