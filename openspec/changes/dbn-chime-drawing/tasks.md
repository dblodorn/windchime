# Tasks

## 1. Baseline and measurements

- [x] 1.1 Create branch `dbn-chime-drawing` from `main`, then take before screenshots at 1280 px and 375 px into the scratchpad. Verify: the screenshot paths are noted in this task's completion message.
- [x] 1.2 Write the scratch `sim-same.mjs`: write `git show main:lib/engine.js` to a scratch file, stub `Math.random` with one seeded generator, call `renderTake(120)` on that copy and on the working `lib/engine.js`, and compare the hit lists exactly. Verify: it reports identical lists on the unchanged tree (a self-check before any edits).
- [x] 1.3 Measure the figure's extent: in a scratch copy of the engine, record each frame's bounding box (excluding wind dashes) of every point `draw()` plots, in old projection space, over 10 simulated minutes per wind level. Choose `K` and `TOP` (design Decision 1). Verify: the measured extents and the chosen K/TOP are noted in this task's completion message.
  - Result: at rest the figure spans ±62 × 0–186 (old units). At WIND 0.45 the clapper's x reaches ±68 at p99 and 96 at max, and at WIND 1.0 it reaches 170, so the sail goes far off-paper. A full fit would need K ≈ 0.38. The user chose to allow clipping in strong gusts (2026-10-31). K = 0.8, TOP = 0: fits at rest, and in 99.43% of frames at WIND 0.45. The spec's "figure fits" scenarios were revised to match.

## 2. Raster primitives (`lib/engine.js`)

- [x] 2.1 Set `W = H = 200` and add the paper transform (`K`, `TOP`) and `seg()` on top of the existing Bresenham `line()`. Verify: `node -e 'import("./lib/engine.js").then(m => console.log(m.W, m.H))'` prints `200 200`.
- [x] 2.2 Add `outline(cx, cy, rx, ry, n)` (a closed n-gon of `seg`s), and delete `fillPoly`, `ellipse` and `fillEllipse`. Verify: `grep -nE "fillPoly|fillEllipse|\bellipse\(" lib/engine.js` is empty, and the module still imports in Node.

## 3. Drawing (`lib/engine.js`)

- [x] 3.1 Rewrite `draw()`, `drawTube()` and `drawStriker()` per design Decision 3: hook, single ring outline (24 segments), one string and one line per tube with the existing swing formulas, clapper outline (16 segments) with its string, and the sail's four sides with its string. No fills; fixed draw order, depth sort removed. Verify: a production-build screenshot at 1280 px shows all elements in three-quarter view, and the scratch pixel check finds only `#000`/`#fff` and no 3×3 all-black block with WIND 0 at rest.
- [x] 3.2 Add the strike fan per Decision 4 and tune it against screenshots. Verify: after a tap, a screenshot shows the fan; with DECAY 1.0 s it is smaller at 0.5 s and gone by 1.5 s.
  - Result: built and verified, then removed at the user's request (2026-10-31). Decision 4 and the spec were updated, and the fan checks were dropped from `drawing-check.mjs`.
- [x] 3.3 Change the wind streaks to solid single-pixel dashes through `seg`, keeping their drift and the `round(WIND·30)` count. Verify: WIND 0 shows no dashes, and WIND 0.8 shows more than WIND 0.2 (counted from canvas pixels outside the figure's bounding box).
- [x] 3.4 Rewrite `strikeAt(x, y)` for paper coordinates per Decision 6 (±6 px around the slanted tube line within its y-span ±6, nearest wins, same push and `liveHit(i, 96)`), and export `tubeSegments()`. Verify: the scratch test taps each tube's midpoint and sees exactly that tube struck; a tap 5 px to the side still strikes it; a tap in the top-left corner strikes nothing.
- [x] 3.5 Run `sim-same.mjs` against the edited engine. Verify: the hit lists are identical to `main`'s.

## 4. Canvas, border and readout (`components/Chime.jsx`, CSS)

- [x] 4.1 Give the canvas `box-sizing: content-box` and a 1px solid foreground border. Update `fit()` to subtract the 2 px border from the available width, use the square aspect, keep whole multiples at ≥ 2W, and cap at W·3. Verify: at 1280 px the canvas computes to a 400×400 content box with a 1px solid black border; at 375 px it is square, fills the width inside the page padding, and the page has no horizontal scroll.
- [x] 4.2 Set the tube readout width to `canvasPx + 2`, and map `onCanvasDown` through the content box (`clientLeft`/`clientWidth`). Verify: the readout's outer width equals the canvas's outer width at 1280 px and 375 px, and the tap test from 3.4 also passes at 375 px.

## 5. Verification and docs

- [x] 5.1 Write the scratch `drawing-check.mjs` covering every automatable `chime-drawing` scenario:
  - sizes, border and `pixelated` rendering;
  - two colors, and no 3×3 black block at rest;
  - six hang points with the back tubes above the front ones;
  - the sixth tube about 1/√2 the length of the first on the default (Ryukyu) scale;
  - the figure fits at WIND 1.0;
  - the clapper is within a few px of the struck tube when the sim reports a strike;
  - wind dash counts;
  - tap each tube, near-miss, empty space;
  - readout width match.

  Verify: all checks pass against `next start`.
- [x] 5.2 Run the existing scratch `midi-check.mjs` and `ui-check.mjs` against `next start` and then `next dev`, one server at a time. Verify: 50/50 and 77/77 on both.
- [x] 5.3 Update `CLAUDE.md`'s `lib/engine.js` sections 1 (Raster: 200×200, `seg`, `outline`, the K/TOP paper transform) and 5 (Drawing: single-line wireframe, no depth sort), plus `strikeAt` and `tubeSegments()`, and the canvas border/content-box note. Verify: every name mentioned exists in the code.
- [x] 5.4 Commit and push the branch, then check the Vercel preview on a phone and on desktop: the drawing reads as intended, tapping tubes strikes them, and the wind looks right (the fan was removed in review). Verify: the user confirms before merging to `main`.
