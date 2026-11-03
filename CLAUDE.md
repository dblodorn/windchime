# Chime (windchime)

A six-tube wind chime simulation. Wind pushes a sail, the sail swings a disc clapper, and every strike on a tube is a note. It plays in the browser (Tone.js + an SF2 sampler) and sends live MIDI to hardware (Web MIDI). The page holds 1–16 chime units (CHIME 1, CHIME 2, …): COPY on a unit makes another with its state, each unit has its own settings, sound and MIDI channel, and all of them share the MIDI port. The page title is "Chime"; there is no on-page heading and no AUDIO or MIDI status line. The engine can still record takes and build `.mid` files (sections 8 and 10), but the UI no longer exposes REC, RENDER or SAVE MIDI, and it has no .sf2 upload: the SOUNDFONT select offers the bundled GM font and the built-in synth voices.

- Live: https://chime.dmbk.io (Vercel project `windchime`, team `db13`; also served at https://windchime-lyart.vercel.app). DNS for dmbk.io is on DigitalOcean: `chime` is a CNAME to the Vercel project target `34679086444df785.vercel-dns-016.com`.
- Repo: https://github.com/dblodorn/windchime. Every push to `main` deploys to production.

## Stack

- Next.js 15 App Router, React 19, plain JavaScript (no TypeScript). Keep it JS unless asked.
- `tone` (Tone.js 15) for the audio graph.
- `motion` (pinned 14.3.0, `motion/react`) for dragging the units.
- Tailwind CSS v4 (via `@tailwindcss/postcss`) and shadcn/ui components on Radix (`radix-ui`), generated in JS. Theme tokens live in `app/globals.css`.
- No test runner yet (see Testing).

## Layout

```
app/layout.jsx       Courier Prime via next/font, metadata, viewport
app/page.jsx         renders <Chime />
app/globals.css      Tailwind imports, 1-bit theme tokens, base layer, a few component rules (canvas, .lead, .tubes .hit)
components/Chime.jsx the whole UI (client component): `Chime` (the unit list, storage, the GM font, MIDI state and the MIDI OUT dialog with its fixed button) and `ChimeUnit` (one unit: drawing, round buttons, SETTINGS popover, notes drawer, its engine instance)
components/ui/popover.jsx hand-written on radix-ui's Popover, in the 1-bit style
components/ui/       shadcn components (button, select, slider, checkbox, dialog), restyled to the 1-bit theme
components.json      shadcn CLI config (style radix-nova, tsx false, aliases @/components, @/lib/utils)
lib/utils.js         cn() (re-exported from shadcn's `cn` package)
postcss.config.mjs   Tailwind PostCSS plugin
lib/engine.js        browser-only engine: createChime() instances, one shared loop and output stage (no React)
lib/midiout.js       Web MIDI output (port lifecycle; notes, CC, program, test note, panic, each on a given channel)
public/TimGM6mb.sf2  bundled General MIDI soundfont (GPL v2, ~6 MB)
```

### lib/engine.js sections, in order

1. **Raster**: 200×200 1-bit scratch buffer (`px`, `line`, `present(ch)`), shared: each chime draws into it in turn and presents it to its own canvas. Black on white only. The figure is still computed in the original 192×232 three-quarter projection and mapped onto the paper by one scale, `toX/toY` with `K = 0.8, TOP = 0`. `seg()` draws a line through that transform, and `outline(cx, cy, rx, ry, n)` is a closed ellipse made of `n` straight `seg`s. K was set from measured extents: the figure fits at rest and in about 99% of frames at WIND 0.45. Stronger gusts clip at the paper edge, by choice; never limit the sim to avoid it.
2. **Pitch and scales**: `noteName`, `mtof`, `cutoffHz(x) = 60·2^(8x)` (slider 0..1 → 60 Hz–15 kHz), `SCALES` (grouped; 32 scales, Ryukyu first, Korea second), `SCALE_LIST`, `sixOf(deg)` (first six notes, climbing octaves).
3. **Params**: `defaultParams()`: each chime has its own `P` (volume, wind, decay, cutX, cutoff, q, root, scale), changed through its `setParams`. A chime's `noteOf(i) = P.root + P.scale[i]`.
4. **Geometry + simulation**: `makeSim(seed)` and `step(sim, P, dt, onHit)` at a fixed 240 Hz. Wind is an Ornstein–Uhlenbeck force with `sqrt(P.wind)` scaling; the clapper is a damped spring; the tubes have their own springs; strikes are impulse collisions with restitution. Velocity is `24 + 1.1·|vr|` (clamped 1..127), with an 80 ms per-tube cooldown. The constants were tuned by measuring strikes per minute (≈1 at wind 0.1, ≈17 at 0.2, ≈57 at 0.45, ≈80 at 0.8). Re-measure if you change them.
5. **Drawing** (*Design By Numbers* style): single-pixel lines only, no fills, so it's a wireframe with no depth sort.
   - Order: wind dashes, hook, ring `outline` (24 segments), tubes, clapper `outline` (16) and sail rectangle.
   - Tubes: `tubeGeom(P, i, tb)` gives each tube's string attach point, top and bottom; `drawTube` draws the string and an outlined body ±`RT` wide.
   - Camera: every drawn sim position goes through `view(x, z)`, a `YAW = 20°` turn about the vertical axis. Without it, tubes 1/3 and 4/6 share a screen x and merge. The sim itself is not rotated.
   - Wind: each chime's `streaks` (`makeStreaks()`) are solid dashes in projection space, wrapping at the paper edges `OX0`/`OX1`.
6. **Audio**: per chime, voices → its native input GainNode (target = VOLUME while its SOUND is on, else 0, ramped about 40 ms by `level`) → its `Tone.Filter` low-pass (FREQUENCY = cutoff, RESONANCE = Q, −12 dB/oct) → the **shared** Compressor → Gain → destination (`master`, built by `setupOutput` on the first `startAudio()`). A chime's graph (`buildGraph`) is made when its SOUND first turns on; its FM `PolySynth` only when it plays FM CRYSTAL. `ring(ch, …)` schedules nothing for a silent chime (SOUND off, VOLUME 0, or `setMuted`). Built-in `VOICES` are additive partials (tubular bells 1/2.756/5.404/8.933, etc.) or the FM synth, each mapped to a GM program for MIDI. `setMuted` silences every chime's browser sound only.
7. **SF2 sampler**: `parseSF2` (RIFF walk, phdr/pbag/pgen/inst/ibag/igen/shdr), `resolvePreset` (merges global and local zones; key/vel ranges, root override, coarse/fine tune, attenuation, pan, loop mode), `sampleBuffer` (lazy Int16 → AudioBuffer, cached per font), `playSF`. SF2 volume envelopes are ignored on purpose: DECAY sets every note's length. Attenuation uses the EMU/FluidSynth 0.4 factor.
8. **Chimes**: `createChime({ seed })` returns one chime: `P`, `noteOf`, `setParams`, `chooseVoice` (returns false and keeps the voice for an unknown preset), `midiProgram`, `setSound(on)` (needs `startAudio()` first; plays a short arpeggio), `onHit(fn)` (listeners get `(tubeIndex, velocity)`), `attach`, `tubeSegments`, `strikeAt`, `strikeTube`, `startRec`/`stopRec`/`recording`, `renderTake(sec)` (offline sim with a fresh seed and 2 s settle) and `destroy()`.
9. **Loop**: a chime's `attach(canvas)` adds it to the `live` set; one shared requestAnimationFrame `tick` steps each live chime at 240 Hz (its own accumulator), moves its streaks and draws it, and stops when the set is empty. `attach` returns the detach. `strikeAt(x, y)` takes paper pixel coordinates (0–200). It strikes the nearest tube within 6 px of its centerline and its height ±6 and returns its index (−1 for empty paper), through `strikeTube(i)`, which the readout's note pads call directly. `tubeSegments()` returns each tube's centerline on the paper (handy for tests). The canvas is `box-content` with a 1px border outside the drawing, so `ChimeUnit` subtracts the 2 px border from the available width, sizes the drawing area to whole multiples of 200 where it fits, sets the readout width to canvas + 2, and maps taps through `clientLeft`/`clientWidth`.
10. **MIDI file**: `buildMidi(take)` → format 0, 480 PPQ, 120 BPM; bank select + program; CC74/CC71 from the take's `cc` list; note-offs after DECAY (cut short by a re-strike of the same note). Drum kits (bank 128) go on channel 10.

### Voice ids

A chime's `chooseVoice(value)`: `"v<i>"` is a built-in voice, `"s<font>:<preset>"` is a preset in `fonts[font]`. The bundled GM font is the only font the UI loads (there is no .sf2 upload), so every `s` id is `s0:<preset>`. A unit's stored `voice` is `null` for the default: GM tubular bells once the font has loaded, the built-in tubular bells before. A stored `s` id the font doesn't have goes back to `null` when the font loads. `addFont` still `unshift`s a GM font to index 0, so if uploads ever come back, existing `s` ids need remapping by +1 when the GM font arrives.

## Constraints and decisions to keep

- **Visual language**: two colors only (pure black lines, white ground), pixelated canvas scaled by whole multiples, Courier Prime for every label. Parameter rows are `LABEL ....... value` with dotted leaders. No color, no rounded corners, no shadows.
  - It is enforced through the theme: every shadcn color token in `app/globals.css` is `#000000` or `#ffffff`, `--accent` is black (so highlights invert), `--radius` and every `--radius-*` are 0, the `--shadow-*` namespaces are cleared, and there is no `.dark` block or `dark` variant.
  - Fonts: next/font exposes Courier Prime as `--font-courier`; `--font-sans`/`--font-mono` point at it. Don't rename it back to `--font-mono`, which would refer to itself in `@theme inline`.
  - Components use text glyphs (`▾`, `▴`, `■`) instead of icons. The exceptions, by request, are the four 30 px round buttons on each unit's canvas, all Lucide icons (`lucide-react`) with `shapeRendering="crispEdges"` so they stay two-color: COPY in the top-left corner (`CopyPlus`, `aria-label="COPY"`, disabled at 16 units), SOUND in the top-right corner (`Volume2`/`VolumeX`, `aria-label="SOUND"`, `aria-pressed`), SETTINGS in the bottom-right corner (`Settings2`, `aria-label="SETTINGS"`, inverted while open), which opens the parameter popover, and NOTES in the bottom-left corner (`EighthNote`, `aria-label="NOTES"`, `aria-pressed`), which shows the tube-note readout. They are also the only rounded elements (`rounded-[50%]`, which the zeroed `--radius-*` tokens don't touch). Don't add other icons or rounded shapes without asking. Focus is `focus-visible:outline-1 outline-dashed outline-foreground outline-offset-3` (no rings, which are box shadows).
  - Adding a component: `pnpm dlx shadcn@4.23.0 add <name>`, then strip `rounded-*`, `shadow-*`, `ring-*`, `dark:*` and lucide icons, and use the dashed focus outline. `lucide-react` is a dependency now (for the four round buttons' icons only); don't use the shadcn CLI's icon imports. The CLI offers to overwrite `button.jsx`: answer no. Overlays get no tint: `dialog.jsx`'s overlay is transparent (it still catches outside clicks), since a grey backdrop would break the two-color rule.
- **Radix specifics in `Chime.jsx`**:
  - Select values must be non-empty strings: numbers go through `String(n)`, and MIDI OUT's NONE is the `"none"` sentinel.
  - `ParamSelect` passes the current choice's text as `SelectValue` children (`display`), because Radix only fills it on the client. `Slider` draws a stand-in thumb until mount for the same reason.
  - `Param` is a `<div>`; controls are named with `aria-labelledby="${id}-label"` (a `<label>` would open selects on click and include the value text in the name).
  - **Units, layout and dragging:** `Chime` holds `units`, an array of plain records `{ id, volume, wind, decay, cutX, q, root, scale (by name), voice, channel, notes, sound, x, y, z }`, changed through `change(id, patch)`. CHIME n is the array index + 1. `<main>` is `fixed inset-0` with 16 px (or safe-area) padding; inside it an `isolate` grid puts every unit in the same centered cell (`[grid-area:1/1]`), so a unit's `x`/`y` (motion values) are offsets from the center. `isolate` keeps the units' `zIndex` (their `z`) below the fixed MIDI button. Each unit is a `motion.section` labelled "CHIME n" (also its `stageRef`, which sizes its canvas) that drags with `dragListener={false}`: the canvas's pointerdown calls `dragControls.start(e)` only when `strikeAt` returns −1, so tubes still strike. `dragConstraints={mainRef}`, no elastic, no momentum; motion keeps it inside on resize. Drag end writes `x`/`y` into the record; the record's position is clamped into the viewport once the canvas has its size (`fitted`). A capture-phase pointerdown brings a unit to the front (`z` = max + 1, renumbered 1…n past 1000). COPY clones the record with a new id, the lowest free channel, the source's current position + 24 px and the top `z`; at most 16 units (`MAX_UNITS`). REMOVE (in the popover while more than one unit exists) ends that channel's notes and drops the record. Units overlap freely, so a copy covers part of its source: tests bring a unit to the front by pressing an uncovered point on its canvas edge before using its buttons. The canvas is `touch-none`. Element ids are prefixed with the unit id (`${id}-p-wind`, `${id}-notes`). The old `html` padding is still there but no longer places anything.
  - **SETTINGS popover:** each unit's nine parameter rows (VOLUME, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, CHANNEL), then REMOVE while more than one unit exists, live in an uncontrolled, non-modal `Popover` named "SETTINGS CHIME n" (`role=dialog`). The values live in the unit record, so they survive the popover closing (Radix unmounts closed content). Opening one unit's popover closes another's (the outside press dismisses it). The page stays in the accessibility tree while it's open, but its controls only exist while it's open: tests must click SETTINGS before driving a parameter by role, and close it (Escape) before tapping a canvas, which it can cover. The drawing is capped at 2× (400 px).
  - **Tube notes drawer:** the six-cell readout (`.tubes`, `#${id}-notes`, a `TUBES` group) is hidden by default. Each cell is a note pad `<button>` (`py-2`) showing the note and its Hz (no T1–T6 labels) that calls the unit's `strikeTube(i)`: on `pointerdown` like the canvas, and on keyboard clicks (`detail === 0`) so Enter/Space work without double strikes. The pads must not set their own background: `.tubes .hit` lives in the components layer and a utility would beat it. NOTES shows it at once (no tween, by request) under the drawing, with no top border so it shares the canvas's bottom border. While off it is `hidden` (display none), but its cells still get the flash class on strikes. Shown or hidden is saved per unit (`notes`).
  - **MIDI OUT dialog:** the shared MIDI OUT controls (port, SEND options, PLAY SOUND IN BROWSER TOO, TEST NOTE, PANIC; not CHANNEL, which is per unit in its popover) live in a controlled `Dialog` (`midiOpen`) opened by the MIDI button, which is fixed to the lower right with `aria-label="MIDI"` and shows `MidiLogo`, the inline MMA wordmark from Wikimedia Commons with `crispEdges` at a whole-pixel size. All MIDI state stays in `Chime`, so MIDI keeps running while the dialog is closed (Radix unmounts closed content). TEST NOTE plays every unit's first tube on its channel; PANIC calls `allNotesOff` with every unit's channel. The button gets `data-live`, which inverts it, while a connected port is selected. While the dialog is open, the page behind it is hidden from the accessibility tree, so tests that find the button by role must close the dialog first. The settings popover is also a `role=dialog`: find the MIDI dialog by name ("MIDI OUT") or `[data-slot=dialog-content]`.
- **Audio must start inside a tap** (Safari/iOS). `preloadAudio()` runs on mount so a unit's SOUND tap can call `E.startAudio()`, which builds the shared output and calls `Tone.start()` + `resume()` synchronously in the click; only then does `ChimeUnit` turn that unit's sound on. `unlockAudio()` sets `navigator.audioSession.type = "playback"` and loops a silent `<audio>` so the iOS ring/silent switch doesn't mute it; it's paused when the last unit's sound goes off. SOUND is never stored, so every unit loads muted. Don't move audio setup out of the gesture path.
- **SSR**: `Chime.jsx` is `"use client"` but still prerenders. `lib/engine.js` and `lib/midiout.js` must not touch `window`/`document`/`navigator` at module top level; Tone is imported dynamically. Never read a browser capability during render (for example `disabled={!M.supported()}`): the server renders `false`, and React does not fix mismatched attributes during hydration, so the stale value sticks. Hold it in state that starts `null` and is set in a mount effect (see `midiSupported`).
- **Web MIDI** asks for permission only from the CONNECT MIDI click, never on load. Settings persist in `localStorage` under `windchime.*`: the port name and the SEND options as before, and the units as `windchime.units` = `{ v: 1, units }` (records without `sound`), written 250 ms after the last change. On load each record is checked: unknown scale names fall back to RYUKYU, numbers are clamped to their ranges, channel to 1–16, more than 16 records are cut, an unreadable value gives one default unit. With no `windchime.units`, CHIME 1 takes the single-unit keys `windchime.pos` and `windchime.midiCh`, which are removed after the first save. The server renders one default unit; the stored list replaces it in a mount effect.
- **MIDI port lifecycle** lives in `lib/midiout.js`, not React. `wanted` is the chosen (or remembered, `windchime.midiOutName`) port *name*; it survives unplugging. `adopt()` runs after `connect()` and on every `statechange`: it selects the connected port named `wanted`, or on connect the only port there is. `setLive(port)` is the only writer of `output`; it calls `port.open()` and bumps `linkSeq`. On disconnect the note-off timers are dropped without sending. Every message takes its channel (1–16) first: `note(ch, n, vel, s)`, `testNote(ch, n)`, `program(ch, bank, prog)`, `cc(ch, num, v)`; note-off timers are keyed `channel:note`, so the re-strike rule is per channel. `endNotes(ch)` ends one channel's notes (a unit changing channel or being removed; it also ends another unit's notes on the same channel). `allNotesOff(channels)` ends every note, then sends CC123/CC120 on each listed channel. `status()` returns one snapshot for the UI; each `ChimeUnit` keys its program-change/CC effects on `status().linkSeq` and its own voice, filter and channel, so a port that becomes live (chosen, auto-picked, replugged with the same id) gets the setup exactly once. A failed `requestMIDIAccess` is not cached, so CONNECT MIDI can be retried.
- **Strict mode** is on: effects run twice in dev. Engine listeners return unsubscribe functions; keep it that way.

## Commands

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm start      # serve the production build
```

There are no `lint` or `test` scripts. The package manager is pnpm: `pnpm-lock.yaml` is committed and Vercel installs from it with a frozen lockfile, so update it (`pnpm install`) whenever `package.json` changes or the deploy fails. Don't add a `package-lock.json` alongside it.

## Testing

No automated tests yet. What has worked so far:

- **Engine in Node**: `lib/engine.js` imports cleanly in Node (no DOM at top level). You can `addFont` the `.sf2` from `public/`, make a chime with `createChime({ seed })`, and call its `chooseVoice`, `setParams` and `renderTake(60)`, then `buildMidi`, without a browser. Smoke test: `node -e 'import("./lib/engine.js").then(m => console.log(m.SCALE_LIST.length, typeof m.createChime))'` (prints `32 function`). Node warns that the module type isn't specified, because `package.json` has no `"type": "module"`. That's harmless. Don't add the field without checking `next build`.
- **UI in headless Chromium**: Playwright is fine for this. Stub `navigator.requestMIDIAccess` with fake outputs that record `send()` calls, and check the bytes (`0x9n`/`0x8n` on the chosen channel, `0xBn 74/71`, `0xBn 123` on PANIC). Drive controls by role and name (`getByRole("combobox" | "slider" | "checkbox", { name })`); native `selectOption` and input value setters no longer apply. Radix moves select focus on the next tick, so space keystrokes ~50 ms apart. Don't run `next dev` while `next start` serves the same `.next` directory: dev overwrites the production build output.
- Things only a person can check: real audio output, iOS behavior, real MIDI hardware.

Good first additions would be Vitest unit tests for `parseSF2`/`resolvePreset`, `buildMidi` byte output, `sixOf`, and strike-rate regression for the sim.

## Deploying

Pushing to `main` deploys production on Vercel (project `windchime`, team `db13`). Other branches get preview deployments behind Vercel login (standard deployment protection). Static files in `public/` are served as-is; `next.config.mjs` sets long caching and an octet-stream type for `.sf2`.

## Ideas not done yet

- MIDI input (strike tubes from a controller), MIDI clock sync
- Vitest
- Per-tube tuning in cents (true wind-chime tunings, not just 12-TET), and microtonal scales sent as MIDI pitch bend
- Reverb/space, stereo spread of tubes
- Saving and sharing presets (URL hash or JSON)
