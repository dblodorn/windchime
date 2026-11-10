# Chime

A wind chime simulation in the browser, drawn as 1-bit raster art. Wind pushes a sail, the sail swings a clapper, and every strike is a note: played in the browser and sent live to MIDI hardware.

**Live:** https://chime.dmbk.io · **Changelog:** https://chime.dmbk.io/changelog

## The page

The page holds 1 to 16 chime units. Drag a unit by its paper to move it, and tap a tube (or a note pad) to strike it. Each unit has its own settings, sound, MIDI channel and audio output, and draws in its MIDI channel's color.

Each unit has four round buttons on its drawing:

| Button | What it does |
| --- | --- |
| COPY | Adds a unit with the same settings on the next free MIDI channel |
| SOUND | Turns the unit's browser sound on or off |
| NOTES | Shows a pad per tube, with its note and frequency, to strike by hand |
| SETTINGS | Opens the unit's parameters |

Settings, per unit:

| Setting | What it does |
| --- | --- |
| INSTRUMENT | TUBE CHIME (2–8 tubes) or FURIN BELL (one bell, one note, swung by a paper strip) |
| VOLUME | Browser volume |
| TUBES | 2 to 8 tubes |
| WIND | Strength of the gusting wind |
| DECAY | How long each strike rings (also the MIDI note length) |
| FREQUENCY | Low-pass cutoff, 60 Hz to 15 kHz (MIDI CC74) |
| RESONANCE | Low-pass Q (MIDI CC71) |
| ROOT, OCTAVE | The first tube's note, C-1 to B8 |
| SCALE | 32 scales: Japan and Okinawa, Korea, pentatonic, hexatonic, modes and maqam, chords and series. Searchable |
| SOUNDFONT | The 128 General MIDI instruments and drum kits of the bundled TimGM6mb font, plus 7 built-in voices. Searchable |
| OUTPUT | The audio interface channel pair or single channel |
| CHANNEL | MIDI channel 1–16 |
| MIDI MODE | POLY (shared pitches ring together) or MONO |

Along the bottom right:

- **SHARE** copies a link that carries the whole composition.
- **RESET** starts over with one chime.
- **AUDIO** picks the output device. With a multichannel interface, each unit can go to its own outputs (Chromium browsers, not on phones).
- **MIDI** opens MIDI OUT: the port, program change and filter CCs, TEST NOTE and PANIC (Web MIDI: Chrome, Edge or Firefox on a computer).

With two or more MIDI channels in use, a strip of channel squares appears at the bottom left. Tap one to focus that channel's units; the others fade.

**MENU** (top right) opens COMPOSITIONS, a public list anyone can save to anonymously and open from. Its footer links to the changelog and this repo.

Settings and units are saved in the browser. SOUND always starts off, since browsers only start audio from a tap.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Saving compositions needs `DMBK_GRAPHQL_API_KEY` in `.env.local`. Reading the list works without it.

Built with Next.js 15 (App Router), React 19, [Tone.js](https://tonejs.github.io/), Tailwind CSS v4 and shadcn/ui, in plain JavaScript. The engine (simulation, drawing, audio, SF2 sampler) is `lib/engine.js`, and the UI is `components/Chime.jsx`. `CLAUDE.md` has the full architecture notes. Every push to `main` deploys to production on Vercel.

## Credits

`public/TimGM6mb.sf2` is TimGM6mb by Tim Brechbill, distributed under the GNU GPL v2 (as packaged by Debian's `timgm6mb-soundfont`). The channel and changelog colors come from Sanzo Wada's *A Dictionary of Color Combinations*. The typeface is Knif Mono.
