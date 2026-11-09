# Tasks

## 1. Sizing

- [x] 1.1 In `ChimeUnit`'s `fit`, cap the drawing at 298 px while `matchMedia("(width < 40rem)")` matches, and at 400 px otherwise.
- [x] 1.2 Add `max-sm:w-[min(300px,100%)]` to the unit's `motion.section`.

## 2. Verification (Playwright against `pnpm build && pnpm start`)

- [x] 2.1 Sizes:
  - 1280 px: the drawing is 400 px.
  - 375 px: the drawing is 298 px, and the section and the canvas with its border are both 300 px.
  - 320 px: the drawing fills the available space and is under 298 px.
  - A 600 px window: the drawing is 298 px.
  - None of these widths scrolls horizontally.
- [x] 2.2 Resizing the window 600 → 800 → 600 px: the drawing goes 400, then 298, with no reload, and the unit stays inside the viewport.
- [x] 2.3 At 375 px with NOTES on: the readout and its sound line are 300 px wide. Tapping a tube still strikes it, and dragging from empty paper moves the unit.
- [x] 2.4 Regression: rerun the t3, t5, t5b and t6 suites.

## 3. Docs

- [x] 3.1 Update CLAUDE.md and AGENTS.md (kept identical) with the narrow-screen cap.
