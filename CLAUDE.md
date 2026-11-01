# Six Tube Chime (windchime)

A six-tube wind chime simulation. Wind pushes a sail, the sail swings a disc clapper, and every strike on a tube is a note. It plays in the browser (Tone.js + an SF2 sampler), sends live MIDI to hardware (Web MIDI), and exports `.mid` files.

- Live: https://chime.dmbk.io (Vercel project `windchime`, team `db13`; also served at https://windchime-lyart.vercel.app). DNS for dmbk.io is on DigitalOcean: `chime` is a CNAME to the Vercel project target `34679086444df785.vercel-dns-016.com`.
- Repo: https://github.com/dblodorn/windchime. Every push to `main` deploys to production.

## Stack

- Next.js 15 App Router, React 19, plain JavaScript (no TypeScript). Keep it JS unless asked.
- `tone` (Tone.js 15) for the audio graph.
- Tailwind CSS v4 (via `@tailwindcss/postcss`) and shadcn/ui components on Radix (`radix-ui`), generated in JS. Theme tokens live in `app/globals.css`.
- No test runner yet (see Testing).

## Layout

```
app/layout.jsx       Courier Prime via next/font, metadata, viewport
app/page.jsx         renders <Chime />
app/globals.css      Tailwind imports, 1-bit theme tokens, base layer, a few component rules (canvas, .lead, .tubes .hit)
components/Chime.jsx the whole UI (client component): state, controls, MIDI OUT dialog and its fixed MIDI button
components/ui/       shadcn components (button, select, slider, checkbox, dialog), restyled to the 1-bit theme
components.json      shadcn CLI config (style radix-nova, tsx false, aliases @/components, @/lib/utils)
lib/utils.js         cn() (re-exported from shadcn's `cn` package)
postcss.config.mjs   Tailwind PostCSS plugin
lib/engine.js        browser-only engine (module-level state, no React)
lib/midiout.js       Web MIDI output (port lifecycle, channel, notes, CC, test note, panic)
public/TimGM6mb.sf2  bundled General MIDI soundfont (GPL v2, ~6 MB)
```

### lib/engine.js sections, in order

1. **Raster**: 200×200 1-bit buffer (`px`, `line`, `present`). Black on white only. The figure is still computed in the original 192×232 three-quarter projection and mapped onto the paper by one scale, `toX/toY` with `K = 0.8, TOP = 0`. `seg()` draws a line through that transform, and `outline(cx, cy, rx, ry, n)` is a closed ellipse made of `n` straight `seg`s. K was set from measured extents: the figure fits at rest and in about 99% of frames at WIND 0.45. Stronger gusts clip at the paper edge, by choice; never limit the sim to avoid it.
2. **Pitch and scales**: `noteName`, `mtof`, `cutoffHz(x) = 60·2^(8x)` (slider 0..1 → 60 Hz–15 kHz), `SCALES` (grouped; 27 scales, Ryukyu first), `SCALE_LIST`, `sixOf(deg)` (first six notes, climbing octaves).
3. **Params**: the single mutable object `P` (wind, decay, cutX, cutoff, q, root, scale). React pushes into it with `setParams`. `noteOf(i) = P.root + P.scale[i]`.
4. **Geometry + simulation**: `makeSim(seed)` and `step(sim, dt, onHit)` at a fixed 240 Hz. Wind is an Ornstein–Uhlenbeck force with `sqrt(P.wind)` scaling; the clapper is a damped spring; the tubes have their own springs; strikes are impulse collisions with restitution. Velocity is `24 + 1.1·|vr|` (clamped 1..127), with an 80 ms per-tube cooldown. The constants were tuned by measuring strikes per minute (≈1 at wind 0.1, ≈17 at 0.2, ≈57 at 0.45, ≈80 at 0.8). Re-measure if you change them.
5. **Drawing** (*Design By Numbers* style): single-pixel lines only, no fills, so it's a wireframe with no depth sort.
   - Order: wind dashes, hook, ring `outline` (24 segments), tubes, clapper `outline` (16) and sail rectangle.
   - Tubes: `tubeGeom(i, tb)` gives each tube's string attach point, top and bottom; `drawTube` draws the string and an outlined body ±`RT` wide.
   - Camera: every drawn sim position goes through `view(x, z)`, a `YAW = 20°` turn about the vertical axis. Without it, tubes 1/3 and 4/6 share a screen x and merge. The sim itself is not rotated.
   - Wind: `streaks` are solid dashes in projection space, wrapping at the paper edges `OX0`/`OX1`.
6. **Audio**: chain is voices → native `bus` GainNode → `Tone.Filter` low-pass (FREQUENCY = cutoff, RESONANCE = Q, −12 dB/oct) → Compressor → Gain → destination. Built-in `VOICES` are additive partials (tubular bells 1/2.756/5.404/8.933, etc.) or a Tone `PolySynth(FMSynth)`, each mapped to a GM program for MIDI. `setMuted` silences the browser sound only.
7. **SF2 sampler**: `parseSF2` (RIFF walk, phdr/pbag/pgen/inst/ibag/igen/shdr), `resolvePreset` (merges global and local zones; key/vel ranges, root override, coarse/fine tune, attenuation, pan, loop mode), `sampleBuffer` (lazy Int16 → AudioBuffer, cached per font), `playSF`. SF2 volume envelopes are ignored on purpose: DECAY sets every note's length. Attenuation uses the EMU/FluidSynth 0.4 factor.
8. **Recording / takes**: `startRec`/`stopRec` (live, with filter CC changes), `renderTake(sec)` (offline sim with a fresh seed and 2 s settle), `onHit(fn)` listeners get `(tubeIndex, velocity)`.
9. **Loop**: `attach(canvas)` starts requestAnimationFrame and returns the cleanup. `strikeAt(x, y)` takes paper pixel coordinates (0–200). It strikes the nearest tube within 6 px of its centerline and its height ±6. `tubeSegments()` returns each tube's centerline on the paper (handy for tests). The canvas is `box-content` with a 1px border outside the drawing, so `Chime.jsx` subtracts the 2 px border from the available width, sizes the drawing area to whole multiples of 200 where it fits, sets the readout width to canvas + 2, and maps taps through `clientLeft`/`clientWidth`.
10. **MIDI file**: `buildMidi(take)` → format 0, 480 PPQ, 120 BPM; bank select + program; CC74/CC71 from the take's `cc` list; note-offs after DECAY (cut short by a re-strike of the same note). Drum kits (bank 128) go on channel 10.

### Voice ids

`chooseVoice(value)`: `"v<i>"` is a built-in voice, `"s<font>:<preset>"` is a preset in `fonts[font]`. The bundled GM font is `unshift`ed to index 0 when it loads, so `Chime.jsx` remaps any `s` id by +1 at that moment. Keep that in mind if you change how fonts load.

## Constraints and decisions to keep

- **Visual language**: two colors only (pure black lines, white ground), pixelated canvas scaled by whole multiples, Courier Prime for every label. Parameter rows are `LABEL ....... value` with dotted leaders. No color, no rounded corners, no shadows.
  - It is enforced through the theme: every shadcn color token in `app/globals.css` is `#000000` or `#ffffff`, `--accent` is black (so highlights invert), `--radius` and every `--radius-*` are 0, the `--shadow-*` namespaces are cleared, and there is no `.dark` block or `dark` variant.
  - Fonts: next/font exposes Courier Prime as `--font-courier`; `--font-sans`/`--font-mono` point at it. Don't rename it back to `--font-mono`, which would refer to itself in `@theme inline`.
  - Components use text glyphs (`▾`, `▴`, `■`) instead of icons; there is no icon library. Focus is `focus-visible:outline-1 outline-dashed outline-foreground outline-offset-3` (no rings, which are box shadows).
  - Adding a component: `pnpm dlx shadcn@4.23.0 add <name>`, then strip `rounded-*`, `shadow-*`, `ring-*`, `dark:*` and lucide icons, and use the dashed focus outline. Remove `lucide-react` from `package.json` if the CLI adds it back. The CLI offers to overwrite `button.jsx`: answer no. Overlays get no tint: `dialog.jsx`'s overlay is transparent (it still catches outside clicks), since a grey backdrop would break the two-color rule.
- **Radix specifics in `Chime.jsx`**:
  - Select values must be non-empty strings: numbers go through `String(n)`, and MIDI OUT's NONE is the `"none"` sentinel.
  - `ParamSelect` passes the current choice's text as `SelectValue` children (`display`), because Radix only fills it on the client. `Slider` draws a stand-in thumb until mount for the same reason.
  - `Param` is a `<div>`; controls are named with `aria-labelledby="${id}-label"` (a `<label>` would open selects on click and include the value text in the name).
  - Page padding is on `html`, not `body`: Radix's scroll lock rewrites body padding while a select or the dialog is open. The bottom padding (76 px plus the safe area) leaves room for the fixed MIDI button.
  - **MIDI OUT dialog:** the MIDI OUT controls live in a controlled `Dialog` (`midiOpen`) opened by the MIDI button, which is fixed to the lower right with `aria-label="MIDI"` and shows `MidiLogo`, the inline MMA wordmark from Wikimedia Commons with `crispEdges` at a whole-pixel size. All MIDI state and effects stay in `Chime`'s body, so MIDI keeps running while the dialog is closed (Radix unmounts closed content). The button gets `data-live`, which inverts it, while a connected port is selected. While the dialog is open, the page behind it is hidden from the accessibility tree, so tests that find the button by role must close the dialog first.
- **Audio must start inside a tap** (Safari/iOS). `preloadAudio()` runs on mount so `toggleSound()` can build the graph and call `Tone.start()` + `resume()` synchronously in the click. `unlockAudio()` sets `navigator.audioSession.type = "playback"` and loops a silent `<audio>` so the iOS ring/silent switch doesn't mute it. Don't move audio setup out of the gesture path.
- **SSR**: `Chime.jsx` is `"use client"` but still prerenders. `lib/engine.js` and `lib/midiout.js` must not touch `window`/`document`/`navigator` at module top level; Tone is imported dynamically. Never read a browser capability during render (for example `disabled={!M.supported()}`): the server renders `false`, and React does not fix mismatched attributes during hydration, so the stale value sticks. Hold it in state that starts `null` and is set in a mount effect (see `midiSupported`).
- **Web MIDI** asks for permission only from the CONNECT MIDI click, never on load. Settings persist in `localStorage` under `windchime.*`.
- **MIDI port lifecycle** lives in `lib/midiout.js`, not React. `wanted` is the chosen (or remembered, `windchime.midiOutName`) port *name*; it survives unplugging. `adopt()` runs after `connect()` and on every `statechange`: it selects the connected port named `wanted`, or on connect the only port there is. `setLive(port)` is the only writer of `output`; it calls `port.open()` and bumps `linkSeq`. On disconnect the note-off timers are dropped without sending. `status()` returns one snapshot for the UI; `Chime.jsx` keys the program-change/CC resend effects on `status().linkSeq`, so a port that becomes live (chosen, auto-picked, replugged with the same id) gets the setup exactly once. A failed `requestMIDIAccess` is not cached, so CONNECT MIDI can be retried.
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

- **Engine in Node**: `lib/engine.js` imports cleanly in Node (no DOM at top level). You can `addFont` the `.sf2` from `public/`, `chooseVoice`, `setParams`, `renderTake(60)`, and `buildMidi` without a browser. Smoke test: `node -e 'import("./lib/engine.js").then(m => console.log(m.SCALE_LIST.length))'` (prints 27). Node warns that the module type isn't specified, because `package.json` has no `"type": "module"`. That's harmless. Don't add the field without checking `next build`.
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
