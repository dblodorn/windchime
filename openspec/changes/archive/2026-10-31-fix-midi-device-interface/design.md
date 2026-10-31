# Design

## Context

See proposal.md (Why) for the bug, and `specs/midi-output/spec.md` for the required behavior.

How the code works now:

- `lib/midiout.js` holds the MIDI state at module level: `access`, `output`, `channel`, and `offTimers` (note → timeout). It notifies React through `onChange(fn)`, which returns an unsubscribe function. The rule of keeping engine-style listeners unsubscribable applies here too (strict mode runs effects twice).
- `components/Chime.jsx` reads `M.supported()` during render. That is where the hydration bug comes from. React state mirrors the module: `midiReady`, `midiPorts`, `midiOut` (port id), `midiCh`, `midiMsg` and `midiCount`.
- The program-change and CC effects already depend on `[prog, sendProg, midiOut, midiCh]` and `[cutX, q, sendCC, midiOut, midiCh]`. So they resend whenever the selected port id changes. `choosePort` also sends them directly, which means they go out twice.
- The remembered port name (`windchime.midiOutName`) is only checked inside `onMidiConnect`. The module knows nothing about it, so it can't select the port again when a statechange arrives.

Constraints: `lib/midiout.js` must not touch `navigator` at module top level, because of SSR. Permission may only be requested from the CONNECT MIDI click. The UI keeps the two-color Courier style with dotted-leader `Param` rows.

## Goals / Non-Goals

**Goals:**
- Keep all port lifecycle logic in `lib/midiout.js`: remembered name, reconnect, and port state. React only renders a snapshot of it and reacts to changes.
- Have one place that sends the "port just became live" setup (program change and CCs), whether the port was chosen by hand, auto-selected on connect, or reconnected.
- Make the support check give the same result on the server and on the first client render.

**Non-Goals:**
- MIDI input, MIDI clock, SysEx.
- Choosing more than one output port at once.
- Adding a test runner or committing Playwright as a dependency. That's the separate Vitest/lockfile idea.
- Changing `.mid` export, the audio graph, or strike velocities.

## Decisions

### 1. Support check: tri-state React state set on mount
`const [midiSupported, setMidiSupported] = useState(null)`. A mount effect sets it to `M.supported()`. The button renders `disabled={midiSupported === false}`, and the "no Web MIDI" message appears only when it is `false`. The server and the first client render both see `null`, so the markup matches and hydration has nothing to fix. Unsupported browsers disable the button on the very next render.

- *Alternative: `useSyncExternalStore` with a server snapshot of `false`.* Rejected. It still renders disabled on the server, and React only fixes that on a later client render, so the code would depend on a subtler path. It's also more machinery than a value that never changes.
- *Alternative: `suppressHydrationWarning` or a client-only dynamic import of the panel.* Rejected. The first only hides the warning and leaves the stale attribute. The second makes the panel flash in after load.
- If the button is clicked during the brief `null` window, `M.connect()` still checks support itself and throws its own message. So enabling the button early is safe.

### 2. The module owns the remembered port name and reconnects by name
`midiout.js` gains a `wanted` port name. `selectOutput(id)` sets it to that port's name, and `null` clears it. `setWanted(name)` lets `Chime.jsx` seed it from `localStorage` before connecting.

- After `connect()`, and in `onstatechange`, the module runs `adopt()`. If no output is live and a connected output named `wanted` exists, that output becomes `output`. On connect, if nothing matches the name and exactly one output exists, that one is adopted (spec: Port selection and memory).
- Matching is by **name**, not id. Chrome usually keeps the same id across a replug, but ids can change between OS sessions and differ by driver, while the name stays stable. That's also what `midiOutName` already stores.
- On a `disconnected` statechange for the live port: clear its `offTimers` without sending (the port is gone), set `output = null`, and keep `wanted` so the panel can show "NAME  DISCONNECTED".
- Any change to the live port (adopted, chosen, lost) bumps a module counter, `linkSeq`, and calls `emit()`.

*Alternative: keep the reconnect logic in `Chime.jsx`'s `onChange` handler.* Rejected. It would copy port-matching rules into React state, run twice under strict mode, and be harder to test without a DOM.

### 3. One snapshot for React, and the setup resend keyed on `linkSeq`
`M.status()` returns `{ connected, wanted, port: { id, name, manufacturer, state, connection } | null, linkSeq }`. The `onChange` handler in `Chime.jsx` stores the snapshot, and the existing `midiReady`, `midiOut` and status line are derived from it.

The program-change and CC effects swap `midiOut` in their dependency lists for `link = status.linkSeq`. So the setup goes out exactly once each time a port becomes live, including a reconnect that keeps the same id. In that case `midiOut` wouldn't change, and today's effects wouldn't fire. The direct sends in `choosePort` are removed, which ends the duplicate.

### 4. Open the port explicitly when it is selected
When a port is adopted or chosen, the module calls `output.open()`. A `statechange` then reports `connection: "open"`, so the status can say OPEN before the first strike. If the open is rejected, the module emits an error message instead. This happens when another app holds the port exclusively, as Windows drivers often do. `send()` keeps its try/catch.

*Alternative: rely on Chrome's implicit open on first `send()`.* Rejected. The status would read CLOSED until the wind happens to strike, which defeats the point of showing state.

### 5. Permission errors are mapped in `Chime.jsx`, and `access` is not cached on failure
`connect()` assigns `access` only after `requestMIDIAccess` resolves, so a rejected request leaves the module ready to try again. `onMidiConnect` maps `NotAllowedError` and `SecurityError` to the "blocked" message, pointing to the site-settings control left of the address bar. Any other error shows `err.message`. `midiReady` stays false on failure, so CONNECT MIDI is still shown.

Chrome rejects without a prompt once a site is blocked. That's why the message has to explain where to go rather than saying "try again".

### 6. TEST NOTE goes through `note()`
`M.testNote(n)` calls `note(n, 100, 0.5)`. It reuses the re-strike and off-timer bookkeeping, so PANIC and channel changes also cover the test note. `Chime.jsx` passes `E.noteOf(0)` and counts it in `midiCount` like any other sent note. The button is disabled unless `status.port` is connected.

### 7. Status line format
This keeps the existing `MIDI    …` status line style, in uppercase with wide spacing:
- `MIDI    not connected`
- `MIDI    choose an interface`
- `MIDI    <NAME>   CONNECTED · OPEN   CH n   k NOTES SENT`
- `MIDI    <NAME>   DISCONNECTED`

It uses text only, with no color or icons.

## Risks / Trade-offs

- [Two devices with the same name, such as two identical interfaces] → `adopt()` takes the first match. That's acceptable for one output. The picker still lets the user choose the other one explicitly.
- [`open()` resolves late or never on some drivers] → Nothing blocks on it. Strikes still `send()`, which opens implicitly, and the status shows PENDING until a statechange arrives.
- [Program/CC effects now depend on `linkSeq`] → If `linkSeq` isn't bumped on some path, the setup won't be resent. Mitigation: every write to `output` goes through one internal `setLive(port)` that bumps it.
- [Hardware behavior can't be automated] → The Playwright stub covers the bytes and the state flows. Unplugging and replugging a real interface in Chrome, and the IAC Driver on macOS, have to be checked by hand before merging.
- [The `null` support window enables the button for one frame on unsupported browsers] → `M.connect()` still refuses with the correct message, so there's no wrong behavior, only a frame of enabled styling.

## Migration Plan

- No data migration. The `windchime.*` storage keys are unchanged, and an existing `midiOutName` seeds `wanted` on the next connect.
- Ship on a branch first. Its Vercel preview deployment lets you check the hydrated button and a real device in Chrome before merging to `main`, which deploys production.
- Rollback: revert the merge commit, or roll back to the previous production deployment in Vercel.

## Open Questions

- Firefox gates Web MIDI behind a site-permission add-on prompt. Should the "blocked" message also name Firefox's flow, or stay Chrome-oriented? This is copy only and can be settled during implementation.
