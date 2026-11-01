# Proposal

## Why

The chime drawing has drifted from the rest of the page. It's a 192×232 three-quarter view with filled shapes, doubled outlines, pixel ellipses, dotted highlights and a shimmer of dashes, while the parameter sheet next to it is now strict single-weight lines in black and white. The goal is a simpler drawing in the vocabulary of John Maeda's *Design By Numbers* (MIT Press, 1999/2001):
- a small square "paper" (DBN's is 100×100 points; ours is 200×200);
- single-pixel straight lines and rectangles with no fills or shading;
- form built from repetition (runs of lines);
- the output read as a framed figure.

The drawing should keep its three-quarter perspective rather than becoming a flat front view, and sit inside a 1px border like the other bordered elements on the page.

## What Changes

- **Canvas:** the raster goes from 192×232 to a **200×200 square**, still 1-bit black on white. Where there is room it scales up by whole multiples (×2 = 400 px on desktop). Narrower screens fit the available width, as the canvas already does today below ×2. It sits inside a **1px black CSS border** at screen resolution.
- **Drawing (three-quarter perspective, kept)**: the same foreshortened view of the ring as today, at the new scale. Every element is single-pixel lines only:
  - a hook line from the top edge to the ring;
  - the ring as one closed, foreshortened outline, drawn as a run of short straight segments in the DBN manner rather than a doubled pixel ellipse;
  - six tubes as outlined narrow rectangles (single-pixel sides and caps, no fill) hung on short string lines from their true positions around the ring, so depth reads from their spacing and height, with lengths from pitch as now;
  - the clapper disc as one foreshortened outline on its string;
  - the sail as an outlined rectangle that narrows as it turns with the wind, as now.
- **Overlap:** with no fills, nothing hides anything else. Back tubes, the clapper and the ring cross freely as overlapping lines, like a wireframe.
- **Motion:** the simulation and its tuning are unchanged; only how its state is drawn changes. Positions come straight from the sim geometry through the same projection as today, scaled to the new paper, so the clapper is drawn where it actually strikes.
- **Strikes:** no drawn effect beyond the tube's swing; the tube readout cell still flashes. (A fan of lines from the ringing tube was built, then removed at the user's request.)
- **Wind:** sparse short horizontal dashes whose number follows WIND, as now, at the new scale.
- **Removed:** fills, doubled outlines, the solid disc and sail fills, dotted highlights and the dash shimmer.
- **Tapping:** a tube is struck by tapping near its line within its height, with a hit area wide enough for a finger even though the line is one raster pixel wide.
- **Tube readout:** keeps its 1px border and matches the canvas width.

## Capabilities

### New Capabilities
- `chime-drawing`: what the instrument drawing shows and how it responds:
  - canvas size, scaling and border;
  - which elements are drawn and in what visual vocabulary;
  - the three-quarter perspective and how depth reads;
  - how the clapper, tubes and wind are shown moving;
  - striking a tube by tapping.

### Modified Capabilities
<!-- None. ui-controls covers the parameter sheet's controls, not the canvas; midi-output is unaffected. -->

## Impact

- **`lib/engine.js`:**
  - Raster section: `W`/`H` become 200×200. `fillPoly` and `fillEllipse` lose their callers, and `ellipse` is replaced by a segmented outline.
  - Drawing section: `draw`, `drawTube` and `drawStriker` are rewritten, and the projection constants (`CX`, `RING_Y`, `Z`, `STR`, `STRIKER_Y`, `SAIL_Y`) are rescaled for the 200×200 paper.
  - `strikeAt`: hit-testing is rescaled, with a wider hit area per tube.
  - Section 4 (`makeSim`, `step`, the constants and the strike-rate tuning) is **not** changed.
- **`components/Chime.jsx`:** canvas sizing for a square raster (×2 = 400 px on desktop; fit to width on a phone, about 343 px), the canvas border, and the tube readout width.
- **`app/globals.css`:** the canvas rule gains the border, or the border goes in a utility class.
- **`CLAUDE.md`:** the engine section notes for Raster and Drawing.
- **No change** to audio, MIDI output, `.mid` export, `renderTake` or the parameter controls.
- **Testing:** screenshots before and after at desktop and phone widths, plus a Playwright check that tapping each tube strikes that tube (via `onHit` / the MIDI stub). The existing MIDI and UI suites must still pass, and a strike-rate spot check confirms the sim is untouched.
