## Context

Every unit loads muted (SOUND is never stored), and Safari and iOS only start audio inside a tap: `E.startAudio()` must run synchronously in the click, after `preloadAudio()` has loaded Tone on mount. Opening a saved composition already does what SOUND ON needs: start audio in the click, then mark the units `sound: true, soundQuiet: true` once it's running. Channel focus already fades units to a 25% tint through `faded`.

The two-color rule applies to the whole page. Its exceptions are named fills: channel inks and changelog badges. A bright alert red is a new kind of exception, so it goes into the design system first (`@dblodorn/sound-tokens` `alert`, `@dblodorn/sound-ui` `Button variant="alert"`), not into this repo.

## Goals / Non-Goals

**Goals:**
- One obvious control that starts sound for every unit, shown only while audio is off.
- Solo one unit from its SOUND button and undo it exactly.
- Both work by keyboard and touch as well as by mouse.

**Non-Goals:**
- MIDI solo or mute. SOUND has never affected MIDI, and solo doesn't either.
- Storing solo, or putting it in links and saves.
- Soloing more than one unit at a time.

## Decisions

### When "audio is off"
The engine exposes `audioRunning()`: true while the native context exists and its `state` is `"running"`. It also exposes `onAudioState(fn)`, which fires on the context's `statechange` and when `startAudio` first creates the context, and returns its unsubscribe. `Chime` holds `audioOn` in state, starting `false` (the server and every page load start with audio off, so SSR and hydration agree). The button shows while `!audioOn`. That covers the first visit, an address, and a context the browser later suspends or interrupts (iOS calls, other tabs). It doesn't depend on whether any unit is on: once audio runs, muting every unit by hand leaves the button hidden.

*Alternative considered:* show the button while every unit is muted. Rejected: after the user deliberately mutes everything, a red alert asking to turn sound on is noise, and it isn't what was asked for ("if the audio context is off").

### What SOUND ON does
It runs the same path as `openSaved`: `E.startAudio()` in the click, then, once audio is running, every unit gets `sound: true, soundQuiet: true`. Quiet, so 16 units don't play 16 arpeggios at once; the wind starts striking within a second or two anyway. It also ends solo (it changes every unit's SOUND).

### Placement
The button is fixed upper left (`top`/`left` 16 px + safe area, `z-40`), `h-11` like the button row, text `SOUND ON`. The `role=status` notice moves into the same fixed column below it (`flex-col gap-2`), so the two never overlap. MENU stays upper right. At 320 px both fit: the notice already caps itself at `100vw − 108px`.

### The tip: `ActionTip` from the design system
The SOLO control is a real button, so a Radix Tooltip (`role=tooltip`, not meant to hold interactive content) is wrong. `ActionTip` (in the design-system change) is a small non-modal popover anchored to a trigger:
- It opens after a short hover on the trigger, on keyboard focus of the trigger, and on a 500 ms long press on touch.
- It stays open while the pointer is on the trigger or the tip, and closes on leave (after a short delay), Escape, or an outside press.
- Tab from the trigger moves into the tip.
- A long press suppresses the click that would follow it, so it doesn't also toggle SOUND.
- It carries the unit's ink scope into its portal (`useInkProps`), as every popup that leaves a unit must.
- It is named after its content ("SOLO CHIME 3") with `role=dialog`, like the settings popover.

`ChimeUnit` wraps its SOUND `RoundIconButton` in an `ActionTip` whose content is one `Button`: `SOLO`, or `SOLO OFF` on the soloed unit. The tip shows only while the page has two or more units, since solo means nothing with one.

### Solo state
`Chime` holds `solo: { id: string; before: Record<string, boolean> } | null`. It is never stored.
- **SOLO on unit A:** run `E.startAudio()` in the click (A may be muted and audio not yet started). Keep `before`: every unit's `sound`, or the earlier `before` when switching solo from another unit, so SOLO OFF always returns to the state before the first SOLO. Set A `sound: true, soundQuiet: true` and every other unit `sound: false`, `front(A)`, and clear channel focus.
- **SOLO OFF:** set each unit's `sound` from `before` (`soundQuiet: true` for units turning on), then `solo = null`.
- **Solo ends without restoring** when anything else changes SOUND or the set of units: a unit's SOUND button, SOUND ON, COPY, REMOVE, RESET, a link or a saved composition opening. A single check covers all of them: an effect compares the unit ids and `sound` flags with what solo produced and drops solo on any difference. So no call site needs its own code, the same pattern as the stale channel focus effect.

### The fade
`faded` for a unit becomes: channel focus active ? not on the focused channel : solo active and not the soloed unit. Soloing clears channel focus. Activating a channel square while soloed switches to channel focus and leaves the mute alone. Pressing a faded unit ends channel focus (unchanged) but not solo: the faded units are muted, and the fade is how solo shows which unit is soloed. SOLO OFF or any manual SOUND change ends it.

## Risks / Trade-offs

- **Spectrum Red (#f20000) with white 11 px text is 4.4:1,** just under WCAG AA's 4.5:1 for small text. It meets 3:1 for a control's fill. Sanzo Wada's Red Orange (#e81900, 4.59:1) passes and is the fallback if AA matters more than the brightest red. This is decided in the design-system change.
- **Long press on touch is hard to discover.** It's the only gesture that doesn't change SOUND's tap. Solo is a secondary feature, so this is acceptable for now.
- **Solo ending on any manual SOUND change** means toggling one muted unit on while soloed ends solo and leaves the others muted. That's predictable ("solo is over"), and SOLO OFF stays the way to undo it exactly.

## Migration Plan

Publish `@dblodorn/sound-tokens` 0.2.0 and `@dblodorn/sound-ui` 0.4.0 from the sound-design-system change, merged first. Then pin them here, in the same PR as the feature. No data migration.

## Open Questions

- Alert red: Spectrum Red (asked for, 4.4:1) or Red Orange (4.59:1). This proposal uses Spectrum Red.
