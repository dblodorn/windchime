# Tasks

## 1. Setup

- [x] 1.1 Create branch `load-soundfont-on-demand` from an up-to-date `main`; verify `git status` shows only the change's own files
- [x] 1.2 Write a scratchpad Node harness with a fake `fetch` that serves `public/TimGM6mb.sf2` honouring `Range` (206 with `Content-Range`), or ignoring it (200, whole file), or failing on demand, and that records every request's range and byte count; verify it serves `bytes=0-99` as 100 bytes with status 206

## 2. Engine: loader

- [x] 2.1 Add `loadFont(url, name, { signal })` to the SF2 section: fetch `bytes=0-4095`, read the total size from `Content-Range`, walk the RIFF header to find where `pdta` starts (asking for more header bytes if needed), fetch `pdta` to the end, copy both into a full-size `ArrayBuffer`, run `parseSF2` on it, and add the font as `fonts[0]` with `gm = true`, `loaded` (empty Set), `pending` (Map) and the signal kept on the font. Verify with the harness that it makes exactly 2 requests totalling at most 300 KB, and that the presets, `findPreset(0, 0, 14)` and `resolvePreset` output equal those of `addFont` on the whole file
- [x] 2.2 Handle a `200` answer to either request: use its body as the whole buffer, mark every sample loaded, and fetch nothing more; verify with the harness in "ignore Range" mode that there is exactly 1 request and every preset's regions read as loaded
- [x] 2.3 Add `loadSamples(f, regions)`: collect the sample indices that are neither loaded nor pending, sort their byte ranges, merge ranges closer than 16 KB, fetch each with one ranged request, copy it into the buffer and mark its samples loaded; on failure drop them from `pending`. Verify with the harness: Tubular Bells → 1 request of 71,298 bytes; calling it twice at once → still 1 request; Standard drum kit → 3 requests; a failed fetch followed by a second call → the second call fetches again; the PCM `sampleBuffer` would read for each loaded sample equals the same bytes from the whole file
- [x] 2.4 Call `loadSamples` from `setSound(true)` and from `chooseVoice` when a soundfont preset is picked while sound is on; nowhere else. Verify with the harness and a chime in Node: `chooseVoice` on a muted chime makes no request; `setSound(true)` (with a stubbed audio context) requests that preset's samples; MIDI program from `midiProgram()` is the same before and after samples load
- [x] 2.5 In `playSF`, play a note through the built-in `VOICES[0]` path (same `ch.graph.input`) when any sample of the regions it hits isn't loaded; factor the built-in path out of `ring` so both use it. Verify in Node with a stubbed audio context that a strike before samples arrive creates oscillators (built-in path), and one after creates a buffer source

## 3. Components

- [x] 3.1 Replace the font effect's fetch and `addFont` with `E.loadFont("/TimGM6mb.sf2", "TimGM6mb", { signal })`, with an `AbortController` aborted on unmount and on `pagehide`, and ignore `AbortError` in the catch; keep the voice reset and `fontsVersion` bump. Verify `pnpm build` passes
- [x] 3.2 Verify with Playwright (production build) counting response bytes for `/TimGM6mb.sf2`: a first visit transfers at most 300 KB and the SOUNDFONT select lists the GM presets with TUBULAR BELLS chosen; after SOUND on (default voice) the total is at most 400 KB; picking CHURCH ORGAN while muted adds nothing, then SOUND on fetches it; two units on the same preset turning SOUND on fetch its samples once; with a MIDI port stubbed and SOUND off, a minute of strikes sends program change and notes and fetches no samples
- [x] 3.3 Verify the fallback with Playwright: delay the sample response by 2 s, turn SOUND on, and check (through an instrumented `AudioContext` that counts `createOscillator` and `createBufferSource`) that strikes in the first 2 s use oscillators and later strikes use buffer sources; then make sample requests fail, turn SOUND off and on, and check a new sample request is made
- [x] 3.4 Verify with Playwright that a server ignoring `Range` (route returning 200 with the whole file) gives one download and presets still play from buffer sources
- [x] 3.5 Run the earlier UI suite (`ui.cjs`) five times and verify the "no console errors" check passes every time

## 4. Docs and finish

- [x] 4.1 Update CLAUDE.md: the SF2 section (sparse buffer, `loadFont`, `loadSamples`, `loaded`/`pending`, when samples load, per-note fallback to built-in tubular bells, whole-file fallback on `200`), the font-loading notes and the voice ids section; verify by reading the diff
- [x] 4.2 Run `pnpm build` and `openspec validate load-soundfont-on-demand --strict`; verify both pass. List for the PR what only a person can check: real audio on a slow connection, and ranged loading in Safari on an iPhone
