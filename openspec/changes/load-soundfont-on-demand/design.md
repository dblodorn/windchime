# Design

## Context

See proposal.md for why. Today `Chime`'s mount effect fetches `/TimGM6mb.sf2` whole and calls `E.addFont(ab, "TimGM6mb", true)`. `parseSF2` walks the RIFF chunks of that buffer and keeps the buffer as `f.ab`; `resolvePreset` turns a preset into regions; `sampleBuffer(r)` lazily copies one sample's Int16 PCM out of `f.ab` into an AudioBuffer (cached per sample index); `playSF` plays the regions that match a note. `ring` picks `playSF` whenever the chime has `sfRegions`. MIDI program changes read `sfPreset` (bank, program) and never touch samples.

The file (5,969,788 bytes) is laid out as: RIFF header and INFO (120 bytes), the `sdta` list whose `smpl` chunk holds every sample (5,764,336 bytes), then the `pdta` list with the preset, instrument and sample-header tables (~205 KB) at the end. Production serves it with `Accept-Ranges: bytes`, answers ranged requests with `206`, uncompressed, `Cache-Control: immutable`.

## Goals / Non-Goals

**Goals:**
- Keep `parseSF2`, `resolvePreset`, `sampleBuffer` and `playSF` nearly unchanged; the loader fills in the bytes they read.
- The engine decides when samples are needed (SOUND on, voice change while sounding), so React does no more than start the font load.
- Node can test the loader against the real file with a fake `fetch`.

**Non-Goals:**
- Splitting the `.sf2` into per-preset files or converting it at build time.
- Loading other fonts (there is no upload); `addFont(arrayBuffer)` stays for whole buffers and Node.
- Prefetching likely presets, or a progress indicator.

## Decisions

### 1. A sparse full-size buffer

`loadFont(url, name)` (async, in the SF2 section) allocates one `ArrayBuffer` of the file's full size and copies each downloaded range into it at its own offset. `parseSF2` then reads the header and tables exactly as before, and `sampleBuffer` reads PCM at the same offsets, so neither needs to know which bytes are real. An untouched ArrayBuffer's pages are zero-filled lazily by the browser, so the 6 MB allocation costs little until it is written.

*Alternatives:* a parser over a list of byte ranges (no large allocation, but every `DataView` read in `parseSF2` would go through an offset map); converting the font into per-preset files at build time (more moving parts and a build step for a font that never changes).

### 2. Two requests for the tables

1. `Range: bytes=0-4095`. The response's `Content-Range` gives the total size; walking the RIFF header (the same walk as `parseSF2`, stopping at chunk headers) gives the `sdta` list's end, which is where `pdta` starts. If the header is longer than 4 KB the walk asks for the next 4 KB; INFO is 120 bytes here.
2. `Range: bytes=<pdta start>-<size-1>`: the tables.

Then `parseSF2` runs on the sparse buffer and the font is added as `fonts[0]` with `gm = true`, as now. If either response is `200` (the server ignored the range) its body is the whole file: it is used as is and every sample is marked loaded, so nothing else is fetched.

### 3. Samples per region, merged into few requests

Each font keeps `f.loaded` (sample indices whose bytes are in the buffer, all of them for a whole file) and `f.pending` (sample index → promise). `loadSamples(regions)` collects the regions' sample indices that are neither loaded nor pending, sorts their byte ranges (`smpl.o + start*2` to `smpl.o + end*2`), merges ranges closer than 16 KB, fetches each merged range with one ranged `fetch`, copies it into the buffer and marks its samples loaded. A failed fetch removes its samples from `pending` so a later call tries again. Units on the same preset, or presets sharing samples, find them loaded or pending and fetch nothing.

### 4. The engine triggers loads; strikes fall back per note

A chime calls `loadSamples(ch.sfRegions)` when `setSound(true)` turns it on, and in `chooseVoice` when it picks a soundfont preset while its sound is on. Nothing else loads samples, so MIDI-only use and muted units download none.

`playSF` checks the regions a note actually hits: if any of their samples is not loaded, that note plays through the built-in path with `VOICES[0]` (tubular bells) instead, through the same `ch.graph.input`, so VOLUME and the filter apply. The SOUND confirmation arpeggio goes through `ring` like any strike, so it falls back the same way. The check is per note, so a preset whose low notes have arrived plays them while higher notes still fall back.

*Alternatives:* silence until loaded (the spec rules it out); queueing notes until samples arrive (late notes sound wrong next to the drawing); waiting to turn SOUND on until the samples are in (the tap must start audio at once on iOS).

### 5. React side

`Chime`'s font effect calls `await E.loadFont("/TimGM6mb.sf2", "TimGM6mb")` instead of fetching and calling `addFont`; the rest of the effect (voice reset for unknown presets, `fontsVersion` bump) is unchanged, so the SOUNDFONT list and default voice behave as before. It passes an `AbortSignal` that it aborts on unmount and on `pagehide`, and the catch ignores `AbortError`, which fixes the error logged when a reload interrupts the download. `loadSamples` takes the same signal from the font (`f.signal`), so sample downloads in flight are cancelled on `pagehide` too and don't log.

## Risks / Trade-offs

- [A CDN or proxy strips range support] → a `200` answer is used as the whole file (Decision 2), as today.
- [A cached partial response is inconsistent with a new file after a deploy] → the file is `immutable`; replacing it must use a new filename (already true for share links, which store preset indices).
- [The first notes after SOUND on sound different from the preset] → accepted by the spec; 71 KB usually arrives within the arpeggio's 360 ms.
- [Presets with many scattered samples make many requests] → merging ranges closer than 16 KB. Measured on TimGM6mb: Tubular Bells is 1 sample in 1 request (71 KB), Piano 1 is 9 samples in 1 request (182 KB), Strings is 16 samples in 1 request (705 KB), the Standard drum kit is 46 samples in 3 requests (430 KB), and no preset needs more than 7.
- [Safari's handling of `Range` on `fetch` from the same origin] → it is a standard request header and allowed without CORS preflight on the same origin; checked on a real iPhone before release.

## Migration Plan

No stored data changes. Deploy by merging to `main`. Rollback restores the whole-file fetch; nothing else depends on the loader.
