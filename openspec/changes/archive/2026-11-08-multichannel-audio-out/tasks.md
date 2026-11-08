# Tasks

## 1. Unit record

- [x] 1.1 Add `output` to `Sh.UnitSchema` and `Sh.DEFAULTS` in `lib/share.js`: a string `"a-b"` (pair `2k+1`–`2k+2`) or `"c"`, channels 1–32, `.catch("1-2")`. Leave `pack`/`unpack`/`toSaved`/`fromSaved` untouched. Verify in Node: `UnitSchema.parse({…, output: "7-8"}).output` is `"7-8"`, `"2-3"`, `"40"`, `5` and a missing field give `"1-2"`, and `encode` of a composition gives the same string with `output` `"1-2"` and `"5-6"`
- [x] 1.2 Verify in Node that `decode` of a pinned version 1 link and `fromSaved` of a saved composition give units with `output: "1-2"`, and that `toSaved` output has no output field

## 2. Engine output stage

- [x] 2.1 In `startAudio()`, create a native `AudioContext` inside the call (with `sinkId` from `setAudioDevice` when the browser accepts the option), hand it to Tone with `Tone.setContext`, then run `setupOutput`. Verify in Playwright: tapping SOUND still plays the arpeggio (an `AudioContext` reaches `running`), no console errors, and the FM CRYSTAL voice and a GM preset both play
- [x] 2.2 Rebuild `setupOutput` as the per-pair bus stage from design §2: destination set to N channels (`maxChannelCount`, capped at 32), explicit and discrete; a `ChannelMerger(N)`; buses (`DynamicsCompressor` with today's settings → `Gain 0.85` → `ChannelSplitter(2)` → merger inputs `2k`, `2k+1`) made on first use. Verify with an `OfflineAudioContext(2, …)` render of one strike on `1–2`: the output matches the old chain's render to within rounding
- [x] 2.3 Add the per-chime router (design §3) and `setParams({ output: { first, count } })`; `buildGraph` connects the filter to the router instead of `master`, and an output change reconnects only the router's last hop. Verify with an `OfflineAudioContext(8, …)`: a unit on `3–4` has energy only on channels 3 and 4, a unit on `5` only on channel 5, two units on `3–4` plus one on `3` give channel 3 all three and channel 4 the two (shared output), and changing a sounding unit's output mid-note keeps it ringing on the new channels
- [x] 2.4 Compute each chime's effective output (fallback to `1–2` when the device has fewer channels) and expose `outputAvailable()`. Verify in Node or Playwright: with N = 2 a unit set to `7–8` routes to bus 0 and reports unavailable; with N = 8 it routes to bus 3
- [x] 2.5 Add `audioOutSupported()`, `setAudioDevice(id)`, `outputChannels()` and `onOutputChange(fn)` (returns unsubscribe). On a sink change or `sinkchange`, re-read N, rebuild the merger, reconnect buses and recompute effective outputs, then notify. Verify: the Node smoke test still prints `32 function` (no DOM at top level), and in Playwright a stubbed `setSinkId` plus a changed `maxChannelCount` fires the listener once with the new count

## 3. AUDIO button and AUDIO OUT dialog

- [x] 3.1 Add the AUDIO button at `right: 16px + 84px` and move RESET to `16px + 168px` and SHARE to `16px + 252px`. Verify at 320, 375 and 1280 px wide: SHARE, RESET, AUDIO, MIDI sit in one row 8 px apart with the same height and bottom edge, AUDIO is named "AUDIO" and opens a dialog, and the page doesn't scroll sideways
- [x] 3.2 Add the controlled AUDIO OUT `Dialog` (`audioOpen`) with DEVICE (`ParamSelect`, `"default"` sentinel for SYSTEM DEFAULT), the CHANNELS row and CLOSE, and the unsupported-browser message. Detect support in a mount effect (state starts `null`). Verify in Playwright: the dialog is named "AUDIO OUT", Escape returns focus to AUDIO, opening it triggers no permission request, and with `setSinkId` removed from the prototype DEVICE is disabled with the system-output message; no hydration warnings
- [x] 3.3 Keep the device list from `enumerateDevices()` (audio outputs), refreshed on `devicechange`; store `windchime.audioOut` = `{ v: 1, id, label, channels }`; match a remembered device by id then label; call `setAudioDevice` on choice and on the first SOUND tap. Verify in Playwright with stubbed `mediaDevices` and `setSinkId`: choosing a device calls `setSinkId` with its id, the choice survives a reload, and CHANNELS shows the stored count before SOUND and the context's count after
- [x] 3.4 Handle unplug and replug: when the chosen device leaves the list, switch to system default and show it as a disabled `DISCONNECTED` item; when a matching device returns, switch back. Verify in Playwright by firing `devicechange` with the device removed, then restored: `setSinkId` is called with `""`, then with the id again, and the select shows the mark only in between
- [x] 3.5 Add SHOW DEVICE NAMES (shown when every output label is empty): `getUserMedia({ audio: true })` from the click with every track stopped at once, or `selectAudioOutput()` where it exists; `DEVICE NAMES NOT AVAILABLE` on refusal. Verify in Playwright with stubs: the button asks only on click, the stub's tracks are stopped, labels appear after allowing, and refusal shows the message while sound keeps playing

## 4. Per-unit OUTPUT

- [x] 4.1 Add the OUTPUT `ParamSelect` below SOUNDFONT in `ChimeUnit`'s popover, with options from the channel count (pairs, then singles), `1–2` shown with an en dash, and a stored value beyond the count shown as a disabled `UNAVAILABLE` item; send it to the chime through `setParams`. Verify in Playwright: the popover has twelve rows in the spec's order; with 18 channels OUTPUT lists `1–2`…`17–18` then `1`…`18`; with 2 channels it lists `1–2`, `1`, `2`; a unit stored on `7–8` with 2 channels shows `7–8 UNAVAILABLE`
- [x] 4.2 Verify unit state rules in Playwright: COPY of a unit on `3–4` gives a copy on `3–4`; a reload keeps each unit's OUTPUT; RESET gives CHIME 1 on `1–2` and keeps the chosen device; opening a link or a saved composition gives every unit `1–2` and keeps the device; changing OUTPUT doesn't change the SHARE link or the stubbed `/api/graphql` save variables
- [x] 4.3 Verify MIDI is unaffected: with a stubbed MIDI port, changing a unit's OUTPUT sends no MIDI bytes and its later strikes go out on the same channel with the same velocities

## 5. Phones and tablets

- [x] 5.0 Hide AUDIO and each unit's OUTPUT row on touch-only devices with a `touch` custom variant (`(any-hover: none) and (any-pointer: coarse)`, so a touchscreen laptop keeps them) in `app/globals.css`; the row there is SHARE, RESET, MIDI at 76 px. Verify in Playwright with `isMobile`/`hasTouch` (iPhone emulation): no AUDIO button by role, the popover has eleven rows with no OUTPUT, the three buttons are 8 px apart and 76 px wide, no hydration errors; and a 375 px desktop context still shows AUDIO and OUTPUT (Playwright's `hasTouch` emulates a touch-only device, so the touchscreen-laptop case is checked by hand in 6.1)

## 6. Wrap-up

- [ ] 6.1 Check by hand on a class-compliant multichannel interface in Chrome on macOS: device choice, separate outputs per unit, unplug and replug, and that stereo through the built-in output sounds as before. On a touchscreen laptop, check AUDIO and OUTPUT are shown and work by touch; on a phone, check they are hidden. Note what Safari and Firefox show for DEVICE and CHANNELS
- [x] 6.2 Update `CLAUDE.md`: the audio chain (own context, per-pair buses, router), the AUDIO button and row positions, the AUDIO OUT dialog, `output` in the unit record (local only, never in links or saves), `windchime.audioOut`, the permission rule for device names, and the browser support findings from 6.1
