# Tasks

## 1. API (dmbk-graphql-api, first)

- [x] 1.1 In `src/lib/chime/shape.ts`, change `INT_FIELDS.root` from `[48, 84]` to `[0, 119]`. Update any tests or fixtures that pin the old limits.
- [x] 1.2 Check that `title.ts` and `fingerprint.ts` handle roots 0–119. The fingerprint must be unchanged for existing roots.
- [x] 1.3 Open the PR and merge it. The user runs `npm run chime:collection -- --apply`, with `dbAdmin` granted to `graphql-api` for that step, then deploys.

## 2. Engine

- [x] 2.1 Export `foldNote(n)`, which lowers by 12 while above 127, and use it in `noteAt`. `tubeLen` stays on the unfolded offsets.
- [x] 2.2 Node check:
  - For every scale, 8 tubes and roots 0–119, every `noteOf(i)` is in 0–127 and keeps its pitch class.
  - Pinned tube-chime takes for roots 48–84 are unchanged (`furin/baseline.json`).

## 3. Share and storage

- [x] 3.1 In `lib/share.js`, widen `root` to 0–119 in `UnitSchema` (default 72, clamped), `PackedUnitSchema` and `SavedUnitSchema`.
- [x] 3.2 Node check:
  - Pinned version 1 links decode and re-encode identically.
  - Roots 0 and 119 survive `encode`/`decode` and `toSaved`/`fromSaved`.
  - A stored root of 127 loads as 119.

## 4. UI

- [x] 4.1 Make ROOT a 12-item `ParamSelect`: values are pitch classes and the text is the bare note name. Its `display` is `noteName(root)`. Remove `ROOTS` and `rootText`.
- [x] 4.2 Add an OCTAVE `ParamSlider` directly below ROOT: `-1..8`, `step={1}`, `ticks`, value shown as a plain number. Both controls write `root = 12·(octave+1) + note`.
- [x] 4.3 Make the pad readout and TEST NOTE use the engine's folded note.

## 5. Verification (Playwright against `pnpm build && pnpm start`)

- [x] 5.1 ROOT and OCTAVE:
  - ROOT lists 12 bare notes.
  - Arrow keys and Home/End on OCTAVE give A4 → A-1 → A8.
  - Picking G# keeps the octave.
  - The rows read `G#5` and `5`.
- [x] 5.2 Popover row counts:
  - Desktop: 14 for a tube chime, 12 for a furin.
  - iPhone emulation: 13 and 11.
- [x] 5.3 With a MIDI stub and an 8-tube PYEONGJO chime at B8, the pads read B8 C#9 E9 F#9 G#8 B8 C#9 E9, and strikes send notes no higher than 127. At C-1, tube 1 sends note 0.
- [x] 5.4 Round trips:
  - Links with C-1 and B8 survive.
  - A pre-change link opens unchanged.
  - Saving C-1/B8 against a GraphQL stub sends roots 0 and 119.
  - COPY keeps OCTAVE.
  - A reload keeps it.
- [x] 5.5 Regression: rerun the t3, t4, t6 and t7 suites, with their row counts updated for OCTAVE.

## 6. Docs

- [x] 6.1 Update CLAUDE.md and AGENTS.md (kept identical): ROOT/OCTAVE, the 0–119 range, `foldNote`, the popover's fourteen rows, and the API's root range.
