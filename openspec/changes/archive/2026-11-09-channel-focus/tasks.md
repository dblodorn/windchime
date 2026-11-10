# Tasks

## 1. Focus state

- [x] 1.1 In `Chime`, add `focus` state, the derived `focused` (null unless 2 or more channels are in use and one of them is `focus`), and an effect that resets a stale `focus` to null. Verify with Playwright: focus channel 3, remove its only unit, re-add a channel 3 unit, and no square is pressed.
- [x] 1.2 Add `pressUnit(id)` in `Chime`: it calls `front(id)` and clears focus when the unit's channel isn't the focused one. It reads `focus` and `units` through refs, so the callback stays stable. Pass it as `onFront`. Verify that pressing a faded unit's empty paper ends focus and brings that unit to the front, that tapping a faded unit's tube strikes it and ends focus, and that pressing a focused unit keeps focus.

## 2. Faded units

- [x] 2.1 Give `ChimeUnit` a boolean `faded` prop and add `opacity: faded ? 0.35 : 1` to the `motion.section` style. Verify that with channel 2 focused, the channel 1 unit's computed opacity is `0.35` and the channel 2 units' is `1`, and that a faded unit's strikes still send MIDI note bytes (stubbed MIDI).

## 3. Active-channels strip

- [x] 3.1 Render the `ACTIVE CHANNELS` group in `Chime` when there are 2 or more channels in use. It is fixed lower left, 16 px plus the safe area, `z-40`, 44 px tall, with 22 px squares in an 8-column grid, bottom-aligned. Each square is a `<button>` in the channel's ink with its number centered in white at 10px, named `"<n> <NAME>"`, with `aria-pressed`, the dashed focus outline, and an inset white frame while pressed. Activating a square toggles or switches focus. Verify: nothing with one channel; squares in channel order and colors with channels 1, 1 and 4; 10 channels wrap to 8 + 2; toggle and switch behave as the spec says; Enter and Space work.
- [x] 3.2 Below `sm` (640 px), move the strip to 8 px above the button row. Verify at 320, 375, 639, 640 and 1280 px (desktop and touch contexts) that the strip never overlaps any lower-right button, sits level with SHARE's bottom edge at 640 px and up, and sits 8 px above SHARE below that.

## 4. Integration checks

- [x] 4.1 Verify that focus ends on RESET and when a link with one channel is opened, that a reload starts unfocused, and that SHARE gives the same link with and without focus.
- [x] 4.2 Verify the existing behavior still holds: the channel-ink checks (t9 suite) pass, the MIDI OUT legend is unchanged, `pnpm build` succeeds, and a server render of one unit has no ACTIVE CHANNELS group and no hydration warnings.

## 5. Docs

- [x] 5.1 Document the strip, focus mode (state in `Chime`, `pressUnit`, `faded`, the narrow placement) and the visual-language exceptions in CLAUDE.md, then `cp CLAUDE.md AGENTS.md`. Verify with `diff CLAUDE.md AGENTS.md` (no output) and `openspec validate channel-focus --strict`.
