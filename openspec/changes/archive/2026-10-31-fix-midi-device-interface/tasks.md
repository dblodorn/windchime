# Tasks

## 1. Hydration fix (support check)

- [x] 1.1 In `components/Chime.jsx`, add `midiSupported` state (initial `null`), set from `M.supported()` in a mount effect. Render CONNECT MIDI with `disabled={midiSupported === false}`, and show the "no Web MIDI" message only when it is `false`. Verify: `npm run build && npm run start`, then `curl -s localhost:3000 | grep -o '<button[^>]*>CONNECT MIDI</button>'` shows no `disabled`.
- [x] 1.2 Verify in headless Chromium (Playwright scratch script against `npm run start`) that CONNECT MIDI is enabled after hydration. Then delete `navigator.requestMIDIAccess` via an init script, reload, and check that the button is disabled and the "no Web MIDI" message appears.

## 2. Port lifecycle in `lib/midiout.js`

- [x] 2.1 Add an internal `setLive(port)` as the only place that writes `output`. It bumps `linkSeq`, calls `port.open()` (an open failure emits an error message), and calls `emit()`. Route `selectOutput` through it. Verify: Node import of `lib/midiout.js` still succeeds without a DOM (`node -e 'import("./lib/midiout.js").then(m => console.log(typeof m.connect))'`).
- [x] 2.2 Add the `wanted` port name: `setWanted(name)`, set by `selectOutput(id)` and cleared by `selectOutput("")`. Add `adopt()`, which picks the connected output named `wanted`, or the only output when there's no match, and only on connect. Call it after `connect()` and on every `statechange`. Verify with the Playwright stub: a saved name is auto-selected on connect, and a single port is auto-selected.
- [x] 2.3 On a `disconnected` statechange for the live port, clear `offTimers` without sending, set `output = null`, keep `wanted`, bump `linkSeq` and emit. Verify with the stub: after a fake disconnect, strikes record no `send()` calls and no delayed note-offs fire.
- [x] 2.4 Handle reconnect. A `connected` statechange whose port name matches `wanted` is adopted again through `setLive`. Verify with the stub: after disconnect and then reconnect (same id, and also a new id), strikes send to the port again.
- [x] 2.5 Make `connect()` assign `access` only after `requestMIDIAccess` resolves, so a rejected request can be retried. Verify with the stub: the first call rejects with `NotAllowedError`, and a second call resolves and lists ports.
- [x] 2.6 Add `status()`, returning `{ connected, wanted, port: { id, name, manufacturer, state, connection } | null, linkSeq }`, and `testNote(n)`, which calls `note(n, 100, 0.5)`. Verify with the stub: `testNote` records `0x9n n 100`, then `0x8n n 0` about 500 ms later on the chosen channel.

## 3. Panel wiring in `components/Chime.jsx`

- [x] 3.1 Replace the `onChange` handler body with one that stores `M.status()` in state. Derive `midiReady`, `midiOut` and the port list from it, and keep the unsubscribe return. Seed `M.setWanted(store.get("midiOutName", ""))` before `M.connect()`, and save `midiOutName` whenever the status's `wanted` changes. Verify: dev mode (strict mode) shows no duplicate listeners. With the stub, the port picker tracks a port added after connect.
- [x] 3.2 Change the program-change and CC effects to depend on `status.linkSeq` instead of `midiOut`, and remove the direct `M.program`/`M.cc` calls from `choosePort`. Verify with the stub: selecting a port sends CC0, CC32, the program change, CC74 and CC71 exactly once, and a reconnect with the same id sends them again.
- [x] 3.3 Map `NotAllowedError`/`SecurityError` in `onMidiConnect` to the "blocked" message, pointing to the site-settings control left of the address bar. Other errors show `err.message` or "MIDI access failed.", and `midiReady` stays false so CONNECT MIDI remains. Settle the Firefox wording from the design's open question here. Verify with the stub: a rejection shows the message and the button can be clicked again.
- [x] 3.4 Add a TEST NOTE button next to PANIC, disabled unless `status.port` is connected. It calls `M.testNote(E.noteOf(0))` and adds one to `midiCount`. Verify with the stub: the bytes from 2.6 are recorded, and the button is disabled with NONE selected.
- [x] 3.5 Update the status line to the design's formats (not connected / choose an interface / `NAME   CONNECTED · OPEN   CH n   k NOTES SENT` / `NAME   DISCONNECTED`). Keep the plain-text, two-color style, and add any CSS only to `app/globals.css`. Verify: walk through each state with the stub and read the status line text.

## 4. Integration check and docs

- [x] 4.1 Run one Playwright pass (scratch script, not committed) covering every spec scenario that can be stubbed: support detection, no request on load, permission failure and retry, listing, remembered and single-port selection, disconnect/reconnect, channel change note-offs, strike note-on/off, program/CC on and off, TEST NOTE, PANIC (`0xBn 123`, `0xBn 120`, and no late note-offs), browser-sound-off still sending. Verify: all checks pass, and `npm run build` succeeds.
- [x] 4.2 Update `CLAUDE.md`, covering the `lib/midiout.js` port lifecycle (`wanted`, `adopt`, `setLive`, `linkSeq`, `status()`) and the SSR rule for browser-capability checks (detect on mount, never during render). Verify: the doc names match the code.
- [x] 4.3 Push a branch and check the Vercel preview in Chrome with a real or IAC Driver device: connect, test note, unplug/replug (or disable/enable the IAC bus), and blocking then allowing permission. Verify: the user confirms the device receives notes and reconnects, before merging to `main`.
