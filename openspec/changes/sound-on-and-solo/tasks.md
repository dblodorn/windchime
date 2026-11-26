## 1. Design system

- [ ] 1.1 sound-design-system change `alert-color-and-tip` merged and published: `@dblodorn/sound-tokens` 0.2.0, `@dblodorn/sound-ui` 0.4.0
- [ ] 1.2 Pin both in `package.json`, `pnpm install`, `pnpm build` passes; screenshots at 390 and 1280 px match the ones from before the bump (no visible change from the bump alone)

## 2. Engine

- [x] 2.1 `lib/engine.ts`: `audioRunning()` and `onAudioState(fn)` (fires on context creation and `statechange`, returns its unsubscribe); still nothing touches browser globals at module top level

## 3. SOUND ON

- [x] 3.1 `Chime`: `audioOn` state (starts false, set from `onAudioState` in a mount effect)
- [x] 3.2 SOUND ON button (`Button variant="alert"`), fixed upper left, `h-11`, shown while `!audioOn`; the click runs `E.startAudio()` synchronously, then marks every unit `sound: true, soundQuiet: true`
- [x] 3.3 Move the notice into the same fixed column below the button

## 4. Solo

- [x] 4.1 `Chime`: `solo` state (`{ id, before }`), `soloUnit(id)` (startAudio in the click, keep the first `before`, set sounds, `front`, clear focus), `soloOff()` (restore from `before`, quietly)
- [x] 4.2 The effect that drops solo when unit ids or `sound` flags differ from what solo set (covers SOUND, SOUND ON, COPY, REMOVE, RESET, links, saved compositions)
- [x] 4.3 `faded`: channel focus first, else solo; pressing a faded unit ends channel focus only
- [x] 4.4 `ChimeUnit`: wrap SOUND in `ActionTip` (two or more units) named "SOLO CHIME n" with SOLO / SOLO OFF; the long press doesn't toggle SOUND

## 5. Docs and changelog

- [x] 5.1 `lib/changelog.ts`: FEATURE entries for SOUND ON and SOLO
- [x] 5.2 `CLAUDE.md`: SOUND ON and solo in the UI notes, the alert fill and solo fade under visual language, the new design-system parts in the stack

## 6. Verification

- [ ] 6.1 `pnpm typecheck` and `pnpm build`
- [x] 6.2 Playwright (scratch folder): every scenario in `sound-on-and-solo` and the SOUND ON fill scenario, including keyboard, touch long press (iPhone emulation), MIDI bytes unchanged under solo, reload and SHARE carrying no solo
- [x] 6.3 Screenshots at 390 and 1280 px: landing (SOUND ON), SOUND ON with the notice, a soloed unit with its tip open
- [ ] 6.4 Real Safari and iOS check by the user: SOUND ON starts sound, and SOLO via long press
