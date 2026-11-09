# Design

## Context

`ChimeUnit` sizes its canvas in a `fit` effect, which runs on mount, on its own `ResizeObserver`, and on `window.resize`:

```js
const avail = stage.clientWidth - 2;                       // inside the 1px border
const maxByH = Math.max(320, innerHeight - 110) * W / H;
const w = Math.min(avail, maxByH, W * 2);                   // cap 400
setCanvasPx(w >= W * 2 ? Math.floor(w / W) * W : w);
```

The `motion.section` is `w-[min(402px,100%)]` (the drawing, plus its border, at its 400 px cap). The drawer and its sound line take `canvasPx + 2`. The position effect re-clamps whenever `canvasPx` changes.

## Decisions

**The breakpoint comes from the same media query in CSS and JS.**
- In CSS, Tailwind's `max-sm:` variant gives `@media (width < 40rem)`, which is 640 px at the default root size.
- `fit` reads `window.matchMedia("(width < 40rem)").matches` rather than `innerWidth`, so the class and the canvas size can't disagree, whether at a zoom level or with a different root font size.
- The `resize` listener already re-runs `fit` across the breakpoint, so no media-query listener is needed.

**The cap goes into `fit`.**
- `const cap = narrow ? 298 : W * 2` replaces the fixed `W * 2` in the `Math.min`.
- 298 is below 400, so the whole-multiple branch never applies on narrow screens. The drawing is shown at 1.49×, still with nearest-neighbor scaling, as phones already are today (about 1.7× on a 375 px screen).

**The section's width follows the cap.**
- `max-sm:w-[min(300px,100%)]` is added next to `w-[min(402px,100%)]`, so the section, and with it the `stageRef` width that `fit` measures, is 300 px on narrow screens.
- Without it, the section would stay 343 px wide on a 375 px phone around a 300 px canvas. That would leave an invisible drag and front strip, and break the "unit is 300 px" scenario.

**There is no server-render mismatch.**
- The server renders `canvasPx = 400`, and `fit` sets the real size on mount, as now.
- The width class is pure CSS, so it is right from the first paint.

**Positions need no change.** They are offsets from the center, and the existing clamp effect depends on `canvasPx`, so a unit shrinking or growing across the breakpoint is pulled back inside the viewport.

## Risks / Trade-offs

- **Phones in landscape** that are 640 px wide or wider (most, e.g. 844 × 390) get the larger size, limited by height through `maxByH`, as now. That follows from defining the breakpoint by width.
- **The drawing is small:** at 298 px, the drawing's 1 px lines are about 1.5 px. That's still crisp with `pixelated` scaling, and tube hit areas stay at least 6 raster px (about 9 CSS px) on each side.
