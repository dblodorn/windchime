# Tasks

## 1. Baseline

- [x] 1.1 Before touching the engine, record a pinned tube-chime take as JSON in the scratchpad, with every hit: seed 12345, 6 tubes, default params, 2 minutes, plus 3 tubes and 8 tubes. Also record the link codes of three tube-chime compositions.

## 2. Engine: shared wind and furin physics

- [x] 2.1 Move the wind update out of `step` into `stepWind(sim, P, dt)`, keeping the draw order. `step` dispatches on `P.instrument` (default `"chime"` in `defaultParams`).
- [x] 2.2 Add `sim.fu` (clapper `c`, strip `q`, `armed`, `cool`) and `stepFurin`:
  - the coupled masses;
  - the rim collision with restitution;
  - arming, with a 40 ms minimum gap;
  - velocity from `vr`.
- [x] 2.3 Add `setParams({ instrument })`. A switch resets the incoming instrument's parts to rest: a new `sim.fu`, or rest tubes with an 80 ms cooldown plus the clapper `s`. The wind and `t` carry on.
- [x] 2.4 Make the following follow the instrument:
  - `noteOf` returns ROOT for a furin;
  - `strikeTube(0)` kicks the clapper;
  - the SOUND-on arpeggio is a single strike;
  - `renderTake` uses the instrument.
- [x] 2.5 Check in Node that the pinned tube-chime takes from 1.1 match hit for hit.

## 3. Engine: furin drawing and hit area

- [x] 3.1 Draw the furin: hook, crown, dome silhouette, rim, clapper on its string, and the strip on its string, narrowing with the wind angle.
- [x] 3.2 For a furin, `strikeAt` tests the padded bell silhouette and `tubeSegments()` is `[]`. Export `bellOutline()` for tests.
- [x] 3.3 Run a Node fit check: no clipping at rest, and at least 99% of frames inside the paper over 10 minutes at WIND 0.45. Check that the clapper is within a few px of the wall in strike frames.

## 4. Engine: voice and tuning

- [x] 4.1 Append `VOICES[6]` FURIN (bell-plate partials, `oct: 12`, chorus, `gm: 112`).
- [x] 4.2 Tune the furin constants by measurement, 5 minutes per run over 4 seeds. Targets: about 2, 12, 35 and 60 strikes a minute at WIND 0.1, 0.2, 0.45 and 0.8. At 0.45, velocities should spread at least 30 and the minimum gap must be 40 ms or more. The mean velocity must rise with WIND, and the same seed must give identical takes. Record the table in CLAUDE.md.
- [x] 4.3 Check that `pnpm catalog` prints `"v6": "FURIN"` and that its output matches dmbk-graphql-api's `catalog.json`.

## 5. Records, links and saves (`lib/share.js`)

- [x] 5.1 Add `instrument` to `DEFAULTS` and `UnitSchema` (`"chime" | "furin"`, `.catch("chime")`).
- [x] 5.2 Pack it into byte 17 (0 for chime, 1 for furin), with `PackedUnitSchema` taking `instrument` 0..1. The reader maps the byte and the schema catches unknown values. Check that the link codes from 1.1 are unchanged.
- [x] 5.3 `toSaved` sends `instrument: CHIME | FURIN`. `SavedUnitSchema` takes an optional `instrument` (missing is CHIME), and `fromSaved` maps it.
- [x] 5.4 Add `instrument` to the `Compositions_row` fragment, and run `pnpm relay`.

## 6. UI (`components/Chime.jsx`)

- [x] 6.1 Add the INSTRUMENT `ParamSelect` as the first SETTINGS row (TUBE CHIME, FURIN BELL), and send `instrument` to the engine.
- [x] 6.2 Hide the TUBES and SCALE rows on a furin.
- [x] 6.3 Make `defaultVoice(instrument)` return `v6` for a furin, and use `unit.voice || defaultVoice(unit.instrument)` everywhere the effective voice is needed. That covers the SOUNDFONT display, `chooseVoice` and the program change.
- [x] 6.4 Notes drawer on a furin: one full-width pad with the ROOT note and its Hz, and the line `<voice> · FURIN BELL`.
- [x] 6.5 COPY, RESET and storage carry `instrument` (through the record and `UnitSchema`).

## 7. Verification (Playwright against `pnpm build && pnpm start`)

- [x] 7.1 SETTINGS:
  - INSTRUMENT is the first row, and the only options are TUBE CHIME and FURIN BELL.
  - Choosing FURIN BELL hides TUBES and SCALE, leaving 11 rows, and the popover stays open.
  - Switching back shows the earlier TUBES and SCALE values.
- [x] 7.2 Furin strikes:
  - Tapping the bell strikes it, with a MIDI note-on at ROOT, velocity 96, on the unit's channel.
  - Tapping the strip does not strike, and drags.
  - Wind strikes are all ROOT, at varying velocities.
  - TEST NOTE sends ROOT.
  - With SEND PROGRAM CHANGE on, switching a default-voice unit sends program 112.
- [x] 7.3 Drawer: one pad with ROOT, which strikes; the line reads `FURIN · FURIN BELL`. A chosen VIBRAPHONE survives the switch.
- [x] 7.4 Persistence:
  - Reload keeps a furin.
  - COPY copies it.
  - A link round trip preserves the furin.
  - A pre-change link opens as tube chimes.
  - SAVE sends `instrument: FURIN` (stubbed route), and a loaded furin comes back with the same link.
- [x] 7.5 Regression: rerun the existing Playwright suites (t3, t5, t5b and the others) and check that they still pass.
- [x] 7.6 Check by hand on real devices: how the furin sounds (voice, register, decay), how it looks at 1× and 2×, and how it moves in light and strong wind.

## 8. Docs

- [x] 8.1 Update CLAUDE.md and AGENTS.md (kept identical):
  - the instrument field;
  - `stepWind` and `stepFurin`, with the tuning table;
  - the furin drawing and its hit area;
  - FURIN as `v6`;
  - byte 17 in links;
  - `defaultVoice(instrument)`;
  - the API's `instrument` field.
