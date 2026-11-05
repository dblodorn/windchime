# Tasks

## 1. Setup

- [x] 1.1 Create branch `share-state-via-url` from an up-to-date `main`; verify `git status` is clean on the new branch
- [x] 1.2 Add `zod` 4.6.x with `pnpm add zod`; verify `package.json` and `pnpm-lock.yaml` both change, no `package-lock.json` appears, and `node -e 'import("zod").then(m => console.log(typeof m.z.object))'` prints `function`
- [x] 1.3 Write a scratchpad Node script that runs today's `readUnit` (copied from `Chime.jsx`) over edge-case records (empty object, `null`, missing fields, wrong types, NaN, out-of-range numbers, `tubes: 12`, `tubes: 3.4`, unknown scale, bad voice, `midiMode: "x"`, `channel: 0`) and saves the outputs as JSON; keep it as the reference for 2.2

## 2. Schemas (`lib/share.js`)

- [x] 2.1 Create `lib/share.js` with `UnitSchema` (each field coerces, clamps or rounds, then `.catch(default)`; scale names from `SCALE_LIST`; ranges and defaults from today's `defaultUnit`/`readUnit`) and `CompositionSchema` (cut to 16, then `z.array(UnitSchema).min(1)`); no DOM at module top level; verify `node -e 'import("./lib/share.js").then(m => console.log(m.UnitSchema.parse({}).wind))'` prints `0.45`
- [x] 2.2 Run the 1.3 edge cases through `UnitSchema` (with the id handling kept outside it) and verify every output equals the reference JSON field for field
- [x] 2.3 Add `PackedUnitSchema`: integer fields after scaling (`volume100` 0–100, `tubes` 2–8, `wind100` 0–100, `decay10` 3–120, `cut1000` 0–1000, `q10` 5–180, `root` 48–84, `scale` 0–255, `voice` 0–65535, `flags` 0–63, `x`/`y` int16, `rank` 0–15); verify parsing a value off its slider step or out of range throws, and a valid packed unit parses unchanged

## 3. Encoding

- [x] 3.1 Add `encode(units)`: map each record to the packed shape (rounding to slider steps, voice `null` → 0, `v<i>` → 1 + i, `s0:<p>` → 1000 + p; flags = channel − 1 | MONO << 4 | NOTES << 5; x/y clamped to ±32767; rank from `z` order), `PackedUnitSchema.parse` each, write version 1, count and 19 bytes per unit through a `DataView`, and return base64url (no padding); verify 16 maximal units give ≤ 410 characters
- [x] 3.2 Add `decode(str)`: base64url → bytes, dispatch on the version byte, check the length is `2 + 19·count` with count 1–16, unpack, rebuild `z` as rank + 1, then `CompositionSchema.parse`; return `null` for bad base64, an unknown version, a wrong length or count 0; verify in Node that each of those inputs returns `null`
- [x] 3.3 Verify the round trip in Node: random valid compositions of 1–16 units (all scales, tube counts, voices including `null`, `v5` and `s0:135`, channels 1–16, both MIDI modes, NOTES on and off, negative positions) decode to records equal to the input on every carried field, with SOUND false
- [x] 3.4 Pin the index-stability rule: a Node check that `SCALE_LIST[0]` is RYUKYU and `SCALE_LIST[1]` is IN-SEN, that the scale count is 32, and that a fixed version-1 link string decodes to the expected values; add a comment beside `SCALES` in `lib/engine.js` that scales may only be appended (links store their index)

## 4. Components

- [x] 4.1 Replace the per-field checks in `readUnit` with `UnitSchema.parse`, keeping its id and duplicate-id handling, and build `defaultUnit` from the schema; verify a reload restores units as before (Playwright: seed `windchime.units` with the 1.3 edge cases and check the shown values) and `pnpm build` passes
- [x] 4.2 In the mount effect, read `location.hash`; if it has `c=` and `decode` succeeds, give the units ids the same way as stored units, `setUnits` them (the save effect then overwrites `windchime.units`) and clear the fragment with `history.replaceState`; if it doesn't decode, clear it and load storage. Verify with Playwright: a link with five units replaces two seeded ones and a reload still shows five; the address bar has no fragment; a fragment `#c=garbage` leaves the seeded units and is removed
- [x] 4.3 Add a `hashchange` listener that applies a link pasted into an open tab the same way; verify with Playwright by setting `location.hash` to a link after load
- [x] 4.4 Add the SHARE button: fixed lower right, left of MIDI with an 8 px gap, same height, width, border and classes as the MIDI button (give both the same fixed width), text `SHARE`; on click encode, build `origin + pathname + "#c=" + code`, write it with `navigator.clipboard.writeText`, else `navigator.share({ url })`, else set `location.hash`; show `COPIED` for 1.5 s. Verify with Playwright: bounding boxes match MIDI's height, width and bottom; the clipboard holds a link that opens the same composition in a fresh context; the label goes COPIED then SHARE; with `clipboard` and `share` stubbed out the hash is set
- [x] 4.5 Verify the round trip end to end with Playwright: set three units to different settings, channels, MIDI modes, NOTES states and positions, SHARE, open the link in a fresh context with different seeded units, and check every value by role, the order, positions (clamped into a smaller viewport for one run) and stacking order; every unit muted; the receiver's stored MIDI port name and SEND options unchanged
- [x] 4.6 Verify 16 units give a link of at most 1,000 characters (Playwright, COPY up to 16, SHARE, read the clipboard)

## 5. Docs and finish

- [x] 5.1 Update CLAUDE.md: `lib/share.js` in the layout, the zod schemas as the one place for unit field ranges, the SHARE button, the `#c=` format (version, count, 19-byte unit table), the rule that `SCALE_LIST` and the bundled font's presets may only grow at the end (or a new version maps old indices), opening a link replaces the saved units, and zod in the stack; verify by reading the diff
- [x] 5.2 Run `pnpm build` and `openspec validate share-state-via-url --strict`; verify both pass
