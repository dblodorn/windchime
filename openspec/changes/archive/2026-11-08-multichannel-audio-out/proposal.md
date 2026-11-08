# Proposal

## Why

Every unit plays through one stereo stage into the browser's default output, so a multichannel interface (an SSL ALPHA 8, or any other USB class-compliant interface) only ever gets channels 1–2. Choosing the device in the page, and sending each chime unit to its own outputs, lets a composition go to separate channels of a mixer, a recorder or speakers placed around a room.

## What Changes

- An AUDIO button in the lower-right row, immediately left of MIDI (the row becomes SHARE, RESET, AUDIO, MIDI, 8 px apart, all `h-11 w-[76px]`), labelled with the text `AUDIO`. It opens an AUDIO OUT dialog built like MIDI OUT.
- In that dialog, a choice of output device, listing the browser's audio output devices (the system default first). It works with any device the operating system exposes: no SSL-specific code, drivers or control protocol. The choice is remembered in this browser only.
- A per-unit OUTPUT row in the SETTINGS popover: a stereo pair (1–2, 3–4, …) or a single channel (1, 2, …), offered up to the chosen device's channel count. The default is 1–2, so nothing changes for stereo users.
- The audio output stage keeps channels separate instead of folding everything to stereo: each unit's sound reaches only its chosen outputs, and the shared compressor and master gain no longer downmix.
- When a unit's OUTPUT is beyond what the current device offers (a smaller device chosen, the interface unplugged), that unit plays on 1–2 instead of going silent, and gets its OUTPUT back when a device with enough channels returns.
- Browsers that can't choose a device (no `AudioContext.setSinkId`) play through the system default device; OUTPUT still works there when the default device has more than two channels. Browsers that only offer stereo show OUTPUT with the stereo choices only.
- OUTPUT and the AUDIO OUT device are kept in browser storage with the rest of the unit's local settings, and are **never** carried by share links or saved compositions: they describe one person's hardware, not the composition. Units opened from a link or a saved composition, and units made by RESET, start on 1–2.
- No change to the share link format, its length, `toSaved`/`fromSaved`, or the dmbk-graphql-api catalog or schema.

## Capabilities

### New Capabilities
- `audio-output`: the AUDIO button and AUDIO OUT dialog, choosing the audio output device, the per-unit OUTPUT setting, how units' sound is routed to device channels, and the fallbacks for missing devices and browsers without device selection or multichannel output.

### Modified Capabilities
- `chime-units`: COPY carries OUTPUT to the new unit; units saved across visits include OUTPUT; RESET puts the new unit on 1–2 and moves one place left, between SHARE and AUDIO.
- `ui-controls`: the parameter popover gains an OUTPUT row (twelve rows).
- `share-links`: SHARE moves one place left (left of RESET, which is left of AUDIO); a link MUST NOT carry OUTPUT or the audio device; units opened from a link start on 1–2.
- `saved-compositions`: a save MUST NOT carry OUTPUT or the audio device; a loaded composition's units start on 1–2.

## Impact

- `lib/engine.js` (Audio section): `setupOutput` and `buildGraph` build a multichannel destination (discrete channels, a channel merger) and route each chime's filter to its outputs; device choice through `setSinkId`; reading the device's channel count; reacting to `devicechange`.
- `components/Chime.jsx`: the AUDIO button (`right` 16 + 84 px; RESET moves to 16 + 168 and SHARE to 16 + 252), the AUDIO OUT dialog and its state, the OUTPUT `ParamSelect` per unit, storage of the device choice (`windchime.*`) and of OUTPUT in `windchime.units`.
- `lib/share.js`: `UnitSchema` gains an `output` field that `.catch`es to 1–2; `pack`/`toSaved` leave it out and `unpack`/`fromSaved` fill in the default. The link's version 1 bytes are unchanged.
- Browser support: device choice is Chromium-only (Chrome, Edge); Safari and Firefox use the system default device, and their multichannel support needs checking. Device labels may need a media permission in some browsers; that has to be asked from a tap, never on load.
- Hardware checks only a person can do: real multichannel output on an interface, iOS, Windows with a class-compliant device versus an ASIO-only one.
