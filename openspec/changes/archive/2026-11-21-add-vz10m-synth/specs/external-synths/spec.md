# Spec Delta

## Purpose

Lets a chime unit sound with an emulated hardware synth, playing either that synth's bundled INIT patch or any patch shared to its dmbk library, chosen from a PATCH picker. The CASIO VZ-10M is the first such synth; every rule here about patches, libraries and storage applies to each synth added later.

## ADDED Requirements

### Requirement: One patch reference for every external synth
A unit's external sound SHALL be identified by two values: the synth (a stable identifier, `casio-vz` for the CASIO VZ-10M) and the patch, which is either none, meaning that synth's bundled INIT patch, or the id of a patch in that synth's dmbk library. This pair SHALL be the only form in which a patch is referred to, in browser storage, share links and saved compositions alike, for every external synth. Adding another synth SHALL add a synth identifier, its INIT patch and its library, and MUST NOT change how existing references are stored or read. A reference to a synth this page does not know SHALL load as the unit's default sound; a reference to a known synth with a malformed patch id SHALL load on that synth's INIT. Patch bytes SHALL never be stored in a unit, a link or a saved composition, only the reference.

#### Scenario: Reference shape
- **WHEN** a unit on CASIO VZ-10M with a shared patch is stored, shared and saved
- **THEN** each carries the synth `casio-vz` and the patch's library id, and none carries the patch's bytes or name

#### Scenario: INIT reference
- **WHEN** a unit on CASIO VZ-10M with INIT is stored
- **THEN** its reference is the synth `casio-vz` with no patch id

#### Scenario: Unknown synth
- **WHEN** a stored or saved unit refers to a synth this page does not know
- **THEN** the unit loads with the default sound for its instrument and its other settings intact

### Requirement: CASIO VZ-10M as a sound
The SOUND select SHALL offer CASIO VZ-10M under the EXTERNAL SYNTHS heading. Any unit, tube chime or furin, SHALL be able to choose it. While a unit's sound is CASIO VZ-10M, each strike SHALL play one note of the unit's current patch at the struck tube's note, with the strike's velocity, through the unit's own VOLUME, FREQUENCY, RESONANCE and OUTPUT, exactly as other sounds do. Each note SHALL last the unit's DECAY and then be released, and a new strike on a sounding note SHALL restart it. MONO and POLY affect MIDI only, as for other sounds. Muting a unit (SOUND off, VOLUME 0, or browser sound off in the MIDI dialog) SHALL silence its VZ-10M notes as it silences other sounds.

#### Scenario: Strike plays the patch
- **WHEN** a unit with SOUND on has CASIO VZ-10M and patch INIT chosen and a tube is struck
- **THEN** the unit sounds the INIT voice at that tube's note through its filter and OUTPUT

#### Scenario: Filter applies
- **WHEN** a VZ-10M unit's FREQUENCY is lowered to its minimum while it plays
- **THEN** its sound is low-passed as any other sound would be

#### Scenario: Furin with the VZ-10M
- **WHEN** a FURIN BELL unit chooses CASIO VZ-10M
- **THEN** each furin strike plays the patch at the unit's ROOT

### Requirement: Engine loaded only when needed
The page SHALL NOT download or start the VZ-10M engine until a unit whose sound is CASIO VZ-10M has SOUND on. Choosing CASIO VZ-10M while SOUND is off, or using it for MIDI only, MUST NOT start the engine. Turning SOUND on SHALL never be silent: while the engine is starting, strikes SHALL play the built-in tubular bells voice through the unit's chain, as a soundfont preset does while its samples download. If the engine cannot start, the unit SHALL keep playing the built-in voice, and the next SOUND on or SOUND change SHALL try again.

#### Scenario: Muted choice loads nothing
- **WHEN** a unit with SOUND off is switched to CASIO VZ-10M
- **THEN** no engine code is downloaded and no audio processing for it starts

#### Scenario: First tap
- **WHEN** a VZ-10M unit turns SOUND on and strikes before the engine is ready
- **THEN** those strikes sound with the built-in tubular bells, and strikes after the engine is ready play the patch

### Requirement: PATCH picker
While a unit's sound is CASIO VZ-10M, a PATCH row SHALL appear directly below SOUND, and it SHALL NOT be shown for any other sound. PATCH is a searchable select (see `ui-controls`, **Searchable selects**). Its first option is INIT, the VZ initial voice, which is part of the page and needs no network. After INIT come the voices shared to the dmbk VZ library, newest first, each named by its voice name. A unit that has just chosen CASIO VZ-10M SHALL be on INIT. Choosing a patch SHALL change only that unit's patch; notes already sounding keep the voice they started with. The row's value SHALL be the patch's name.

#### Scenario: Default patch
- **WHEN** a unit's SOUND is changed to CASIO VZ-10M
- **THEN** a PATCH row appears directly below SOUND, reading INIT

#### Scenario: Leaving the VZ-10M
- **WHEN** that unit's SOUND is changed to VIBRAPHONE
- **THEN** the PATCH row is gone

#### Scenario: Choose a shared patch
- **WHEN** the user opens PATCH and chooses KILLER ORGAN
- **THEN** the row reads KILLER ORGAN and the unit's next strike plays that voice

### Requirement: Fetching the patch list
The page SHALL NOT contact the dmbk VZ library until a PATCH select is opened, or a unit with a shared patch needs that patch's voice or name. Opening PATCH SHALL fetch the newest 20 voices; reaching the end of the list SHALL offer MORE, which fetches and appends the next 20. Typing in the search SHALL ask the library for voices whose names contain the text, ignoring case, and show those (INIT is shown only when its name matches). The search SHALL accept at most 12 characters. While a fetch is in progress the list SHALL show `LOADING…` below the options it already has. When a fetch fails, the list SHALL show `COULD NOT LOAD` with a RETRY button, and INIT SHALL stay choosable. Each opening SHALL show the last list at once and refresh it.

#### Scenario: No requests without the VZ-10M
- **WHEN** the page is used for a minute with no unit on CASIO VZ-10M
- **THEN** no request for VZ voices is made

#### Scenario: Paging
- **WHEN** PATCH is opened and the library holds 45 voices
- **THEN** INIT and 20 voices are listed with MORE, and pressing MORE twice lists all 45

#### Scenario: Search
- **WHEN** PATCH is open and the user types `organ`
- **THEN** only voices whose names contain ORGAN are listed

#### Scenario: Library unreachable
- **WHEN** PATCH is opened and the library cannot be reached
- **THEN** the list shows INIT, `COULD NOT LOAD` and RETRY, and choosing INIT works

### Requirement: Shared patch voices
A unit's shared patch SHALL be fetched when that unit needs to sound with it (SOUND on with the patch chosen, or the patch chosen while SOUND is on), at most once per visit for each patch, and shared between units using the same patch. Until it arrives the unit SHALL play INIT. If the library reports the voice missing (deleted or hidden), the unit's patch SHALL become INIT. If the fetch fails for any other reason, the unit SHALL keep its patch, play INIT, and try again on the next SOUND on or PATCH change. A unit whose patch name is not yet known SHALL show `LOADING…` as the PATCH row's value and in the sound line until it is.

#### Scenario: Deleted patch
- **WHEN** a stored unit's patch has been deleted from the library and the unit turns SOUND on
- **THEN** its PATCH row reads INIT and it plays INIT

#### Scenario: Offline
- **WHEN** a unit with a shared patch turns SOUND on while the library cannot be reached
- **THEN** it plays INIT, its PATCH row keeps the shared patch's name, and turning SOUND off and on retries

#### Scenario: Shared between units
- **WHEN** two units use the same shared patch and both turn SOUND on
- **THEN** that voice is fetched once

### Requirement: Patch stored with the unit
A unit's patch SHALL be kept with its other settings: in browser storage across visits, in share links and in saved compositions, and COPY SHALL give the copy the same patch. A unit whose sound is not CASIO VZ-10M has no patch. A stored, linked or saved unit with a malformed patch id SHALL load on INIT. Switching a unit away from CASIO VZ-10M and back SHALL put it on INIT.

#### Scenario: Survives reload
- **WHEN** a unit is on CASIO VZ-10M with patch KILLER ORGAN and the page is reloaded
- **THEN** the unit is still on CASIO VZ-10M with KILLER ORGAN

#### Scenario: Copy keeps the patch
- **WHEN** that unit is copied
- **THEN** the copy is on CASIO VZ-10M with KILLER ORGAN
