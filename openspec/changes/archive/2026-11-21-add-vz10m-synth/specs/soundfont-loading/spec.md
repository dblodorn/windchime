# Spec Delta

## MODIFIED Requirements

### Requirement: Tables on load, samples on demand
On load the system SHALL download only the soundfont's preset and instrument tables, not its audio samples. With the tables alone, the SOUND select SHALL list every General MIDI preset, a unit's default voice SHALL be GM Tubular Bells, and MIDI program changes SHALL carry the same bank and program as when the whole file was loaded. On a first visit with one default unit and SOUND off, the soundfont download MUST be at most 300 KB. A unit whose sound is an external synth SHALL download no soundfont samples.

#### Scenario: First visit
- **WHEN** the page loads with nothing saved and no unit's SOUND is turned on
- **THEN** at most 300 KB of the soundfont is downloaded, and the SOUND select lists the General MIDI presets with TUBULAR BELLS chosen

#### Scenario: MIDI only
- **WHEN** a MIDI port is connected, units strike for a minute, and no unit's SOUND is on
- **THEN** program changes and notes are sent as before, and no soundfont samples are downloaded

#### Scenario: External synth needs no samples
- **WHEN** the only unit is on CASIO VZ-10M and turns SOUND on
- **THEN** no soundfont samples are downloaded

### Requirement: Samples fetched when sound needs them
The system SHALL download a preset's samples when a unit using that preset turns its SOUND on, and when a unit with SOUND on switches its SOUND voice to that preset. It SHALL download only the samples that preset uses, each sample at most once per visit, and SHALL share them between units and presets that use the same samples. Changing to a preset while SOUND is off MUST NOT download its samples.

#### Scenario: Default sound
- **WHEN** a unit with the default voice turns SOUND on
- **THEN** the Tubular Bells samples are downloaded, and the total soundfont download is at most 400 KB

#### Scenario: Shared samples
- **WHEN** two units use the same preset and both turn SOUND on
- **THEN** that preset's samples are downloaded once

#### Scenario: Choosing a preset while muted
- **WHEN** a unit with SOUND off is switched to CHURCH ORGAN
- **THEN** no new samples are downloaded until its SOUND is turned on

### Requirement: Sound while samples are on their way
While a unit's preset samples have not arrived, its strikes SHALL play the built-in tubular bells voice through the unit's own volume and filter, so turning SOUND on is never silent. Once the samples have arrived, its next strike SHALL play the chosen preset. MIDI output MUST NOT depend on whether samples have arrived. If the samples cannot be downloaded, the unit SHALL keep playing the built-in voice, and the next SOUND on or SOUND voice change SHALL try again.

#### Scenario: First tap on a slow connection
- **WHEN** a unit turns SOUND on and strikes before its preset's samples have arrived
- **THEN** each of those strikes sounds with the built-in tubular bells voice, and strikes after the samples arrive use the preset

#### Scenario: Offline
- **WHEN** the sample download fails
- **THEN** the unit plays the built-in voice, sends MIDI as usual, and turning SOUND off and on again retries the download
