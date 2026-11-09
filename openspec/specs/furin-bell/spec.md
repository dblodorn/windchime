# furin-bell Specification

## Purpose
The furin bell is a unit's second instrument: a Japanese wind bell whose clapper is swung by a paper strip in the wind. It strikes one note, at a velocity that changes with every hit, and it is drawn, tapped, sounded and sent over MIDI like the tube chime.

## Requirements

### Requirement: Choosing the instrument
Each unit SHALL be one of two instruments, chosen with its INSTRUMENT select (see `ui-controls`). The options are:
- TUBE CHIME, the instrument units have always been, and the default;
- FURIN BELL.

A change of instrument SHALL take effect at once, in the drawing, the hit areas, the notes drawer, sound and MIDI. It SHALL NOT change any other parameter of the unit. Notes already sounding SHALL end as they would have: their sound decays, and their MIDI note-offs are sent at the usual time. The unit's wind SHALL carry on. The new instrument's moving parts SHALL start at rest.

#### Scenario: Default instrument
- **WHEN** the page loads with nothing saved
- **THEN** CHIME 1 is a TUBE CHIME with 6 tubes

#### Scenario: Switch to the furin
- **WHEN** a unit with TUBES 4 and SCALE PYEONGJO is switched to FURIN BELL
- **THEN** its drawing shows a furin and no tubes, and every strike from then on plays the unit's ROOT

#### Scenario: Switch back keeps the tubes
- **WHEN** that unit is switched back to TUBE CHIME
- **THEN** it has 4 tubes tuned to PYEONGJO, as before

#### Scenario: Ringing note survives the switch
- **WHEN** a MIDI port is selected, a tube has just been struck, and the unit is switched to FURIN BELL before that note's note-off is due
- **THEN** that note-off is still sent on the unit's channel at its usual time

### Requirement: Furin motion and strikes
A furin unit SHALL simulate the bell as it hangs:
- The bell hangs from the hook.
- A clapper hangs inside the bell on a string.
- A paper strip (tanzaku) hangs from the clapper and catches the wind.

The unit's WIND SHALL push the strip with the same kind of gusting wind the tube chime uses. The strip SHALL swing the clapper. A strike happens each time the clapper reaches the bell's rim. Each strike's velocity SHALL follow the clapper's speed at impact, from 1 to 127, so soft and hard strikes mix in the same wind, and a stronger wind gives harder strikes on average. One strike SHALL NOT be counted twice: after a strike, the clapper MUST move away from the rim before it can strike again. The simulation runs at the same fixed rate as the tube chime. For the same random seed and parameters it SHALL produce the same strikes (velocity and time). In still air at rest the furin SHALL NOT strike.

#### Scenario: Still air
- **WHEN** WIND is 0 and the furin has come to rest
- **THEN** it does not strike

#### Scenario: Varying velocity
- **WHEN** a furin unit runs for 5 minutes at WIND 0.45
- **THEN** it strikes at least 20 times, and its loudest strike's velocity is at least 30 above its softest

#### Scenario: Wind sets the density and force
- **WHEN** a furin unit runs for 5 minutes at WIND 0.2, and again at WIND 0.8
- **THEN** the run at 0.8 has more strikes, and a higher mean velocity

#### Scenario: Repeatable
- **WHEN** a 2-minute take is rendered twice with the same seed and parameters
- **THEN** both takes have the same strikes at the same velocities and times

### Requirement: One note
Every strike of a furin unit SHALL play the unit's ROOT. A furin unit's TUBES and SCALE SHALL NOT affect its sound, its MIDI or its drawing. A furin unit SHALL still keep its TUBES and SCALE values, so that switching back to TUBE CHIME restores them.

#### Scenario: ROOT sets the note
- **WHEN** a furin unit's ROOT is changed from D4 to A4
- **THEN** its strikes from then on play A4, in the browser and over MIDI

### Requirement: Furin drawing
A furin unit's drawing SHALL use the same 200×200 one-bit paper, single-pixel line vocabulary, three-quarter view and wind dashes as the tube chime (see `chime-drawing`). It SHALL show:
- a hook line from the top edge;
- the bell, an outlined dome whose open rim is one foreshortened closed outline, wider than it is tall;
- the clapper's string from the bell's top, and the clapper as a small closed outline inside the rim;
- the tanzaku as an outlined tall rectangle on a string below the clapper, narrowing as it turns edge-on to the wind.

Positions SHALL come from the furin's simulation. In the frame of a strike, the clapper SHALL be drawn touching the rim outline, within a few pixels. The figure MUST fit inside the paper at rest, and SHALL fit in at least 99% of frames at WIND 0.45. In stronger gusts the strip MAY swing past the edge and be clipped there.

#### Scenario: Furin at rest
- **WHEN** a furin unit is at rest with WIND 0
- **THEN** the drawing shows the hook, the bell and its rim, the clapper inside the rim, and the strip hanging straight below it, with nothing clipped

#### Scenario: Clapper meets the rim
- **WHEN** a furin strike is reported
- **THEN** in that frame the clapper's outline is drawn within a few pixels of the rim's outline

#### Scenario: Default wind mostly fits
- **WHEN** a furin unit runs for 10 minutes at WIND 0.45
- **THEN** at least 99% of frames have no part of the figure outside the paper

### Requirement: Strike the furin by tapping
Tapping or clicking a furin unit's drawing on the bell SHALL strike it, within its outline or within 6 raster pixels of it, the same way tapping a tube strikes it:
- velocity 96;
- the clapper swings;
- sound plays through the unit's voice;
- a MIDI note is sent on the unit's channel when a port is selected;
- its notes pad flashes.

Tapping elsewhere on the paper SHALL strike nothing, and pressing there SHALL start dragging the unit.

#### Scenario: Tap the bell
- **WHEN** a person taps the middle of the bell
- **THEN** the furin strikes once at velocity 96

#### Scenario: Tap the strip
- **WHEN** a person taps the strip, more than 6 raster pixels from the bell
- **THEN** nothing is struck, and dragging from there moves the unit

### Requirement: Furin voice
The built-in voices SHALL include FURIN, a bright, glassy, inharmonic bell sound. In the SOUNDFONT select it is listed after FM CRYSTAL. It SHALL be playable on any unit, tube chime or furin. Over MIDI its program SHALL be General MIDI's Tinkle Bell. A furin unit with the default voice SHALL sound FURIN, and a tube-chime unit with the default voice SHALL sound tubular bells as before. A voice chosen explicitly SHALL stay the same when the instrument changes. When the instrument changes the default voice's program and SEND PROGRAM CHANGE is on, the new program SHALL be sent on the unit's channel.

#### Scenario: Default furin voice
- **WHEN** a unit with the default voice is switched to FURIN BELL and SOUND is on
- **THEN** its strikes sound FURIN, and its SOUNDFONT select shows FURIN

#### Scenario: Chosen voice kept
- **WHEN** a tube-chime unit plays VIBRAPHONE and is switched to FURIN BELL
- **THEN** its strikes sound VIBRAPHONE

#### Scenario: Program follows the default voice
- **WHEN** SEND PROGRAM CHANGE is on and a unit with the default voice, on channel 2, is switched to FURIN BELL
- **THEN** a program change for Tinkle Bell is sent on channel 2
