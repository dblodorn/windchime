# Proposal

## Why

Every visit downloads the whole 6 MB General MIDI soundfont (`public/TimGM6mb.sf2`) on load, even when no unit ever turns its SOUND on, which is costly on phones and slow connections. 96% of the file is audio samples, and the default sound (GM Tubular Bells) needs only 71 KB of them. A reload during that download also aborts it and logs an error, which makes the UI test suite flaky.

## What Changes

- On load, fetch only the soundfont's preset and instrument tables (about 205 KB at the end of the file) with an HTTP range request. The SOUNDFONT list, the default voice and MIDI program numbers work from these tables as they do today.
- Fetch a preset's samples only when they are needed to make sound: when a unit using that preset turns SOUND on, or when a sounding unit switches to it (also the SOUND confirmation arpeggio). Each sample is fetched once and kept for the visit; presets that share samples share the fetch.
- Until a preset's samples have arrived, a strike on that unit plays the built-in tubular bells voice instead of staying silent; MIDI output is unchanged throughout (it never depended on samples).
- Units that only send MIDI, or have SOUND off, never download samples.
- If the server ignores range requests (answers with the whole file), the page uses the whole file as it does today. A failed or aborted fetch is not reported as a console error when the page is going away.
- The default composition downloads about 280 KB instead of 6 MB.

## Capabilities

### New Capabilities
- `soundfont-loading`: when and how much of the bundled General MIDI soundfont is downloaded, what plays while samples are on their way, and the fallback for servers without range requests.

### Modified Capabilities
<!-- none: the SOUNDFONT select, voices, MIDI program changes and share links keep their current requirements -->

## Impact

- `lib/engine.js`: SF2 section. Parse the tables from a partial buffer (`smpl` offset and size from the RIFF header, table chunks from the tail), make sample loading asynchronous with an in-flight cache per sample, a `loadPreset` (or similar) that fetches the byte ranges a preset's regions need, and a fallback in the sound path when a region's buffer isn't ready.
- `components/Chime.jsx`: the font-loading mount effect fetches the tables instead of the whole file; SOUND on and voice changes ask the engine to load that preset's samples.
- `next.config.mjs`: `.sf2` caching stays; range requests are served by Vercel's CDN (checked: production answers `206 Partial Content`).
- No new dependencies. Stored voice ids (`s0:<preset>`) and share links are unchanged.
- CLAUDE.md: SF2 section and the font-loading notes.
