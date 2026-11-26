# Spec Delta

## Purpose

Gives every saved composition its own address, `/c/<id>`, so it can be linked, opened and shared by a short URL instead of a long fragment, and says what that address shows when the composition is missing.

## ADDED Requirements

### Requirement: Composition address
Every saved composition SHALL be reachable at `/c/<id>`, where `<id>` is the composition's 24-character lowercase hex id as stored by the dmbk GraphQL API. Opening that address SHALL show the player with exactly that composition's units, with the same values, positions and stacking order a row in COMPOSITIONS loads, checked the same way (see `saved-compositions`). Because opening an address is not a tap, every unit SHALL start with SOUND off, as units opened from a share link do, and on OUTPUT `1–2`; the browser's audio output device, MIDI port and SEND options SHALL be unchanged. The loaded units SHALL replace the browser's stored units (`windchime.units`), as a share link does. The composition SHALL be fetched by the server and present in the first HTML response, so the address works without the COMPOSITIONS panel ever opening.

#### Scenario: Open an address
- **WHEN** a visitor opens `/c/<id>` for a stored three-unit composition
- **THEN** the page shows exactly those three units with their settings and positions, each muted and on OUTPUT `1–2`

#### Scenario: Same as the list
- **WHEN** a composition is opened at its address in one browser and from its COMPOSITIONS row in another
- **THEN** both show the same units with the same values, positions and stacking order

#### Scenario: Replaces the stored units
- **WHEN** a browser with two stored units opens the address of a five-unit composition and then goes to `/`
- **THEN** the five units are shown

### Requirement: Title of a composition's page
The page at `/c/<id>` SHALL carry the composition's title (the one the API generated) as its document title, followed by ` · Chime`, and its share card SHALL show that title. The page SHALL NOT add an on-page heading.

#### Scenario: Document title
- **WHEN** a visitor opens the address of a composition titled `QUARTET IN D · FURIN`
- **THEN** the browser tab reads `QUARTET IN D · FURIN · Chime`

#### Scenario: Link preview
- **WHEN** the address is pasted into an app that shows link previews
- **THEN** the preview shows the composition's title

### Requirement: Address while editing
While the units are exactly the loaded composition, the address bar SHALL show `/c/<id>`. The first change to any unit, or adding, removing or resetting units, SHALL replace the address with `/` without reloading or adding a history entry, so a reload shows the composition as edited and the address never names a composition the page no longer shows. Changes that are never saved or shared (SOUND on/off, OUTPUT, the audio device, MIDI settings) SHALL NOT change the address, and neither SHALL a change to the stacking order alone, since any press on a unit brings it to the front.

#### Scenario: Edit, then reload
- **WHEN** a composition is opened at its address, CHIME 1's WIND is changed, and the page is reloaded
- **THEN** the address bar shows `/` and CHIME 1 shows the changed WIND

#### Scenario: Muting keeps the address
- **WHEN** a composition is opened at its address and the visitor turns SOUND on for a unit behind another (bringing it to the front) and changes a unit's OUTPUT
- **THEN** the address bar still shows `/c/<id>`

### Requirement: Composition not found
When `<id>` is malformed, or the API has no visible composition with that id (missing or hidden), the server SHALL answer with HTTP status 404 and the player with the browser's stored units, unchanged, and the page SHALL show a one-line message `COMPOSITION NOT FOUND` in the two-color style of `ui-controls`, which the visitor can dismiss. When the API cannot be reached, the page SHALL show the stored units and the message `COULD NOT OPEN`, and SHALL keep the address so a reload tries again. In neither case SHALL the stored units be replaced.

#### Scenario: Hidden composition
- **WHEN** a visitor opens the address of a composition an admin has hidden
- **THEN** the response status is 404, the browser's stored units load unchanged, and `COMPOSITION NOT FOUND` is shown

#### Scenario: Malformed id
- **WHEN** a visitor opens `/c/hello`
- **THEN** the response status is 404 and no request for it reaches the API

#### Scenario: API down
- **WHEN** the API cannot be reached as `/c/<id>` is opened
- **THEN** the stored units load unchanged, `COULD NOT OPEN` is shown, and the address bar still shows `/c/<id>`
