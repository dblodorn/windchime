# Design

## Context

See proposal.md (Why) and the specs for behavior. The state this design starts from:

- **Voices.** A unit's `voice` is `null` (the instrument's default), `v<i>` (built-in) or `s0:<p>` (GM preset). The engine plays built-in voices and SF2 presets into each unit's input GainNode → filter → router → bus; `playSF` falls back to `playVoice(VOICES[0])` per note until samples arrive.
- **Links.** Version 1: 2 header bytes, then 19 bytes per unit; voice is a u16 code (0 default, 1+i built-in, 1000+p GM); byte 18 is reserved. One reader per version in `readers`.
- **Saved compositions.** `toSaved`/`fromSaved` map the packed integers to `ChimeUnitInput`/`ChimeUnit`. The API validates `voice` against `catalog.json`, hashes `UNIT_FIELDS` in a fixed order, and appends `instrument` to a unit's entry only when it isn't `chime`, so stored fingerprints never changed when furins arrived. Its Mongo collection has a strict validator.
- **The engine package.** `@dblodorn/casio-vz-engine@0.1.0` (GitHub Packages, MIT): `createSynth(ctx, { workletUrl? })` → `{ output, loadVoice(bytes), noteOn(note, vel), noteOff(note), allNotesOff(), dispose() }`, 16-voice, mono engine on a stereo output; a voice is 336 bytes. It only reads voices: there is no `initVoice` export (that lives in the editor's write side). Its `dmbkLibrary` client needs a key or a proxy; windchime already has its own Relay route.
- **The VZ library.** dmbk-graphql-api `vz-voices`: `dmbkSoundVzVoices(first, after, search ≤ 12)` (newest first) and `node(id)` → `VzVoice { id name data }`, `data` = 448 base64 characters. Stored `_id`s are Mongo ObjectIds; GraphQL ids are Pothos global ids (base64 of `VzVoice:<hex>`).
- **Engine-package convention** (vz10m repo, `openspec/specs/engine-packages`): every emulator is `@dblodorn/<manufacturer>-<model>-engine` with the same `createSynth` surface, and its shared patches live in dmbk-graphql-api.

## Goals / Non-Goals

**Goals**
- One patch-reference shape (synth id + library patch id) used identically in the unit record, links and the API, that a second emulator reuses without a format change.
- Engine and library code stay off the page until a unit uses an external synth.
- Saved compositions without external synths keep byte-identical API input and fingerprints.

**Non-Goals**
- Editing patches in windchime, uploading `.syx`, or sending patches to real VZ hardware over SysEx.
- Reading version 1 share links (dropped by request).
- A generic synth-patches collection in the API: each synth keeps its own collection (`vz_voices`), as today.
- Per-unit stereo from the engine (it's mono on both channels; the unit's OUTPUT routing applies as usual).

## Decisions

### 1. The patch reference: `voice = "x:<synth>"` plus `patch`

A unit on an external synth has `voice: "x:casio-vz"` and a new field `patch: string | null`, where `patch` is the patch's **library id as the 24 lowercase hex characters of its Mongo ObjectId**, and `null` is the synth's INIT. Every other voice has `patch: null`, and the schema forces it so.

- **Synth id = the engine package name without `@dblodorn/` and `-engine`.** `@dblodorn/casio-vz-engine` → `casio-vz`; a future `@dblodorn/yamaha-dx7-engine` → `yamaha-dx7`. The convention names the id, so it is never invented ad hoc. The UI name (CASIO VZ-10M) is separate display text.
- **Why keep it in `voice`** rather than a separate `synth` field: SOUND is one select, and everything already keys on `voice` (the catalog, the API's title words, the MIDI program effect). External synths become one more voice family, beside `v` and `s`.
- **Why raw ObjectId hex, not the GraphQL global id:** it is 12 bytes in a link (a global id is ~32 characters), the format check is exact (`/^[0-9a-f]{24}$/`), and it doesn't depend on how Pothos encodes ids. The synth's entry in windchime knows its GraphQL type, so it builds the global id when fetching. **Constraint this places on future synths:** their library must be a dmbk-graphql-api collection keyed by ObjectId. That already holds for every collection the API owns.
- **Alternative considered:** a generic `{ synth, patch }` object on the unit. It would be cleaner in isolation, but it duplicates SOUND's state and would need a second "which sound is it" check everywhere `voice` is read.

### 2. A synth registry in windchime, `lib/synths.ts`

There is one entry per external synth, appended only (its position is the link code, decision 3):

```ts
type ExternalSynth = {
  id: "casio-vz";              // the voice is "x:" + id
  name: "CASIO VZ-10M";        // SOUND option, sound line
  initName: "INIT";
  init: () => Uint8Array;      // the bundled INIT patch
  patchType: "VzVoice";        // GraphQL type, for node(id) and the global id
  engine: () => Promise<{ createSynth(ctx: BaseAudioContext): Promise<SynthLike> }>; // dynamic import()
};
type SynthLike = { output: AudioNode; loadVoice(b: Uint8Array): void; noteOn(n: number, v: number): void; noteOff(n: number): void; allNotesOff(): void; dispose(): void };
```

`SynthLike` is the convention's common surface, so a DX7 entry differs only in its fields. `engine` is a dynamic `import("@dblodorn/casio-vz-engine")`, so the package (and its inlined worklet) is a separate chunk loaded on first use. The registry has no React and no Relay, so `lib/engine.ts` and `lib/share.ts` can import it in Node.

### 3. Link format version 2

The header is unchanged: version (2) and unit count. Each unit has the 19 version-1 bytes with byte 18 redefined as the **synth code**: 0 for none, 1 + the registry index otherwise. When the synth code is non-zero, **12 patch bytes** follow that unit: the ObjectId, or all zeros for INIT (an all-zero ObjectId is never issued). For such a unit the u16 voice field is written as 0 and ignored.

- Units vary in length, so the reader walks them and rejects a code whose length doesn't come out exact. The longest link (16 units, all external with patches) is 2 + 16 × 31 = 498 bytes → 664 base64url characters + `#c=`, under the 1,000-character limit.
- The version 1 reader is deleted, so a v1 code decodes to `null` and is ignored, per spec. `readers` keeps its shape, so later versions add readers as before (the spec's compatibility promise applies from v2 on).
- **Alternatives:** a u16 voice code range for external synths (e.g. 60000 + index) with patch bytes after it. Rejected because the reserved byte is free and a separate code keeps the voice field's meaning simple. Fixed 31-byte units for everyone: rejected as needless length for the common case.

### 4. API: saved units gain `patch`, catalog gains `x:casio-vz`

This lands in dmbk-graphql-api, in its own change under its `openspec/` (`chime-compositions`):

- `catalog.json` voices add `"x:casio-vz": "CASIO VZ-10M"` (produced by `pnpm catalog`, which reads the registry).
- `ChimeUnitInput.patch: String` and `ChimeUnit.patch: String` are optional and nullable. Zod and the collection validator accept `patch` only as 24 lowercase hex or null. They refuse a non-null patch unless `voice` starts with `x:`, and allow the field to be missing (old documents).
- **Fingerprint:** a unit whose `voice` starts with `x:` has its `patch` (or `null`) appended to its entry, after `instrument` when present. No other unit's entry changes, so every stored fingerprint, and the duplicate check for re-saved old compositions, is unchanged. That is the spec's compatibility requirement, by the same trick the furin used.
- **Title:** `instrumentWord("x:casio-vz")` gives `CASIO VZ-10M` through the catalog, with no patch name lookup (titles stay deterministic from the fingerprint).
- The API does not check that the patch exists: a patch can be deleted after saving anyway, and windchime falls back to INIT (spec).
- **`SynthPatch` interface:** add `interface SynthPatch implements Node { id name data }`, which `VzVoice` implements. Windchime fetches any synth's patch with one operation, `node(id) { ... on SynthPatch { name data } }`, so a DX7 needs no new get operation, only its list field. Listing stays per synth (`dmbkSoundVzVoices`): its arguments and limits belong to each library.

Windchime's `SavedUnitSchema` adds `patch` (nullish → null) and `voice` accepts `x:[a-z0-9-]+`. `toSaved` sends `patch` **only for external units**: a non-external unit's input object is exactly today's, so its JSON (and the fingerprint) can't drift.

### 5. Unit record and storage

`UnitSchema` adds `patch: z.string().regex(/^[0-9a-f]{24}$/).nullable().catch(null)`. A refinement nulls `patch` unless `voice` starts with `x:`. A voice `x:<id>` with an id not in the registry becomes `null` (the default voice). Choosing CASIO VZ-10M sets `patch: null` (INIT), so switching away and back lands on INIT, per spec. COPY clones it. `windchime.units` stays `{ v: 1 }`: the field is additive and `.catch`es.

### 6. Playing: one engine instance per sounding unit

`lib/engine.ts` gets an external-voice path beside `playVoice` and `playSF`:

- When a unit's SOUND turns on (or it switches to an external voice while sounding), `ensureSynth(ch)` calls the registry's `engine()` and `createSynth(Tone's raw context)`, connects `output` → the unit's input GainNode, and loads the current patch bytes (INIT until a shared patch arrives). The promise is per unit; failure is forgotten so the next SOUND on retries (spec).
- `ring` for an external unit: while the synth isn't ready, `playVoice(VOICES[0])`, as `playSF` does today. Otherwise `noteOff(n)` then `noteOn(n, vel)` (a re-strike restarts), plus a timer for `noteOff(n)` after DECAY seconds. The timer is keyed by note, so a re-strike moves it. The engine is real-time (port messages), not scheduled at audio time like Tone voices. A strike's latency is one message hop, well under a sim step.
- Muting needs nothing new: the engine feeds the same input GainNode that `level` ramps. SOUND off on the last external unit calls `allNotesOff()`. `destroy()` and a voice change away call `dispose()`.
- **One instance per unit**, not one shared synth, because each unit has its own patch and its own input/filter. Each instance is a worklet node with 16 voices, and the editor measured the worst case at about 5% of a core. 16 VZ units at full polyphony is the extreme case and is flagged under risks.
- `setPatch(bytes)` on the chime calls `loadVoice`. Notes already sounding keep their voice, which is the engine's own rule.
- **Worklet loading:** the package's default Blob URL. Windchime sends no CSP, so `workletUrl` isn't needed.

### 7. Patch data: `lib/patches.ts`, loaded on demand

A small module, imported dynamically from `Chime.tsx`, owns `getPatch(synth, id)`. As built, a unit with a shared patch fetches it (name and bytes in one request) once it needs either: SOUND on, its notes drawer shown, or its settings open; a page with no such unit makes no request. It runs `fetchQuery` on the existing Relay environment with the `node(id) … on SynthPatch` operation, base64-decodes `data`, checks the length, and caches the promise by `synth:id`, so units share one fetch per visit (spec). A `node` of `null` is "missing": the caller sets the unit's patch to `null` (INIT). A network or API error is forgotten so the next SOUND on or PATCH change retries. Names come back with the data and are cached the same way, so the PATCH row and the sound line show `LOADING…` until then. A unit with a shared patch and SOUND off still fetches its *name* (a small node query) when its popover or notes drawer needs it. The engine never sees Relay.

### 8. PATCH select: `SearchSelect` in remote mode

`components/ui/search-select.tsx` gets an optional remote mode:

- `filter={false}`: show `groups` as given and skip `rank`.
- `onQueryChange(q)`.
- `maxLength`.
- `footer: { kind: "more" | "loading" | "error", onAction }`. MORE and RETRY render as list items that the highlight can reach with the arrow keys and Enter activates without closing (spec).

Everything else (ink portal, fixed height, iOS font size, touch focus) stays shared. The PATCH field is a `next/dynamic` chunk, `components/PatchSelect.tsx`, loaded when a unit on an external synth shows its settings. As built it runs the per-synth list query with Relay's `fetchQuery` (`network-only`) rather than `usePaginationFragment`, so nothing is requested until the list opens and no Suspense boundary is needed. It keeps its own pages (MORE appends the next 20), debounces the search by about 250 ms, and keeps the last list per search, so each opening shows it at once and fetches it again, as COMPOSITIONS does. INIT is prepended client-side and shown when the search is empty or `"init"` contains it. Options are `{ value: patchId, name }`. Choosing one writes `patch` and caches its name in `lib/patches.ts`, so the row shows it at once.

### 9. SOUND list order and rename

`voiceGroups()` builds BUILT-IN SYNTH, then EXTERNAL SYNTHS (one option per registry entry, value `x:<id>`), then the GM groups. The label, `aria` names and the `SearchSelect` listbox name become SOUND. The voice tag on the row shows the synth name, and the PATCH row shows the patch.

### 10. MIDI

`midiProgram()` returns null for an `x:` voice, so the program-change effect sends nothing. Notes and CC74/CC71 are unchanged (spec).

### 11. Installing the package

- `.npmrc` (committed) holds only the scope: `@dblodorn:registry=https://npm.pkg.github.com`. pnpm 12 refuses to expand `${…}` in auth tokens set in a repository's `.npmrc` (security rule), so the token never goes there.
- Locally: a classic PAT with `read:packages` exported as `GITHUB_PACKAGES_TOKEN` in `~/.zshenv`, and `~/.npmrc` holding `//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}` (user-level config does expand env vars).
- On Vercel: the `NPM_RC` env var on the `windchime` project (Production, Preview, Sensitive) holds `//npm.pkg.github.com/:_authToken=<token>`; Vercel writes it to the build machine's user-level `.npmrc`. A plain `GITHUB_PACKAGES_TOKEN` variable alone is not read at install.
- `pnpm-lock.yaml` pins the tarball. `next.config.ts` needs no `transpilePackages`, since the published package is plain ESM with `.d.ts`.
- **Alternative:** a git dependency on the vz10m monorepo's subdirectory. Rejected because the worklet code is generated at build time and isn't in git.

### 12. INIT bytes

`lib/synths/casio-vz-init.ts` exports the 336-byte INIT voice as a base64 constant, generated once with the editor's `initVoice("INIT")` and checked in with a comment naming its source. A Node check asserts that `readVoice` accepts it and `getName` is `INIT`. The convention could later make engine packages export their INIT patch (it is read-only data, so it fits "nothing writes"). That would be a package minor release, not needed now.

## Risks / Trade-offs

- [Vercel build can't reach GitHub Packages (missing or expired token)] → the build fails loudly at install, not at runtime. Document the env var in CLAUDE.md, and use a token with no expiry or put renewal on the calendar.
- [Many VZ units at full polyphony overload weaker devices] → each instance only renders sounding voices. If needed later, cap engine voices per unit (a package option) or share one engine per patch. Measured 2026-11-20 (headless Chromium, Apple M4 Pro, 16 units at WIND 0.8, 10 s): the browser's processes averaged 46.8% of one core with 16 VZ-10M units against 44.3% with 16 default-voice units, the busiest process 24.3% against 22.6%. The engines add about 2.5% of a core; the canvases dominate.
- [The INIT patch is quieter than the built-in voices] → a single strike peaks near 0.09 against about 0.3 for the built-in tubular bells. Real patches vary; whether to trim the engine's level is a listening decision (task 8.5).
- [Engine timing is message-based, not sample-scheduled] → strikes are generated by the 240 Hz sim in rAF anyway, so jitter is at most one render quantum (~3 ms). Acceptable.
- [Dropping v1 links breaks every link already posted] → accepted by the user. Unreadable links are ignored cleanly, not errors.
- [API deployed after windchime] → a VZ save would fail with `BAD_USER_INPUT` (unknown voice) and show `COULD NOT SAVE`. Deploy order below prevents it, and nothing else breaks.
- [A patch is deleted after a composition is saved] → loads on INIT (spec). The fingerprint still includes the old id, which is harmless.
- [The global id format changes in the API] → only `lib/patches.ts` builds global ids, and it does so from `patchType`. One place to fix.
- [Engine calibration changes (package minor releases) change how saved compositions sound] → pin the package version exactly, and bump deliberately with a changelog entry.

## Migration Plan

1. **dmbk-graphql-api:** add `SynthPatch` (implemented by `VzVoice`), `patch` on `ChimeUnit`/`ChimeUnitInput`, the validator and fingerprint rules, and `x:casio-vz` in the catalog. Run `npm run chime:collection -- --apply` for the collection validator, then deploy. Existing documents stay valid (the field is optional).
2. **Windchime:** add `.npmrc` and the Vercel env var, install the package, `pnpm schema:pull`, implement, `pnpm relay` (new operations land in the persisted map), and update CLAUDE.md (voice ids, link v2 bytes, registry, install). Push to `main`.
3. **Rollback:** reverting windchime restores v1 links. v2 links made meanwhile stop opening, and units stored with `x:` voices fall back to the default voice through the old schema's `.catch`. The API change is additive and can stay.

## Open Questions

- Whether the PATCH list should show a patch's creation date or only its name: cosmetic, the default is name only.
