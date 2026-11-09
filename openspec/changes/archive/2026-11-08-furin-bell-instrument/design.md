# Design

## Context

Today a unit is always a tube chime. `lib/engine.js` gives each chime:
- one `P` (its parameters);
- one `sim` (wind state, the clapper `s`, and the tubes);
- one fixed 240 Hz `step`;
- one `draw`.

The UI (`components/Chime.jsx`) resolves the default voice in `defaultVoice()` (GM tubular bells, or `v0` before the font loads). Links pack each unit into 19 bytes, of which bytes 17–18 are reserved and always zero. Saved compositions go through `toSaved`/`fromSaved`.

The API side is already live: dmbk-graphql-api#34 added `instrument` (`CHIME`/`FURIN`, optional and defaulting to `CHIME`) and the catalog voice `v6` = `FURIN`.

## Goals / Non-Goals

**Goals:**
- A furin with its own physics, drawing, tap target, single note and voice.
- Tube chimes stay **bit-identical**: the same strikes for the same seed, the same link bytes, the same fingerprints in the API.

**Non-Goals:**
- More than two instruments, or per-unit furin size or material choices.
- A furin that swings as a whole: the bell is rigid on its hook.

## Decisions

### Parameters and records

- **Parameter:** `P.instrument` is `"chime"` or `"furin"`, set through `setParams({ instrument })`.
- **Record and schema:** the unit record gains `instrument`, and `DEFAULTS.instrument = "chime"`. In `UnitSchema` it is `z.enum(["chime","furin"]).catch("chime")`. That one schema covers storage, links and saves, so old or unknown values become `"chime"`.
- **Notes:** `noteOf(i)` returns `P.root` for a furin. TUBES and the scale stay in `P` and in the record, but a furin ignores them.

### Wind is shared, and tube-chime motion is untouched

- **A shared wind step.** The wind update at the top of `step` (the `phi` and `g` walks and the OU force `F`) moves into `stepWind(sim, P, dt)`. The draws keep the same order, so the tube chime's random stream, and therefore its strikes, are unchanged.
- **Checking it.** Render a 2-minute take with seed 12345 at 6 tubes before and after the change, and compare every hit.
- **Dispatch.** `step` checks `P.instrument` and runs either the existing tube body or `stepFurin`.
- **The unused instrument's state.** `sim.fu` holds the furin's state, made at rest on the first switch to furin. The tubes' state stays in `sim.tubes`.
- **Switching resets the new instrument's parts.** On every switch, the incoming parts are set to rest:
  - Going to furin: `sim.fu` is reset.
  - Going to tubes: every tube is reset to rest, as `resize` does, with an 80 ms cooldown, and so is the clapper `s`.

  The wind state (`F`, `phi`, `g`) and `t` carry on.

### Furin physics (`stepFurin`)

Two coupled masses move in the horizontal plane, in projection-space units like the tube sim:
- the clapper `c` (zetsu), hung from the bell's crown on a string;
- the strip `q` (tanzaku), hung from the clapper on a longer string.

```
q'' = A·F − KQ·q − KCQ·(q − c) − CQ·q'      // the strip catches the wind
c'' =      − KC·c − KCQ·(c − q)/MC − CC·c'   // the clapper is dragged by the strip
```

**The wind drives only the strip.** It has the large area, so it moves first and pulls the clapper along. That lag gives the furin its irregular, two-beat feel.

**The rim.** The clapper strikes when `|c| ≥ RC`. `RC` is the bell's inner radius at the clapper's height, minus the clapper's radius. At contact:
- `c` is pushed back onto the circle;
- the radial velocity `vr` is reflected with restitution `EF ≈ 0.5`;
- a strike fires if `vr > VMIN` and the clapper is armed.

**Arming.** A strike disarms the clapper. It is armed again once `|c| < RC − 1.5`, which means it has moved away from the rim. A 40 ms minimum gap backs this up. Without arming, a clapper resting against the rim in a steady push would fire on every frame.

**Velocity.** It is a soft curve, `12 + 115·(1 − e^(−vr/45))`, clamped to 1–127. A first linear map (`18 + 1.6·vr`) put 12% of strikes at WIND 0.45, and 25% at 0.8, on 127, which flattened the dynamics. With the curve, almost none reach 127 and hard swings still differ. The stronger the wind, the larger `vr` gets, so the mean velocity rises with it.

**Tuned constants** (`lib/engine.js`):
- `FA = 1`
- `FKQ = 6`, `FKC = 18`, `FKCQ = 8`, `FMC = 0.6`
- `FCQ = 1.2`, `FCC = 0.8`
- `FE = 0.5`, `FVMIN = 3`, `FVS = 45`, `FGAP = 0.04`
- `FRC` is derived from the drawn wall.

**Measured** (5 minutes, 4 seeds):

| WIND | Strikes/min | Mean velocity |
|---|---|---|
| 0.1 | 0.3 | 53 |
| 0.2 | 8.6 | 62 |
| 0.45 | 36 | 77 |
| 0.8 | 52.6 | 85 |

At WIND 0.45, the 10th to 90th percentile of velocity is 48–103, and every run's spread is at least 89. The minimum gap is 125 ms or more. Still air gives no strikes, takes repeat exactly, and there was no clipping in 10 minutes at 0.45. The low winds come out sparser than the first targets (about 2 at 0.1 and 12 at 0.2), and that's kept, since a furin barely rings in a faint breeze.

**Tap.** `strikeTube(0)` on a furin gives the clapper a radial kick and fires the hit at velocity 96. The kick points in its current direction, or +x at rest.

### Furin drawing

The furin is drawn in projection space (scaled by `K = 0.8`), using `seg`, `outline` and `view` like the tube chime. The bell is axisymmetric, so YAW only affects the clapper and strip.

**Proportions.** Rough paper rows, ×0.8:

| Element | Projection space |
|---|---|
| Hook | y 0 → 26 |
| Crown | `outline(CX, 28, 5, 5·Z, 10)` |
| Bell | a dome profile from the crown at y 28 down to the rim at y 74, radius from 5 to `RB = 26` |
| Rim | `outline(CX, 74, RB, RB·Z, 24)` |

**The dome.** It is drawn as two silhouette polylines, the left and right edges. Each is 8 segments of `r(y) = RB·sin(π/2·(y − 28)/46)^0.6`, so the shoulder is rounded.

**Clapper:**
- Its string runs from the crown to the clapper.
- The clapper itself is `outline(cx, 66 + cz·Z, 4, 4·Z·1.6, 10)`, where `(cx, cz) = view(c)`.
- The collision radius `RC` is set from `r(66) − 4`. In the frame of a strike, the drawn clapper therefore touches the drawn wall, within a few pixels.

**Strip:**
- Its string runs from the clapper down to the strip's top at y 112.
- The strip is a rectangle `hw = 2 + 9·|cos(ang)|` wide and 72 tall.
- It is displaced by `view(q)`, scaled by 1.4 the way the sail is.
- Its angle follows the wind's direction, as the sail's does.

**Fit.** The figure spans about y 0–184 in projection space, about 147 px on paper, at rest. It must stay inside the paper at rest and in at least 99% of frames at WIND 0.45. As with the tube chime, these numbers are tuned by measuring frames with Node.

### Hit area and readout

- **`strikeAt(x, y)` on a furin.** It hits when the point lies inside the bell's silhouette, padded by 6 raster px. That is, `toY(28) − 6 ≤ y ≤ toY(74 + RB·Z) + 6` and `|x − toX(CX)| ≤ K·r(y) + 6`, with the rim radius used below the rim line. A hit returns 0, and a miss returns −1, which starts a drag.
- **`tubeSegments()`** returns `[]` for a furin.
- **`bellOutline()`** is a new export that returns the silhouette, for tests.
- **The SOUND-on arpeggio** is one strike for a furin, not three: one note three times would read as a stutter.

### Voice

`VOICES[6]` is the new built-in voice, appended at the end (index rule), with:
- `id: "furin"`, `name: "FURIN"`, `gm: 112` (Tinkle Bell, 0-based);
- `partials: [1, 2.405, 4.12, 5.94, 8.47]`, `amps: [1, 0.5, 0.32, 0.18, 0.1]`;
- `dmul: 0.7`, `pd: 0.9`, `oct: 12`, `chorus: true`.

The partial ratios are those of a free bell plate, and they give the inharmonic glassy ring. `oct: 12` puts the default ROOT (C5) at C6, about 1 kHz, the register of a glass furin. The chorus detune gives the shimmer.

`pnpm catalog` must then print `"v6": "FURIN"`, which already matches the API's `catalog.json`. Diff the two.

### Default voice per instrument

- `defaultVoice(instrument)` in `Chime.jsx` returns `"v6"` for a furin. For a tube chime it returns, as now, GM tubular bells (or `v0` before the font loads).
- A stored `voice: null` stays null. The effective voice is `unit.voice || defaultVoice(unit.instrument)`.
- The SOUNDFONT select shows FURIN. The existing program-change effect is keyed on the effective voice, so switching instrument on a default-voice unit sends Tinkle Bell when SEND PROGRAM CHANGE is on.
- **Choosing FURIN on a furin unit** gives the same value as the effective voice, so `SearchSelect` doesn't call `onChange`, and `voice` stays null. That is intended: the unit keeps following its instrument's default.

### UI (`Chime.jsx`)

- **INSTRUMENT row:** the first row of SETTINGS, a `ParamSelect` with `chime` → TUBE CHIME and `furin` → FURIN BELL. The row's value text is the option's name.
- **Hidden rows:** while the unit is a furin, the TUBES and SCALE rows are not rendered. Their values stay in the record.
- **Drawer pads:** one pad with `gridTemplateColumns: 1fr` for a furin, showing `noteName(root)` and its Hz. `strikeTube(0)` and the flash on hit index 0 work unchanged.
- **Sound line:** `{voiceItem.name} · FURIN BELL` for a furin, and `{voiceItem.name} · {scale}` for a tube chime.
- **Engine updates:** `ChimeUnit` sends `instrument` with the other params in its `setParams` effect.

### Links

- **Byte 17:** byte 17 of the 19-byte unit becomes the instrument code: 0 is chime and 1 is furin. Byte 18 stays reserved.
- **Version:** it stays 1. Old links have a zero in byte 17, so they open as tube chimes.
- **Unchanged links:** tube-chime compositions encode exactly as before.
- **Strict encode:** `PackedUnitSchema` gains `instrument: int 0..1`.
- **Decode:** a byte above 1 maps to `"chime"` through the schema's catch.
- **Older builds** ignore byte 17, so they open a furin link with that unit as a tube chime. That is acceptable and nothing breaks.

### Saved compositions

- **`toSaved`** sends `instrument: "CHIME" | "FURIN"`.
- **`SavedUnitSchema`** accepts `instrument` as an optional `CHIME`/`FURIN`, read as CHIME when missing.
- **`fromSaved`** maps it through `pack`/`unpack`, so a loaded composition gives the same link it was saved from.
- **Relay:** the `Compositions_row` fragment selects `instrument`, and `pnpm relay` regenerates the persisted map.
- **Schema copy:** `schemas/dmbk-graphql-api.graphql` already has the field (pulled after #34).

## Risks / Trade-offs

- **The tube-chime sequence might drift** after `step` is refactored. Mitigation: compare a pinned take from before the change, hit for hit.
- **The furin's tuning may need iteration**, both the rate and how it sounds. The constants come from measurement, and the voice's partials and decay may need a listening pass. Hand check: real audio.
- **The clapper can rest against the rim** in a steady wind. Arming plus the 40 ms gap prevents strikes on every frame, and a test checks that no two strikes are less than 40 ms apart.
- **A link with a furin, opened in an old cached build,** shows it as a tube chime. This is acceptable: nothing breaks, and the next load fixes it.
- **The persisted-operation id changes** when the fragment changes. The route allows the ids in its build's map, so the client and server deploy together on Vercel. This is fine.
