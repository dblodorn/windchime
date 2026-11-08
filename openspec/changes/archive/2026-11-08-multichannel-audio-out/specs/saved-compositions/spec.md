# Spec Delta

## MODIFIED Requirements

### Requirement: Saving a composition
SAVE SHALL save every unit of the current composition (the same settings, position and stacking order a share link carries; never SOUND, OUTPUT, the audio output device, the MIDI port or the SEND options) to the public list, anonymously: no account, name or text is asked for or sent. While a save is in progress the button SHALL read `SAVING…` and be disabled. On success it SHALL read `SAVED` for about 1.5 seconds. The saved composition SHALL appear at the top of the list with the title the API gave it. Saving a composition identical to one already in the list SHALL show that existing entry instead of adding a second; compositions that differ only in their units' OUTPUT are identical. When the save fails, the panel SHALL show a one-line message in plain text: `TOO MANY SAVES, TRY LATER` when the API rate-limits it, and `COULD NOT SAVE` otherwise. The composition on the page SHALL be unchanged either way.

#### Scenario: Save
- **WHEN** the user arranges two units and presses SAVE
- **THEN** a new entry with the title the API gave it appears at the top of the list, and the button shows `SAVED` briefly

#### Scenario: Save again
- **WHEN** the user presses SAVE twice without changing anything
- **THEN** the list still holds one entry for that composition

#### Scenario: OUTPUT is not saved
- **WHEN** the user saves a composition with units on OUTPUT `3–4` and `7`, changes them to `1–2`, and saves again
- **THEN** the list still holds one entry for that composition, and the data sent to the API holds no output or device field

#### Scenario: Rate-limited
- **WHEN** the API refuses a save as rate-limited
- **THEN** the panel shows `TOO MANY SAVES, TRY LATER`, and nothing else changes

### Requirement: Loading a saved composition
Activating a row SHALL replace the page's units with the composition's units, as opening a share link does, except for SOUND:
- the old units' MIDI notes are ended;
- every new unit starts with SOUND on, its browser sound started within the same tap or key press that activated the row;
- every new unit is on OUTPUT `1–2`, and the chosen audio output device is unchanged;
- the stored composition (`windchime.units`) becomes the loaded one;
- positions that fall outside the viewport are pulled back inside.

If the browser does not allow sound to start, the units SHALL still load, with SOUND off. SOUND SHALL NOT be stored, so after a reload the loaded units start muted, like every unit on load. Every loaded unit SHALL pass the same checks as stored and linked units. A composition that fails them SHALL NOT replace the page, SHALL NOT start sound, and the panel SHALL show `COULD NOT OPEN`. After loading, the panel SHALL close. A composition loaded this way SHALL produce the same SHARE link as the one it was saved from.

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
