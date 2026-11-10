# Design

## Context

See proposal.md for the motivation and specs/ for the behavior. This section covers the parts of `components/Chime.jsx` the design builds on.

- `Chime` already derives `usedChannels` (a `Set` from `units`) for the MIDI OUT legend.
- Each `ChimeUnit` is a memoized `motion.section` whose style holds `{ x, y, zIndex, ...ink }`.
- The section's `onPointerDownCapture={() => onFront(id)}` brings the unit to the front on any press inside it. React synthetic events travel through portals along the React tree, so a press inside the unit's portaled SETTINGS popover or its select lists also reaches this handler.
- The lower-right button row is a fixed flex container, `right/bottom` 16 px plus the safe area, `z-40`, 44 px tall:
  - Desktop: 4 buttons of `min(76px, …)` with 8 px gaps, 328 px wide.
  - Touch devices: 3 buttons, 244 px wide.
- `lib/colors.js` exports `CHANNEL_INKS` (with `name` and `hex`) and `inkOf`.

## Goals / Non-Goals

**Goals:**
- One piece of state, the focused channel, owned by `Chime`.
- No changes to the engine, storage, links or MIDI.
- The strip renders nothing on the server: the server renders one unit, so there is no hydration mismatch.

**Non-Goals:**
- Keyboard-only exit from focus mode. Tabbing into a faded unit doesn't end focus; only a press does, as the spec says. Activating the pressed square again works from the keyboard.
- Fading the popovers of faded units. They portal out of the section, so opacity doesn't reach them. Opening one takes a press, which ends focus anyway.
- Any animation. The fade is instant, matching the drawer's no-tween choice.

## Decisions

**State: `const [focus, setFocus] = useState(null)` in `Chime`, a channel number or null.**
- Rendering uses the derived `focused = focus != null && usedChannels.size > 1 && usedChannels.has(focus) ? focus : null`, so a stale focus never shows for even one frame.
- An effect resets `focus` to null when `focused` is null and `focus` isn't, so a channel that comes back later doesn't re-focus by surprise.
- This covers REMOVE, a channel change, RESET, links and saved compositions with no code in each of those paths.
- Alternative considered: clearing focus inside `remove`, `change`, `replaceComposition` and the rest. Rejected because it is scattered and easy to miss in a future path.

**Faded units: `ChimeUnit` gets a boolean `faded` prop (`focused != null && u.channel !== focused`) and adds `opacity: faded ? 0.35 : 1` to the section's style.**
- A boolean keeps `memo` effective: only units whose fade changes re-render.
- The opacity goes on the section itself, so the drawing, round buttons and drawer fade together.
- The section already has `zIndex` inside an `isolate` parent, so the stacking context opacity creates changes nothing.

**Leaving focus: widen the existing capture handler instead of adding a listener.**
- `onFront(id)` stays as it is.
- `Chime` passes a second callback, or `front` itself checks: when a focus is set and the pressed unit's channel differs from it, `setFocus(null)`.
- I'll do this in a small `pressUnit(id)` wrapper in `Chime` that calls `front(id)` and clears focus when the unit is faded. It reads `focus` through a ref, so the callback stays stable and doesn't break `memo`.
- Because it runs in the capture phase and doesn't stop propagation, the strike, drag or button still happens on the same press.

**Strip markup:**
- A `div role="group" aria-label="ACTIVE CHANNELS"`, fixed `left/bottom` 16 px plus the safe area, `z-40`, `h-11`.
- Inside it, `grid grid-cols-[repeat(8,22px)] auto-rows-[22px] content-end`.
- Each square is a plain `<button>` (not the shadcn `Button`, whose border, hover inversion and padding don't fit), `size-[22px]`, with `background: ink.hex`, white text, `text-[10px] leading-none tabular-nums` and `grid place-items-center`.
- `aria-pressed` and `aria-label="<n> <NAME>"`.
- The dashed focus outline uses the existing utility. Its color is `outline-foreground` (black) with offset 3, so it stays visible against both the square and the page.
- Pressed state: an `aria-hidden` absolutely positioned span with `inset-[2px] border border-white`. This draws the inset frame without a box shadow, and without an outline, which the focus ring already uses.
- The 10px Knif Mono `16` is about 12 px wide, which fits in 22 px.

**Narrow placement:**
- Wide layout: 16 + 176 + 8 gap + 328 + 16 = 544 px on desktop, 460 px on touch. Both fit at Tailwind's `sm` breakpoint (640 px), which the units already use.
- Below `sm`, the strip moves up: `max-sm:bottom-[calc(16px+44px+8px+env(safe-area-inset-bottom,0px))]`.
- One breakpoint for both input types keeps it simple. The 460 to 640 px touch range stacks even though it would fit side by side. That's acceptable.
- Alternative considered: measuring the space with a ResizeObserver. Rejected as unnecessary, since CSS alone keeps SSR and the client in agreement.

**Order and visibility:** the squares are `[...usedChannels].sort((a, b) => a - b)`, and the strip renders only when there are 2 or more.

## Risks / Trade-offs

- [White 10px numbers on the lighter inks (Orange 3.25:1, Khaki 3.34:1) are below WCAG's 4.5:1 for small text.] → Each button's accessible name carries the number and ink name. If they read poorly on a real screen, the numbers can be made bold or 11px without a spec change.
- [The strip can cover part of a unit dragged into the lower-left corner.] → It sits at `z-40`, the same as the button row, which already covers units in the lower right. Units can be dragged away.
- [A user changing a focused unit's CHANNEL in its popover sees it fade if the focused channel is still in use elsewhere.] → That is the spec'd behavior: the unit is now on another channel. The press that opened the popover didn't clear focus because the unit was focused at the time.
- [The 35% fade multiplies the ink against what's behind it, so overlapping units show blended colors.] → The visual-language spec allows this exception.
