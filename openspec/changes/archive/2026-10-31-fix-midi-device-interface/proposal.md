# Proposal

## Why

MIDI output does not work in any browser that supports Web MIDI, Chrome included. `Chime.jsx` is prerendered, and on the server `M.supported()` returns `false` because there is no `navigator`. So the CONNECT MIDI button is sent as `disabled`. React does not fix mismatched attributes during hydration, so the button stays disabled and MIDI access can never be requested. This was confirmed on https://windchime-lyart.vercel.app in Chromium: `requestMIDIAccess` exists, yet the button is still `disabled` after hydration. Fixing this also exposes gaps in how the panel handles real devices: hot-plugging, denied permission, and no way to confirm that a device is receiving.

## What Changes

- **Fix the support check.** Web MIDI support is detected on the client after mount and held in React state, not read during render. CONNECT MIDI is enabled wherever `navigator.requestMIDIAccess` exists. The "no Web MIDI" message is shown only on the client and only when support is really missing.
- **Reconnect on replug.** When the selected port disconnects, the panel shows it as disconnected rather than silently going back to NONE. When a port with the saved name (`windchime.midiOutName`) appears again, it is selected again, and program change and CC are resent when those options are on. A device plugged in after CONNECT is also picked if it matches the saved name.
- **Handle a denied permission.** A `NotAllowedError` (prompt dismissed or blocked) or `SecurityError` shows a clear message saying how to allow MIDI in Chrome's site settings. CONNECT MIDI stays available so the user can try again. Other failures show the browser's message.
- **Confirm the device is receiving.** A TEST NOTE button sends one note on the chosen port and channel at a fixed velocity, with a short note-off. The panel shows the selected port's state: connected/disconnected and open/closed/pending. The status line counts notes sent per session, as it does now.
- Permission is still requested only from the CONNECT MIDI click, never on load (no change).

## Capabilities

### New Capabilities
- `midi-output`: Web MIDI output from the chime: detecting support, the permission/connect flow, listing and choosing ports, remembering and reconnecting the port, choosing the channel, sending notes/program/CC, test note, PANIC, and status reporting.

### Modified Capabilities
<!-- None: there are no existing specs in openspec/specs/. -->

## Impact

- `components/Chime.jsx`: support state set on mount; changes to the MIDI OUT panel (enabled state, port status, TEST NOTE button, permission messages); auto-reselect on `onChange`.
- `lib/midiout.js`: `onstatechange` handling for disconnect/reconnect; exposing port state (`state`, `connection`); a `testNote()` helper; matching ports by saved name.
- `localStorage`: reuses `windchime.midiOutName`, `windchime.midiCh`, `windchime.sendProg` and `windchime.sendCC`. No new keys are expected.
- No new dependencies. No change to the audio graph, to `.mid` export, or to the requirement that audio starts inside a tap.
- Testing: Playwright in headless Chromium with a stubbed `navigator.requestMIDIAccess`, checking the button is enabled after hydration and the bytes sent by TEST NOTE, reconnect and PANIC. Real hardware has to be checked by hand.
