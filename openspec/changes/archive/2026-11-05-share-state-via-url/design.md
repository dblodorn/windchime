# Design

## Context

See proposal.md for why. Units are plain records in `Chime` (`{ id, volume, tubes, wind, decay, cutX, q, root, scale, voice, channel, midiMode, notes, sound, x, y, z }`), saved as `windchime.units = { v: 1, units }` and checked field by field on load by the hand-written `readUnit` in `components/Chime.jsx`. `loadUnits()` runs once in a mount effect, because the server renders one default unit and must not read browser state. Voices are `null`, `"v<i>"` (6 built-in voices) or `"s0:<preset>"` (an index into the bundled TimGM6mb font's 136 presets, which never changes unless the file does). Sliders already quantize: VOLUME and WIND 0.01, DECAY and RESONANCE 0.1, FREQUENCY 0.001. The project has no TypeScript and, by request, uses zod for type safety on both sides of the link: validating the record before it is encoded and the data after it is decoded.

## Goals / Non-Goals

**Goals:**
- One zod schema for a unit record that is the single definition of its fields, ranges and defaults, used for links and for stored data alike.
- A small, versioned binary link format that round-trips every field exactly at slider precision.
- Link code that imports in Node with no DOM, so it can be checked without a browser.

**Non-Goals:**
- Compression (deflate etc.): the packed form is already ~25 bytes per unit.
- Short links through a server, or any server-side storage.
- Sharing the MIDI port, SEND options or SOUND state (see specs).
- Changing the storage format (`v: 1` stays as it is).

## Decisions

### 1. zod 4 schemas in a new `lib/share.js`

Add `zod` (4.6.x, the current major) as a dependency. `lib/share.js` exports:

- `UnitSchema`: the lenient schema for a unit record. Each field is a zod schema that coerces and clamps, then `.catch(default)`s, so a bad field falls back to its default rather than failing the unit, which is the rule the specs require for both stored and linked data. For example, WIND is `z.number().transform(v => clamp(v, 0, 1)).catch(0.45)`. TUBES and ROOT round, scale is `z.enum(scaleNames).catch("RYUKYU")`, voice is `z.string().regex(/^(v\d+|s\d+:\d+)$/).nullable().catch(null)`, and midiMode is `z.enum(["poly","mono"]).catch("poly")`. Field ranges and defaults live here and nowhere else. `defaultUnit()` in `Chime.jsx` becomes `UnitSchema.parse({ id })`.
- `CompositionSchema`: `z.array(UnitSchema).min(1).max(16)`, used after decoding. More than 16 units are cut by `.transform` before validation, matching storage.
- `PackedUnitSchema`: the strict schema for a unit about to be encoded. It requires each field to be a whole step of its slider and inside the range one byte (or two) can hold, as integers after scaling, e.g. `wind100: z.int().min(0).max(100)`. `encode` maps a record to this packed shape and `parse`s it, so an out-of-range value throws at the point of encoding instead of silently wrapping in a byte.

`readUnit` in `Chime.jsx` keeps only what isn't per-field: id checks and duplicate ids. Everything else is `UnitSchema.parse(raw)`. The scale names come from `SCALE_LIST`, so `lib/share.js` imports `lib/engine.js` (safe in Node).

*Alternatives:* `zod/mini` is smaller (~2 KB vs ~13 KB gzipped) but its functional API reads worse next to plain JS, and Tone.js already dominates the bundle. Validating only the decoded side was considered, but validating before encoding is what keeps a bad in-memory value from becoming a link that decodes to something else. Keeping `readUnit` hand-written next to a zod schema would mean two definitions of the same ranges that can drift.

### 2. Binary layout, version 1, base64url in the fragment

Link: `<origin><path>#c=<base64url>`. The bytes are:

| Offset | Size | Field |
|---|---|---|
| 0 | 1 | format version (`1`) |
| 1 | 1 | unit count (1–16) |
| 2 + 19·i | 19 | unit i, in page order |

Each unit (big-endian through `DataView`):

| Bytes | Field | Packing |
|---|---|---|
| 1 | VOLUME | ×100, 0–100 |
| 1 | TUBES | 2–8 |
| 1 | WIND | ×100, 0–100 |
| 1 | DECAY | ×10, 3–120 |
| 2 | FREQUENCY | ×1000, 0–1000 |
| 1 | RESONANCE | ×10, 5–180 |
| 1 | ROOT | MIDI note, 48–84 |
| 1 | SCALE | index in `SCALE_LIST` |
| 2 | SOUNDFONT | 0 = default, 1–999 = built-in voice i−1, 1000 + p = GM preset p |
| 1 | flags | bits 0–3 channel−1, bit 4 MONO, bit 5 NOTES |
| 2 | x | int16, clamped to ±32767 |
| 2 | y | int16 |
| 1 | stacking | rank 0–15 (z order among the units) |

16 units = 306 bytes = 408 base64url characters; with `https://chime.dmbk.io/#c=` about 433, under the 1,000 the spec allows. `z` is sent as a rank and rebuilt as rank + 1, since only the order matters. Decoding reads the version byte first and dispatches to that version's reader; an unknown version, a wrong length or bad base64 returns `null`.

*Alternatives:* compact JSON or a dotted text format (~850 chars for 16) is readable in the address bar but grows with every field; raw JSON is ~7 KB. Query parameters (`?c=`) would reach the server and the prerendered page for no benefit.

### 3. Index stability is the versioning rule

The scale byte is an index into `SCALE_LIST` and the voice is a built-in voice index or a preset index in the bundled font. A version-1 link keeps its meaning only while those lists only grow at the end and the `.sf2` file is unchanged. That rule goes in CLAUDE.md and in a comment beside `SCALES`. Reordering, removing, or swapping the font requires a version 2 whose reader maps version-1 indices to the new ones. Decoding an index past the end of a list gives the default through `UnitSchema`.

### 4. Applying a link in the existing mount effect

The mount effect that calls `setUnits(loadUnits())` first reads `location.hash`. If it has `c=` and decodes, the decoded units go through `CompositionSchema` and the same id assignment as stored units, replace state, and are saved by the existing 250 ms save effect, which overwrites `windchime.units`. Then `history.replaceState(null, "", location.pathname + location.search)` clears the fragment with no new history entry. A hash that doesn't decode is cleared the same way and storage loads as usual. Positions go through the existing `fitted` clamp, so linked units land inside the receiver's viewport. A `hashchange` listener applies a link pasted into an already open tab the same way.

### 5. SHARE button

A `Button` in `Chime`, fixed with the MIDI button's classes and offsets, `right` moved left by the MIDI button's width plus an 8 px gap, `h-11 px-2.5`, and a fixed width equal to the MIDI button's so both read as a pair (both get the same `w-[…]` class). Its text is `SHARE`, then `COPIED` for 1.5 s. On click: `encode(units)` → URL → `navigator.clipboard.writeText`. If that throws or is missing, it tries `navigator.share({ url })`; if that is missing too, it sets `location.hash` so the link sits in the address bar. All three are inside the click, which browsers require for clipboard and share. The button reads no browser capability during render (SSR rule).

## Risks / Trade-offs

- [The bundled font or `SCALE_LIST` is reordered later and old links change meaning] → the rule in Decision 3, a comment at both lists, and a Node check that pins the index of a few known scales and presets.
- [Positions are relative to the sender's viewport, so a layout from a large screen bunches up or overlaps on a small one] → accepted; the existing clamp keeps every unit on screen and the receiver can drag them.
- [Opening a link silently replaces the receiver's saved composition] → the user chose this. The old composition is gone unless someone kept a link to it.
- [zod adds ~13 KB gzipped] → small next to Tone.js and the 6 MB font.
- [Moving `readUnit`'s ranges into zod changes how stored data is checked] → the Node check runs the old and new validators over the same edge cases (missing fields, out-of-range, wrong types, `tubes: 12`, unknown scale) and requires equal output before the old code is deleted.
- [Clipboard is blocked in some embedded browsers] → share-sheet and address-bar fallbacks.

## Migration Plan

No data migration: storage keeps `v: 1`. Deploy is the usual merge to `main`. Rolling back removes the SHARE button; links already sent then open as the plain page (the fragment is ignored and stays in the address bar), so nothing breaks.
