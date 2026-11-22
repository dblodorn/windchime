# Spec Delta

## MODIFIED Requirements

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
