# Design

## Context

See proposal.md for why. Today `setupOutput()` in `lib/engine.js` builds one `Tone.Compressor` → `Tone.Gain(0.85)` → `Tone.getDestination()`, and every chime's `buildGraph` connects its `Tone.Filter` to that compressor (`master`). The context is Tone's own (`Tone.getContext().rawContext`), created when Tone loads and resumed inside the first SOUND tap by `startAudio()`. The destination keeps its default 2 channels with speaker upmixing, so everything goes out on 1–2 of the system default device.

Constraints that shape the approach:
- Audio must start inside a tap (Safari/iOS). Nothing here may move context creation or `resume()` out of the gesture path.
- `lib/engine.js` must not touch `navigator`/`window` at module top level; browser capabilities are read in mount effects, never during render (SSR).
- The share link's version 1 bytes, `toSaved`/`fromSaved` and the API catalog must not change (proposal: audio settings stay local).
- Web Audio limits: `DynamicsCompressorNode.channelCount` cannot exceed 2; `createChannelMerger` takes at most 32 inputs in Chromium; `destination.maxChannelCount` is only meaningful once a context exists and changes when the sink changes; `AudioContext.setSinkId` and the `sinkchange` event exist in Chromium only.
- Output device labels from `enumerateDevices()` are empty until the origin has a media permission (Chromium, Safari); Firefox has `selectAudioOutput()` instead.

## Goals / Non-Goals

**Goals:**
- One generic path for any output device the OS exposes; nothing keyed to a vendor or model.
- Plain stereo (one unit or many on `1–2`, 2-channel device) sounds identical to today.
- Routing changes (OUTPUT, device, channel count) apply live without rebuilding a chime's voices or cutting notes.

**Non-Goals:**
- Stereo spread of tubes, panning, or per-output level controls (each unit's VOLUME is still its level).
- Audio input, CV/gate output (a separate later change), or controlling an interface's internal mixer.
- More than 32 output channels; devices with more are treated as 32.
- Windows ASIO-only devices: the browser only sees what the OS audio stack (WASAPI/Core Audio) exposes.

## Decisions

### 1. Own the AudioContext, hand it to Tone
`startAudio()` creates a native `AudioContext` itself (inside the tap, synchronously, with `{ latencyHint: "interactive", sinkId }` where the browser accepts a `sinkId` option) and gives it to Tone with `Tone.setContext(new Tone.Context(ctx))` before any Tone node is made. `preloadAudio()` keeps only importing Tone.
- Why: `setSinkId` lives on the native context; Tone's default context is a standardized-audio-context wrapper whose support for `setSinkId` we can't rely on. Owning the context also lets us pass the remembered device at creation, so the first sound already comes out of the interface.
- Found while implementing: Chrome breaks a context constructed with an id it doesn't know ("encountered an error from the audio device") instead of throwing. So the constructor gets `sinkId` only when the UI says the device is in the current list (`setAudioDevice(id, { listed })`); otherwise the context opens on the default and `setSinkId` follows at once, which rejects cleanly.
- Alternative: keep Tone's context and call `setSinkId` on `rawContext` and hope it proxies. Rejected as fragile across Tone versions. If `setContext` turns out to break Tone nodes made earlier, nothing is made earlier: `setupOutput` runs right after it.

### 2. Output stage: one stereo bus per channel pair, merged into a discrete destination
```
chime filter ──► router ──► bus k (k = pair index):  DynamicsCompressor(2ch) → Gain 0.85 → ChannelSplitter(2)
                                                                                        │   │
                                                                     ChannelMerger(N) inputs 2k, 2k+1 ──► destination (N ch, explicit, discrete)
```
- `destination.channelCount = N` (`maxChannelCount`, capped at 32), `channelCountMode = "explicit"`, `channelInterpretation = "discrete"`, so no upmix or downmix happens at the end.
- Buses are made lazily, only for pairs some unit actually uses, so a 32-channel device with all units on `1–2` costs one compressor, as today. An odd last channel gets a bus whose right side is unused.
- The compressor parameters are the current ones (threshold −16, ratio 4, attack 3 ms, release 250 ms). With N = 2 and one bus, the chain is today's chain plus a splitter/merger that pass audio unchanged.
- Why per pair: compressors are limited to 2 channels, and a shared detector across all channels would duck channel 1 when channel 7 hits, which the spec forbids ("no bleed" is also about gain). Linking within a pair keeps today's stereo image behavior.
- Alternative: one compressor per channel. Rejected: it would unlink L/R on `1–2` and change today's stereo sound.
- Alternative: no compression on multichannel. Rejected: the stereo path must sound identical, and a level jump when switching devices is worse.

### 3. Per-chime router
`buildGraph` connects the filter to a small per-chime router instead of `master`:
- pair `a–b` → filter connects straight to bus k.
- single channel c → filter → a `GainNode` with `channelCount 1`, `"explicit"`, `"speakers"` (stereo folded to mono) → a `ChannelMerger(2)` input 0 or 1 → bus for c's pair.
Changing OUTPUT, or the effective output changing because the device changed, calls `ch.setOutput(effective)`, which disconnects the router's last hop and reconnects it. Voices, input gain and filter are untouched, so ringing notes continue (they may jump channels, which is expected).
- The engine takes the output as `{ first, count }` (0-based first channel, 1 or 2) through `setParams({ output })`, so `P` keeps everything a chime needs. Effective output (fallback to `1–2` when `first + count > N`) is computed in the engine, since only it knows N after a sink change, and exposed with `outputAvailable()` for the UI's UNAVAILABLE mark.

### 4. Device choice and channel count
- Engine API: `audioOutSupported()` (`"setSinkId" in AudioContext.prototype`), `setAudioDevice(id)` (stores the id; if the context exists, `await actx.setSinkId(id)`), `outputChannels()` (N), and `onOutputChange(fn)` (fires after a sink change or a `sinkchange` event, returns unsubscribe; strict mode).
- After every sink change the engine re-reads `maxChannelCount`, resets the destination and merger to the new N (rebuilding the merger and reconnecting existing buses), recomputes every chime's effective output, and notifies.
- `Chime.jsx` keeps the device list (`enumerateDevices()` filtered to `audiooutput`, re-read on `devicechange`), the chosen `{ id, label }` and the last known channel count per device, in `localStorage` as `windchime.audioOut` = `{ v: 1, id, label, channels }`. A remembered device is matched by id first, then by label (ids reset when site data is cleared), like the MIDI port by name.
- Before the context exists, CHANNELS and the OUTPUT options use the stored `channels` (else 2), as the spec says; the real count replaces it on the first SOUND tap.
- When the chosen device leaves the list, `Chime` calls `setAudioDevice("")` (system default) but keeps `wanted`; when an entry matching `wanted` returns, it calls `setAudioDevice(id)` again. This mirrors `midiout.js`'s `wanted`/`adopt()` pattern. The DISCONNECTED option is a disabled `SelectItem` holding the remembered label.

### 5. Device names permission
SHOW DEVICE NAMES (shown when every `audiooutput` entry has an empty label) calls `getUserMedia({ audio: true })` from its click, stops every track at once, and re-enumerates. In Firefox, where `selectAudioOutput()` exists, the button calls that instead (it opens the browser's own device picker and both grants and chooses). Refusal shows `DEVICE NAMES NOT AVAILABLE`. Never on load or on dialog open.
- Alternative: always ask on dialog open. Rejected: the spec (and the project's MIDI rule) asks permission only from an explicit control.

### 6. Unit record: `output` is local only
- `Sh.UnitSchema` gains `output: z.string().regex(/^\d{1,2}(-\d{1,2})?$/)…` with `.catch("1-2")` and a refine that a pair is `2k+1–2k+2`. Stored as `"1-2"`, `"5"`; shown with an en dash (`1–2`).
- `pack`/`toSaved` don't read it; `unpack`/`fromSaved` don't write it, so `CompositionSchema`'s catch fills `"1-2"` for every linked or loaded unit. No version bump, no reserved byte used, links byte-identical (share-links spec: "OUTPUT does not change the link").
- `windchime.units` stores it, because the save effect writes the whole record minus `sound`. `defaultUnit` gets it from `Sh.DEFAULTS`, so RESET and first visits are `1–2`. COPY clones the record, so it inherits.
- Why not a reserved byte: the user's call — routing describes one person's hardware, and a sender's `17–18` would only ever fall back on a receiver's laptop.

### 7. UI
- AUDIO button: same component and classes as SHARE/RESET (`h-11 w-[76px]`, text, `fixed`, safe-area aware) at `right: 16 + 84`; RESET moves to `16 + 168`, SHARE to `16 + 252`. No `data-live` state for now (the spec doesn't ask for it).
- AUDIO OUT dialog: a controlled `Dialog` (`audioOpen`) next to MIDI OUT, reusing its layout, `Param` rows and CLOSE button. DEVICE is a `ParamSelect` (Radix needs non-empty values: system default is the `"default"` sentinel).
- OUTPUT row: a `ParamSelect` in `ChimeUnit`'s popover below SOUNDFONT, options built from the channel count (pairs then singles). A stored value beyond N is shown as a disabled item with `UNAVAILABLE` so `SelectValue` still displays it.
- Capability detection (`audioOutSupported`, `selectAudioOutput` presence) is held in state that starts `null` and is set in a mount effect (SSR rule).

## Risks / Trade-offs

- [Safari and Firefox may cap `maxChannelCount` at 2, or not honor the system device's channels] → spec already degrades to stereo options; verify on real hardware and record findings in CLAUDE.md.
- [`Tone.setContext` with our own context could misbehave with nodes Tone creates internally at import] → only `startAudio` creates nodes, after `setContext`; check FM, Filter and the sampler paths in Playwright with a stub, and by ear.
- [`setSinkId` to a device whose rate differs from the context's causes resampling or a brief dropout] → acceptable; a dropout during a device switch is expected. Don't recreate the context on switch.
- [Changing N rebuilds the merger, a short click on every channel] → only on device change, not on OUTPUT change.
- [Device ids and labels are fingerprinting-sensitive] → they stay in `localStorage`, are never sent anywhere, and the permission is only asked from SHOW DEVICE NAMES.
- [Headless Chromium has no multichannel device] → engine routing tested in Playwright by checking node connections and with an `OfflineAudioContext` of N channels rendering a strike per unit and measuring each channel's energy; real interface checked by a person.
- [Windows devices that are ASIO-only don't appear] → out of scope; class-compliant devices appear through WASAPI.

## Migration Plan

- No data migration: stored units without `output` load on `1–2` through the schema's catch; no stored device means system default.
- Links and saved compositions are untouched, so old and new clients interoperate both ways.
- Rollback: revert the commit. A newer `windchime.units` with `output` fields still loads in the old code (zod strips unknown keys); `windchime.audioOut` is ignored.

## Open Questions

- Whether Safari on macOS exposes more than 2 channels of a class-compliant device as the system output; it changes only what users of Safari see, not the design.
- Whether Firefox's `AudioContext.setSinkId` support has landed by implementation time; feature detection covers either answer.
