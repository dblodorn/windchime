# Tasks

## 1. dmbk-graphql-api (separate repo, its own OpenSpec change; deploy before windchime ships)

- [x] 1.1 Add `interface SynthPatch implements Node { id name data }` and make `VzVoice` implement it; verify `node(id) { ... on SynthPatch { name data } }` returns a stored VZ voice in the API's tests
- [x] 1.2 Add optional, nullable `patch: String` to `ChimeUnit` and `ChimeUnitInput`, and in `shape.ts` (Zod + `compositionJsonSchema`) accept only 24 lowercase hex or null, refusing a non-null patch unless `voice` starts with `x:`; verify tests for valid, malformed and patch-on-non-external inputs
- [x] 1.3 Append `patch ?? null` to a unit's fingerprint entry only for `x:` voices (after `instrument`); verify a test pins an existing tube-chime and furin fingerprint unchanged and shows two VZ compositions differing only in patch hash differently
- [x] 1.4 Add `"x:casio-vz": "CASIO VZ-10M"` to `catalog.json` (from windchime's `pnpm catalog`, task 3.4) and verify `compositionTitle` on a VZ unit uses `CASIO VZ-10M`
- [x] 1.5 Run `npm run chime:collection -- --apply`, deploy, and verify a save with an `x:casio-vz` unit and patch succeeds against production while an old composition still loads

## 2. Package and setup (windchime)

- [x] 2.1 Add a committed `.npmrc` with only the `@dblodorn` registry (the token lives in `~/.npmrc` as `${GITHUB_PACKAGES_TOKEN}`, since pnpm 12 won't expand env vars in a repo's auth settings), install `@dblodorn/casio-vz-engine` pinned to 0.1.0, and verify `pnpm install --frozen-lockfile` succeeds and the package imports in Node
- [ ] 2.2 Add `NPM_RC` (`//npm.pkg.github.com/:_authToken=<read:packages token>`, Sensitive) to the Vercel `windchime` project for Production and Preview (done by the user), and verify a preview deployment installs and builds
- [x] 2.3 Run `pnpm schema:pull` after 1.5 and verify `schemas/dmbk-graphql-api.graphql` has `SynthPatch`, `ChimeUnit.patch` and `dmbkSoundVzVoices`

## 3. Synth registry and INIT

- [x] 3.1 Generate the INIT voice with the vz10m editor's `initVoice("INIT")` and check it in as base64 in `lib/synths/casio-vz-init.ts` with a source comment; verify in Node that `readVoice` accepts it and `getName` returns `INIT`
- [x] 3.2 Create `lib/synths.ts` with the `ExternalSynth`/`SynthLike` types and the `casio-vz` entry (name, INIT, `patchType: "VzVoice"`, dynamic `engine()` import); verify `node -e 'import("./lib/synths.ts")…'` imports with no DOM and that `engine` isn't evaluated at import
- [x] 3.3 Verify `pnpm build` puts the engine package in its own chunk, not in the page's first-load JS (check the build output or `.next` chunk contents)
- [x] 3.4 Make `scripts/catalog.ts` emit each registry synth as `x:<id>` with its name, and verify `pnpm catalog` prints `"x:casio-vz": "CASIO VZ-10M"`

## 4. Unit record, links and saved compositions (`lib/share.ts`)

- [x] 4.1 Extend `UnitSchema`: `voice` accepts `x:[a-z0-9-]+` (an id not in the registry → null), add `patch` (24 hex, `.catch(null)`, forced null unless the voice is external), with `DEFAULTS.patch = null`; verify in Node that stored records with unknown synths, malformed patches and patches on GM voices are normalized
- [x] 4.2 Replace version 1 with version 2 in `encode` and `readers` (byte 18 = synth code, 12 patch bytes after external units, zeros = INIT, exact-length walk), deleting the v1 reader; verify a Node round-trip test of mixed units, that a v1 code decodes to null, and that 16 external units with patches encode to at most 1,000 characters with `#c=`
- [x] 4.3 Update `SavedUnitSchema`, `toSaved` and `fromSaved` for `x:` voices and `patch` (sent only for external units); verify in Node that `toSaved` on a non-VZ composition deep-equals its output before the change (pinned fixture), that a pre-change saved composition loads to identical records, and that save → load → `encode` gives the same link
- [x] 4.4 Run `pnpm typecheck` and verify it is clean

## 5. Engine: external voice path (`lib/engine.ts`)

- [x] 5.1 Add per-chime `ensureSynth` (registry `engine()` → `createSynth` on the raw context, output → the unit's input GainNode, load INIT or current patch bytes; forget a failed promise), called on SOUND on and on switching to an `x:` voice while sounding; verify in Chromium (Playwright with an analyser wrap) that a VZ unit strike produces signal on its OUTPUT channel and a muted VZ unit downloads no engine chunk
- [x] 5.2 Route `ring` for `x:` voices: the built-in fallback until ready, else `noteOff`+`noteOn` with velocity and a per-note DECAY timer; verify a re-strike restarts the note, the sound stops after DECAY, and the first strikes before readiness sound with tubular bells
- [x] 5.3 Add `setPatch(bytes)`, and `allNotesOff`/`dispose` on SOUND off, voice change and `destroy()`; verify that switching VZ → VIBRAPHONE stops VZ output and that removing the unit leaves no running worklet node
- [x] 5.4 Make `midiProgram()` return null for `x:` voices; verify with the stubbed MIDI output that choosing CASIO VZ-10M and changing its patch send no `0xBn 0/32` or `0xCn`, while notes and CC74/CC71 still go out

## 6. Patch data (`lib/patches.ts` + Relay)

- [x] 6.1 Add Relay operations: the list (`dmbkSoundVzVoices(first, after, search)`, run with `fetchQuery` in `components/PatchSelect.tsx`) and the get (`node(id) { ... on SynthPatch { id name data } }`), and run `pnpm relay`; verify both ids appear in `lib/server/persisted-operations.json`
- [x] 6.2 Implement `getPatch(synth, id)` / `getPatchName` (builds the global id from `patchType`, decodes and checks 336 bytes, caches by `synth:id`, `null` node → missing, errors forgotten); verify with an intercepted `/api/graphql` that two units on one patch make one request, a `null` node resets the unit to INIT, and a network error keeps the patch and retries on the next SOUND on
- [x] 6.3 Wire `Chime.tsx`: when a VZ unit needs its patch (sounding, or patch changed while sounding) fetch it and call `setPatch`, and fetch names for PATCH rows and sound lines; verify no `/api/graphql` request is made on a page with no VZ units

## 7. UI

- [x] 7.1 Rename SOUNDFONT to SOUND (row label, combobox name, listbox name) and reorder `voiceGroups()` to BUILT-IN SYNTH, EXTERNAL SYNTHS, GM groups; verify in Playwright that the headings come in that order and typing `vz` shows CASIO VZ-10M
- [x] 7.2 Add remote mode to `SearchSelect` (`filter={false}`, `onQueryChange`, `maxLength`, keyboard-reachable `footer` for MORE / LOADING… / COULD NOT LOAD + RETRY) without changing SCALE or SOUND behavior; verify the existing searchable-select scenarios still pass and that Enter on MORE appends without closing
- [x] 7.3 Build `components/PatchSelect.tsx` (dynamic chunk: pagination, debounced search ≤ 12 characters, refetch on open, INIT first and filtered by `init`) and the PATCH row directly below SOUND, shown only for `x:` voices, with OUTPUT below it; verify the `external-synths` PATCH and fetching scenarios with intercepted GraphQL (45 voices → 20 + MORE ×2, search `organ`, unreachable → INIT + COULD NOT LOAD + RETRY)
- [x] 7.4 Show the synth and patch in the sound line (`CASIO VZ-10M · INIT · RYUKYU`, `LOADING…` while the name is unknown) and the patch name as the PATCH row value; verify in Playwright with NOTES on
- [x] 7.5 Make PATCH and its list carry the unit's ink (`contentStyle`); verify a channel 2 unit's PATCH list draws in CARMINE
- [x] 7.6 Verify popover row counts: 14 for a GM tube chime, 15 with CASIO VZ-10M, 13 for a VZ furin on desktop, and one fewer on touch (OUTPUT hidden)

## 8. Integration checks

- [x] 8.1 Verify in Playwright: COPY keeps the patch, reload keeps it, a share link round-trips VZ units with INIT and shared patches, and an old v1 link is ignored and cleared
- [ ] 8.2 Verify saving and loading a composition with VZ units through intercepted GraphQL (input holds `voice: "x:casio-vz"` and `patch`, no bytes or name) and, once 1.5 is live, against production
- [x] 8.3 Measure CPU with 16 VZ units sounding at WIND 0.8 in Chrome and note the result in design.md; verify no audio dropouts on a typical laptop
- [x] 8.4 Run `pnpm build` and verify it is clean with no console errors or hydration warnings on load
- [ ] 8.5 Real-ear check by the user: VZ-10M through speakers and a multichannel OUTPUT, Safari fallback behavior

## 9. Docs and changelog

- [x] 9.1 Add a FEATURE entry to the top of `lib/changelog.ts` ("Play the Casio VZ-10M, with patches from the shared VZ library", plus the SOUND rename), and verify `/changelog` shows it
- [x] 9.2 Update `CLAUDE.md`: voice ids (`x:<synth>` + `patch`), the synth registry and naming convention, link version 2 bytes (and the dropped v1), the `patch` field in saved compositions, `.npmrc`/`GITHUB_PACKAGES_TOKEN`, SOUND/PATCH UI, and new files in Layout; verify by reading it back against the code
