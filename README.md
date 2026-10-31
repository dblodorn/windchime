# Six Tube Chime

A six-tube wind chime simulated in the browser and drawn as 1-bit raster art. Wind pushes a sail, the sail swings a disc clapper, and every strike on a tube becomes a MIDI note.

## Controls

| Control | What it does |
| --- | --- |
| WIND | Strength of the gusting wind on the sail |
| DECAY | How long each strike rings (also the MIDI note length) |
| FREQUENCY | Low-pass filter cutoff, 60 Hz to 15 kHz (MIDI CC74) |
| RESONANCE | Low-pass filter Q, 0.5 to 18 (MIDI CC71) |
| ROOT | Pitch of the first tube, C3 to C6 |
| SCALE | 27 tunings, including Ryukyu, in-sen, hirajoshi, pelog, Hijaz and the harmonic series |
| SOUNDFONT | All 128 General MIDI instruments and 8 drum kits from the bundled TimGM6mb font, six synthesized voices, and any `.sf2` file you add |

MIDI OUT sends every strike live to a hardware or virtual MIDI port (Web MIDI: Chrome, Edge or Firefox on a computer). Pick the interface and channel 1–16; program changes and the filter (CC74 / CC71) can go out too, and PANIC sends All Notes Off. Untick PLAY SOUND IN BROWSER TOO to hear only the device.

REC captures the live chime; RENDER 2:00 simulates two minutes instantly. SAVE MIDI writes a format-0 `.mid` with the chosen bank and program, so it renders with the same instrument in any SoundFont player.

## Run it

```bash
npm install
npm run dev
```

Built with Next.js (App Router), React and [Tone.js](https://tonejs.github.io/). The engine lives in `lib/engine.js`; the UI is `components/Chime.jsx`.

## Credits

`public/TimGM6mb.sf2` is TimGM6mb by Tim Brechbill, distributed under the GNU GPL v2 (as packaged by Debian's `timgm6mb-soundfont`).
