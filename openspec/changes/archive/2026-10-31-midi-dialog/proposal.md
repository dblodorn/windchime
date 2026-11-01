# Proposal

## Why

The MIDI OUT section takes up the middle of the parameter sheet: CONNECT MIDI, then port, channel, three checkboxes, TEST NOTE and PANIC, plus help text. Most visitors never connect hardware, and on a phone that block pushes the transport buttons (SOUND, REC, RENDER, SAVE MIDI) well below the fold. Moving MIDI setup behind one always-reachable button keeps the sheet about the chime, and keeps MIDI one tap away for those who use it.

## What Changes

- Add a fixed button anchored to the lower-right corner of the viewport. It shows the MIDI logo (from https://commons.wikimedia.org/wiki/File:MIDI_LOGO.svg), redrawn as an inline SVG in black on white to keep the two-color rule. It stays in place while the page scrolls. Its accessible name is "MIDI".
- The button opens a modal dialog titled MIDI OUT. All the current MIDI OUT controls move into it unchanged: CONNECT MIDI, MIDI OUT port, CHANNEL, SEND PROGRAM CHANGE, SEND FILTER AS CC74 / CC71, PLAY SOUND IN BROWSER TOO, TEST NOTE, PANIC, and the MIDI messages (unsupported browser, access blocked, no outputs).
- The dialog closes with a CLOSE button, the Escape key, or a tap outside it. Closing it does not disconnect MIDI or stop notes. It only hides the controls.
- The button shows when MIDI is live: it inverts (white logo on black) while a port is selected and connected.
- The MIDI status line (`MIDI    <port>   CONNECTED · OPEN   CH n   N NOTES SENT`) stays in the status block on the page, so state is visible without opening the dialog.
- Add a shadcn `dialog` component, restyled to the 1-bit theme like the existing components: square, 1px black border, no shadow, white background, and a backdrop that adds no color.
- The page gets enough bottom padding that the fixed button never covers the last line of content when scrolled to the end.
- No change to MIDI behavior: port lifecycle, permission timing (still only on the CONNECT MIDI click), saved settings, notes, program change, CC, TEST NOTE and PANIC all work as they do now.

## Capabilities

### New Capabilities
- `midi-dialog`: the fixed lower-right MIDI button (logo, position, live-state inversion, accessible name) and the modal dialog that holds the MIDI OUT controls (opening, closing, focus, what it contains, that closing leaves MIDI running).

### Modified Capabilities
None.

`ui-controls` is unchanged: its visual-language requirement already covers every element and popup on the page, and the dialog's own look is specified in `midi-dialog`. `midi-output` is unchanged too: its requirements describe what the controls do, not where they sit. The status line requirement still holds because the line stays on the page.

## Impact

- `components/Chime.jsx`: the MIDI OUT block moves into a dialog. The button and dialog are added. The state and effects stay where they are, so MIDI keeps running while the dialog is closed.
- `components/ui/dialog.jsx`: new, generated with `pnpm dlx shadcn@4.23.0 add dialog` and restyled. Radix Dialog is already in the `radix-ui` package, so no new dependency is expected.
- `app/globals.css`: possibly the backdrop rule and bottom padding.
- `CLAUDE.md`: the layout and Radix notes mention the dialog.
- Scratch checks: `midi-check.mjs` and `ui-check.mjs` drive MIDI controls directly and need to open the dialog first.
- **Logo:** the MIDI logo is a trademark of the MIDI Association. Using it to mark MIDI output is the usual compatibility use. The Commons file's license is checked when the SVG is copied in.
- **SSR:** the button and the closed dialog prerender. Its open state starts closed on the server and client, so there is no hydration mismatch.
