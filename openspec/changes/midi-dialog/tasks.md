# Tasks

## 1. Setup

- [x] 1.1 Create branch `midi-dialog` from `main`, run `pnpm build`, and record the current First Load JS for `/`. Take before screenshots at 1280 px and 375 px into the scratchpad. Verify: the First Load JS figure and the screenshot paths are noted in this task's completion message.
  - Result: First Load JS for `/` was 164 kB. Before screenshots: `before-midi-dialog-{1280,375}.png` in the session scratchpad.
- [x] 1.2 Add the dialog component with `pnpm dlx shadcn@4.23.0 add dialog`, then strip it per design Decision 1: no `rounded-*`/`shadow-*`/`ring-*`/`dark:*`, no lucide icon or built-in close button, a transparent overlay, and content that is `bg-background border border-foreground`, `min(520px, 100vw − 32px)` wide, `max-h-[calc(100dvh-32px)] overflow-y-auto`. Remove `lucide-react` from `package.json` if the CLI added it, and run `pnpm install`. Verify: `grep -nE "rounded|shadow|ring-|dark:|lucide" components/ui/dialog.jsx` is empty, `git diff package.json pnpm-lock.yaml` shows no new runtime dependency, and `pnpm build` succeeds.
  - Result: the CLI asked to overwrite `button.jsx` and was told no. `dialog.jsx` was stripped (transparent overlay, no animation, no close icon). `package.json` and the lockfile are unchanged.

## 2. Button and dialog (`components/Chime.jsx`)

- [x] 2.1 Add a `MidiLogo` component that inlines the Commons wordmark's four shapes, with viewBox `137 96 712 266`, `fill="currentColor"`, `aria-hidden` and `focusable="false"`, and a comment giving the source URL, PD-textlogo status and the trademark note. Verify: it renders in a test page as the MIDI wordmark, matching the Commons preview.
  - Result: `shapeRendering="crispEdges"` and a whole-pixel size (`w-12 h-[18px]`) keep every pixel of the button black or white. A fractional auto width left one grey pixel at 375 px.
- [x] 2.2 Add the `midiOpen` state and a controlled `<Dialog>` with the MIDI button as `DialogTrigger asChild` around `Button`, named `aria-label="MIDI"`, placed after the main grid (design Decision 3). Fix it at `calc(16px + env(safe-area-inset-*, 0px))` from the right and bottom, `z-40`, `h-11`, with the logo drawn about 48×18 px. Verify: at 1280 and 375 px, the button's right and bottom edges are 16 px from the viewport's edges and stay there after scrolling to the end. It is at least 44×44, and `getByRole("button", { name: "MIDI" })` has `aria-haspopup="dialog"`.
- [x] 2.3 Move the MIDI OUT block unchanged into `DialogContent`, with a header row holding `DialogTitle` "MIDI OUT" and a `DialogClose asChild` CLOSE button. Make the help line the `DialogDescription`, and drop its duplicate `<span>` beside CONNECT MIDI. Remove the block and its trailing `<hr>` from the sheet. Keep `midiLine` in the status block. Verify: with the dialog closed, none of CONNECT MIDI, MIDI OUT, CHANNEL, the three checkboxes, TEST NOTE or PANIC is in the page. Opening the dialog shows a dialog named "MIDI OUT" with CONNECT MIDI and the help text, and the console has no Radix description warning.
- [x] 2.4 Add the live-state inversion: `data-live` when `midi.port` is set and connected, styled `data-[live]:bg-foreground data-[live]:text-background`. Verify with the MIDI stub: it is black on white before connecting, white on black after connecting with a port picked, black on white after the stub fires a disconnect `statechange`, and inverted again after a reconnect.

## 3. Page layout (`app/globals.css`)

- [x] 3.1 Raise `html`'s bottom padding to `max(76px, calc(76px + env(safe-area-inset-bottom, 0px)))` (design Decision 4). Verify: scrolled to the bottom at 375 and 1280 px, the button's box overlaps no text or control box on the page.

## 4. Verification

- [x] 4.1 Update the scratch `midi-check.mjs` and `ui-check.mjs` with an `openMidi(page)` helper that opens the dialog before driving MIDI controls, with no change to their assertions. Verify: `midi-check.mjs` 50/50 and `ui-check.mjs` 77/77 against a production build (`pnpm build && pnpm start`).
  - Result: midi-check 50/50 and ui-check 79/79. ui-check gained 2 checks (a palette sweep with the dialog open, and the button named MIDI), and its tab walk now covers the sheet (12 controls) and the dialog (8) for 20 controls, against 18 before. `drawing-check.mjs` also opens the dialog to connect.
- [x] 4.2 Write the scratch `midi-dialog-check.mjs`, covering every scenario in `specs/midi-dialog/spec.md` at 1280 and 375 px (design Decision 7). This includes:
  - Result: 76/76 at 1280 and 375 px. The only console warnings are the existing Tone autoplay warnings, which come from loading audio on page load; there is no Radix warning.
  - no `requestMIDIAccess` call on opening the dialog;
  - focus moving in and trapped by Tab, and returning to the button after Escape, CLOSE and an outside click;
  - the CHANNEL select inside the dialog choosing an option without closing the dialog;
  - a tube tap while the dialog is closed sending a note-on;
  - reopening keeping the port and channel 5;
  - two colors and square, shadowless styles with the dialog open;
  - the dialog fitting 375×640 and scrolling inside itself;
  - the server HTML containing the button and no open dialog;
  - no hydration warnings.

  Verify: all checks pass against the production build.
- [x] 4.3 Run `pnpm build` and compare First Load JS for `/` with task 1.1. Verify: the increase is noted in this task's completion message and in the PR description.
  - Result: First Load JS for `/` went from 164 kB to 167 kB (+3 kB).
- [x] 4.4 Run the scratch `sim-same.mjs` and `drawing-check.mjs`, to confirm the engine and drawing are untouched. Verify: SIM IDENTICAL, and 30/30.
  - Result: SIM IDENTICAL; drawing-check 30/30.

## 5. Docs and release

- [x] 5.1 Update `CLAUDE.md`: the layout lists `components/ui/dialog.jsx`; the `Chime.jsx` notes say the MIDI OUT controls live in a controlled dialog opened by the fixed MIDI button, with state kept in `Chime`; and the "Adding a component" note mentions the transparent overlay. Verify: `grep -n "dialog" CLAUDE.md` shows the new lines.
- [ ] 5.2 Commit, push the branch and open a PR with the before and after screenshots, check results and bundle change. Verify: the PR URL and the Vercel preview URL are noted in this task's completion message, and the preview deploy succeeded.
- [ ] 5.3 Check the Vercel preview on a phone and on desktop: the button sits lower right and reads as the MIDI logo, the dialog opens and closes, MIDI hardware connects from the dialog, and nothing is covered at scroll end. Verify: the user confirms before merging to `main`.
