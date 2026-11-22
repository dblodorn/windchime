# Proposal

## Why

The Casio VZ-10M emulator is now a package (`@dblodorn/casio-vz-engine@0.1.0`), built so windchime can use it as a sound source, and the VZ-10M editor already shares voices to dmbk-graphql-api (`vz-voices`). Windchime can only play its built-in synths and the bundled GM soundfont today. Adding the VZ-10M gives each unit a real synth with a public, growing patch library, and puts SOUND on a footing where more emulators (a DX7 next, by the engine-package convention) slot in the same way: the patch reference stored in units, links and saved compositions is designed once for all of them, not for the VZ-10M alone.

## What Changes

- The SOUNDFONT row is renamed **SOUND** (label, accessible name, listbox name, popover order unchanged).
- The SOUND list is reordered: **BUILT-IN SYNTH** first, then a new **EXTERNAL SYNTHS** group holding **CASIO VZ-10M**, then the GM soundfont's groups.
- Choosing CASIO VZ-10M shows a second row under SOUND, **PATCH**, a searchable select of the shared VZ voices from dmbk-graphql-api (`dmbkSoundVzVoices`, newest first, paged, searchable by name), with **INIT** first and chosen by default. INIT is bundled in windchime (the VZ initial voice), not fetched.
- A VZ-10M unit plays through `createSynth` from `@dblodorn/casio-vz-engine` into the same VOLUME → filter → OUTPUT chain as every other voice, honouring DECAY as the note length like the other voices. The engine (worklet) loads only when a unit sounding with the VZ-10M needs it, and the patch list is fetched only when the PATCH select opens, so the page and units that don't use it fetch nothing new.
- The unit's patch is part of the unit record: stored locally, carried in share links and in saved compositions. A patch that can no longer be fetched (deleted, hidden) falls back to INIT.
- **BREAKING** (share links only): links get a new format version that carries the patch; links made before this change no longer open (they are ignored like any unreadable link). Saved compositions stay fully compatible: every composition saved before this change loads exactly as before, and a composition without a VZ-10M unit saves the same data as before, so the API still recognizes it as a duplicate.
- MIDI out for a VZ-10M unit sends notes and CCs as usual and no bank/program change (the VZ has no GM program; MIDI users pick the sound on their own gear).
- The notes drawer's sound line reads the patch name, for example `CASIO VZ-10M · KILLER ORGAN · RYUKYU`.
- **Cross-repo:** dmbk-graphql-api's chime composition shape and catalog learn the VZ-10M voice and a unit's patch id, so compositions using it can be saved and listed; windchime's `/api/graphql` allowlist gains the VZ voice list and get operations.

## Capabilities

### New Capabilities
- `external-synths`: emulated hardware synths as a unit's sound, with the CASIO VZ-10M as the first: one patch-reference shape for every synth (the synth's id plus a patch id in that synth's library, none meaning the synth's bundled INIT), loading an engine on demand, the PATCH picker (INIT default, listing, search, paging, fetch failure), patch fallback, and how a synth plays through the unit's chain and MIDI. Future emulators (a DX7 next) add a synth id and a library, not a new storage shape.

### Modified Capabilities
- `ui-controls`: SOUNDFONT renamed SOUND; the SOUND list's group order (built-in, then external synths, then the GM soundfont); the PATCH row shown only for the VZ-10M; popover row counts; the sound line naming the patch.
- `soundfont-loading`: requirement texts refer to the SOUNDFONT select, now SOUND; no behavior change beyond the name, and the VZ-10M downloads no soundfont samples.
- `share-links`: a new link version carries the VZ-10M voice and its patch; links from earlier versions are no longer required to open.
- `saved-compositions`: saved units carry the VZ-10M voice and patch, and load back to the same patch; earlier saves load unchanged.
- `midi-output`: a VZ-10M unit sends no bank select or program change.

## Impact

- **Code:** `lib/engine.ts` (a VZ voice path alongside built-in and SF2, routed into the unit's input), `components/Chime.tsx` (SOUND rename and order, PATCH row, sound line), `components/ui/search-select.tsx` (async, paged options if needed), `lib/share.ts` (unit schema, link encoding, `toSaved`/`fromSaved`), Relay operations for VZ voices and `lib/server/persisted-operations.json`, `lib/changelog.ts`.
- **Dependency:** `@dblodorn/casio-vz-engine` from GitHub Packages, which needs an `.npmrc` with the `@dblodorn` registry and a `read:packages` token for local installs and for Vercel builds (an env var on the `windchime` project).
- **API:** dmbk-graphql-api's `chime-compositions` (unit shape, validator, catalog, fingerprint rules) changes in its own repo and must deploy before windchime saves VZ compositions. Windchime's schema copy is refreshed with `pnpm schema:pull`.
- **Links:** the version 1 link has one reserved byte per unit, not room for a patch id, so the link format moves to version 2 (layout decided in design) and the version 1 reader is dropped. Links already posted anywhere stop opening.
- **Docs:** `CLAUDE.md` (voice ids, link bytes, new layout entries).
