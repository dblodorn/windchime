# Design

## Context

See proposal.md for the motivation and `specs/chime-drawing/spec.md` for the required behavior.

The current state that shapes the approach, all in `lib/engine.js` unless noted:

- **Raster:** `W = 192, H = 232`, a `Uint8Array` buffer, `px`, a Bresenham `line(…, dash)`, `fillPoly`, `ellipse`, `fillEllipse`, and `present()` writing the buffer to an `ImageData`.
- **Two coordinate systems:**
  - **Sim units:** the clapper `s.x/s.z` and tube offsets `dx/dz`. The ring radius `R = 58` is the tube hang radius. `RS = 16`/`RT = 3.5` are collision radii used by `step()`. `REST` holds the hang positions.
  - **Raster projection:** `CX = 96`, `RING_Y = 22`, `Z = 0.3` (depth foreshortening), `STR = 8` (string length), `STRIKER_Y = RING_Y + 66` and `SAIL_Y = RING_Y + 128`, plus `tubeLen(i) = 118·√(f_root/f_i)`. Sim units map 1:1 to raster pixels horizontally and by `Z` in depth.
- **`step()`** reads `R`, `RS`, `RT` and `REST`, but none of the projection constants.
- **`draw()`** fills the buffer every animation frame: wind streaks, hook and ring, then tubes and clapper depth-sorted by `z` so fills can hide what's behind.
- **`strikeAt(x, y)`** takes raster coordinates. It picks the tube whose hang x is nearest within 14 px and whose y-span contains the tap, then gives it a push and calls `liveHit(i, 96)`.
- **`components/Chime.jsx`:**
  - `fit()` sizes the canvas to `min(stage width, height budget, W·3)`, rounded down to a whole multiple of `W` when at least `2W`.
  - `onCanvasDown` maps `clientX/Y` through `getBoundingClientRect()` into raster coordinates.
  - The tube readout's width is set to `canvasPx`.
- **Global CSS:** the canvas rule sets `image-rendering: pixelated` and `max-width: 100%`. Preflight makes every element `box-sizing: border-box`.

## Goals / Non-Goals

**Goals:**
- Change only how the sim state is drawn and hit-tested. `step()`, `makeSim()`, the physics constants, `R`/`RS`/`RT`/`REST` and the wind model stay byte-for-byte identical.
- Keep the existing three-quarter projection exactly, and add one uniform scale onto the 200×200 paper, so motion looks the same, only in a different style.
- Keep a single drawing primitive: the 1px straight line. Everything else is built from it.

**Non-Goals:**
- No new physics, colors or grey levels, and no anti-aliasing.
- No change to audio, MIDI, `.mid` export, `renderTake` or the parameter sheet.
- No new tests committed to the repo. Playwright and Node checks stay as scratch scripts, as in the previous changes.

## Decisions

### 1. Keep the old projection, add one paper transform
All drawing math keeps computing in the current projected coordinates (the old 192×232 space). The new raster functions apply a single transform before plotting:

```
X = 100 + (x − 96)·K        Y = TOP + y·K        K = 0.8, TOP = 0
```

The centerline maps to the paper's center, and the hook still starts at the top edge.

**Camera turn.** Before projecting, every drawn sim position (tube tops and bottoms, string attach points, clapper, sail) is rotated `YAW = 20°` about the vertical axis with `view(x, z)`, and the sail's apparent width uses the wind angle plus `YAW`. In the unturned view, tubes 1/3 and 4/6 share x = ±29 and differ only in depth, so as single-pixel lines each pair merges into one line and only four tubes are visible. The ring is a circle, so it is unaffected. Screenshots at 0° and 20° were compared, and the user chose 20° (2026-10-31). The sim is not rotated; only the drawing is. `K` and `TOP` are the only new tuning constants. They were set from a measurement over 10 simulated minutes per wind level (task 1.3):
- **At rest:** the figure spans ±62 around the centerline and y 0–186 in the old space, which is x 50–150 and y 0–149 on the paper at K = 0.8.
- **At the default WIND 0.45:** 99.43% of frames fit inside 0–199 at K = 0.8, against 98.80% at 0.85 and 97.87% at 0.9.
- **Why not fit everything:** the clapper isn't confined to the ring. It only collides with the tubes. At WIND 0.45 its x offset reaches ±68 at the 99th percentile and 96 at the maximum, and the sail is drawn at 1.45× that. At WIND 1.0 the clapper's maximum is 170, putting the sail about 260 units from center. Fitting that would need K ≈ 0.38 and leave a tiny figure. So strong gusts are allowed to clip at the paper's edge, as the 192×232 drawing already does today; the user chose this over compressing the drawn motion or shrinking the figure.

- *Alternative: rescale every projection constant (`CX`, `RING_Y`, `STR`, …) and `tubeLen`.* Rejected. It spreads one scale factor across a dozen numbers and invites drift from the current look. A single `K` is easier to tune and to reason about.
- *Alternative: draw at 192×232 and downscale the image.* Rejected. Nearest-neighbor downscaling drops pixels from 1px lines. The lines have to be rasterized at the final size.

### 2. Raster primitives
- `W = H = 200`.
- `seg(x0, y0, x1, y1)` transforms both ends through Decision 1 and calls the existing Bresenham `line()`. Every drawing call goes through `seg`, and `dash` is no longer used by the drawing.
- `outline(cx, cy, rx, ry, n)` draws a closed ellipse as `n` straight `seg`s between points on it. This is the "run of short straight segments" from the proposal. The ring uses `n = 24` and the clapper `n = 16`. A real polygon reads more DBN than a pixel-perfect ellipse, and it gives single-pixel joins.
- `fillPoly`, `ellipse` and `fillEllipse` are deleted, since they have no remaining callers.
- `present()` is unchanged, and the `ImageData` becomes 200×200.

### 3. What gets drawn
In the old projected space, then transformed:
- **Hook:** `seg(CX, 0, CX, RING_Y − (R+4)·Z)`.
- **Ring:** `outline(CX, RING_Y, R+4, (R+4)·Z, 24)`, a single outline. The current doubled ellipse is gone.
- **Tubes:** for each tube, the string `seg(attach, top)` and an outlined body: two side lines offset ±`RT` (the sim's tube radius, so about 6 paper px wide) from the centerline, plus straight top and bottom caps. The `top`/`bottom` formulas are the same as `drawTube` now (`dx·0.35` at the top, `dx·1.4` at the bottom, depth `·Z`). The fill, end-cap ellipse, inner dashed highlight and shimmer dashes are removed. The user first got single-stroke tubes, then said they don't need to be single strokes (2026-10-31); outlined bodies give them weight while staying in the single-pixel-line vocabulary.
- **Clapper:** its string `seg(CX, RING_Y, sx, sy − ry)` and `outline(sx, sy, RS, RS·Z·0.6, 16)`. The thickness rim and fills are removed.
- **Sail:** its string and the four sides of the rectangle, with the same width formula `hw = 2 + 11·|cos(windAngle)|` and height 36. The fill and inner dashed line are removed.
- **Order:** there are no fills, so depth sorting is no longer needed for correctness. It's dropped, and elements draw in a fixed order: wind, hook, ring, strings, tubes, clapper, sail. The spec's wireframe overlap follows from this.

### 4. No strike effect in the drawing
A strike shows only as the tube's swing, plus the readout cell flash under the canvas. A fan of 3–9 lines radiating from the ringing tube's lower end, sized by `tb.env`, was built and verified, then removed at the user's request (2026-10-31): it read as a firework rather than as part of the figure.

### 5. Wind dashes
The `streaks` array keeps its drift logic in `tick()`, now in old-projection space so it shares the transform. Each streak becomes one solid `seg` of length `len`, instead of every-other-pixel dots. The count is still `round(WIND·30)`.

### 6. Hit-testing in paper space
`strikeAt(x, y)` keeps taking raster coordinates, now in paper pixels (0–200). For each tube it computes the tube's `top`/`bottom` in paper space, using the same functions the drawing uses.
- **Hit test:** a tap counts as a candidate if it falls within the tube's y-span ±6 px and within 6 px horizontally of the tube line at that y (interpolating along the slanted line).
- **Nearest wins:** the candidate with the smallest horizontal distance is struck.
- **Same effect as before:** the push `vx += dir·30`, `env = max(env, 0.75)` and `liveHit(i, 96, t)` are unchanged.

A small exported helper, `tubeSegments()`, returns each tube's paper-space top and bottom so the scratch tests can tap tube centers exactly.

### 7. Canvas box, border and sizing (`Chime.jsx`, CSS)
- **Border box:** the canvas gets `box-sizing: content-box` and a 1px solid border in the foreground color. `style.width/height = canvasPx` is then the drawing area, and the border sits outside it, so ×2 stays exactly 400 drawing px. Under Preflight's `border-box`, the border would eat 2 px and make the scale non-integer.
- **`fit()`:** available width is the stage width minus 2 (the border). Then `w = min(avail, heightBudget, W·3)`. If `w ≥ 2W` it is floored to a whole multiple of `W`; otherwise it stays as-is. The height budget uses the square aspect.
- **Readout:** width is `canvasPx + 2`, so its outer width equals the canvas's outer width.
- **`onCanvasDown`:** maps through the content box, so taps aren't offset by the border: `(clientX − r.left − canvas.clientLeft) / canvas.clientWidth · W`, and the same for y.
- **CSS rule:** the global canvas rule's `max-width: 100%` stays, because `fit()` already accounts for the border.

### 8. Verification approach
- **Sim unchanged:** a Node script imports the `main` version of `lib/engine.js` (via `git show main:lib/engine.js` written to a scratch file) and the working version. It stubs `Math.random` with the same seeded generator in both, calls `renderTake(120)`, and compares the hit lists exactly.
- **Figure fits:** in a scratch run, `draw()` is instrumented to record each frame's bounding box (excluding wind dashes). This set `K`/`TOP` (Decision 1) and is re-run after the redraw to confirm the at-rest and 99%-at-default-wind scenarios.
- **Playwright** (new scratch `drawing-check.mjs`):
  - read the canvas pixels for the two-color check and the "no 3×3 black block at rest" check;
  - tap tube centers from `tubeSegments()` and listen via the MIDI stub;
  - check wind dash counts, sizes and the border, and that the readout width matches.
- **Existing suites:** the MIDI and UI suites run unchanged, since the drawing has no effect on them.

## Risks / Trade-offs

- **[Strong wind swings the sail or clapper past the paper edge]** → Accepted. At K = 0.8 the figure fits at rest and in 99.4% of frames at the default wind. In stronger gusts parts clip at the edge, as today. The sim is never limited to prevent it.
- **[At 343 px, a 200 px raster scaled 1.7× draws uneven 1–2 px lines]** → This is the same compromise the canvas already makes below ×2 today, and the spec allows it. Phones in landscape and tablets get ×2.
- **[A wireframe with no occlusion gets busy where back tubes cross the clapper and ring]** → That's intended (DBN-like, and in the spec). If it reads as noise in screenshots, the fallback is to drop the hook line, not to reintroduce fills.
- **[Thin 1px tubes are hard to hit on touch]** → The ±6 raster px hit area is about ±10 CSS px on a phone, and nearest-wins resolves overlaps.

## Migration Plan

- Work on a branch, and check the Vercel preview on a phone before merging to `main`. Merging deploys to https://chime.dmbk.io.
- No data, storage or API changes. Rollback is reverting the merge commit.
