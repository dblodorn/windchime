# Design

## Context

See proposal.md for the motivation and `specs/midi-dialog/spec.md` for the required behavior.

The current state that shapes the approach:

- **`components/Chime.jsx`** holds all MIDI state and effects in the component body: `midiSupported`, `midi` (from `M.status()`), `midiPorts`, `midiCh`, the three option flags, `midiMsg`, `midiCount`, plus the program-change and CC effects keyed on `midi.linkSeq`. The MIDI OUT block is a `<div className="grid gap-3.5">` between two `<hr>`s in the parameter section. `midiLine` is rendered in the status block further down.
- **Components:** `components/ui/` has button, select, slider and checkbox, all restyled to the 1-bit theme. Select content renders in a Radix portal at `z-50`.
- **Packages:** the `radix-ui` package (1.8.x) already includes the Dialog primitive, and `lucide-react` is not installed.
- **Page padding** lives on `html` (`max(40px, env(safe-area-inset-bottom))` at the bottom). It's there because Radix's scroll lock rewrites body padding, and Dialog uses the same scroll lock as Select.
- **The logo:** `https://upload.wikimedia.org/wikipedia/commons/a/a0/MIDI_LOGO.svg` is 620 bytes. It is the MIDI Manufacturers Association's block-letter "MIDI" wordmark: two `<path>`s (M, D) and two `<rect>`s (I, I) with the default black fill, in a 1000×455 viewBox.
  - **Ink bounds:** x 137–849 and y 96–362, so 712×266, an aspect ratio of about 2.68:1.
  - **Rights:** Commons tags it PD-textlogo (below the threshold of originality, so there is no copyright) and "Trademarked".

## Goals / Non-Goals

**Goals:**
- Move the MIDI OUT block into a dialog without changing any MIDI behavior, state ownership or control markup.
- Keep one component vocabulary: the dialog is a shadcn component restyled exactly like the existing ones.
- Keep the change visual and structural only: `lib/midiout.js` and `lib/engine.js` are untouched.

**Non-Goals:**
- No new MIDI features (input, clock, per-tube channels).
- No restyle of the parameter sheet beyond removing the MIDI block and its trailing `<hr>`.
- No committed tests. The Playwright checks stay as scratch scripts, as in previous changes.

## Decisions

### 1. Dialog component: shadcn `dialog`, restyled
Add it with `pnpm dlx shadcn@4.23.0 add dialog`, then apply the project's standard strip:
- Remove `rounded-*`, `shadow-*`, `ring-*`, `dark:*` and lucide icons. If the CLI adds `lucide-react` back to `package.json`, remove it and run `pnpm install`.
- **Overlay:** `bg-transparent`, with no `backdrop-blur` and no opacity tint. It still covers the viewport, so it catches outside clicks (Radix's `onPointerDownOutside` closes the dialog). This satisfies "page behind stays black and white only".
- **Content:** `bg-background border border-foreground`, square, no shadow, centered. Width is `min(520px, 100vw − 32px)`, matching the sheet's `max-w-[520px]` and the 16 px page gutters. Height is `max-h-[calc(100dvh-32px)]` with `overflow-y-auto`, so tall contents scroll inside the dialog.
- **Title:** `DialogTitle` is "MIDI OUT", in the same weight and tracking as the `h1`, but at the param-label size.
- **Description:** `DialogDescription` holds the existing help line, "Send every strike to a MIDI device or another app." That gives Radix its `aria-describedby`, so it logs no warning. The duplicate `<span>` beside CONNECT MIDI is dropped.
- **No built-in close button:** the template's ✕ icon close button is removed (`showCloseButton` off, or deleted). CLOSE is a text `Button` in the header row, right-aligned on the title line (`MIDI OUT ......... CLOSE`), wrapped in `DialogClose asChild`.
- *Alternative: a hand-rolled `<dialog>` element.* Rejected. Native `showModal()` styling of `::backdrop`, focus return and scroll lock vary across Safari versions. Radix is already the project's base, and it handles nested Select layers.

### 2. State stays in `Chime`, only the markup moves
The MIDI JSX block moves unchanged into `<DialogContent>`. All `useState`/`useEffect` stay in `Chime`'s body, so they keep running while the dialog is closed. Radix unmounts closed content, and that's fine, because the content holds no state of its own.
- A new `const [midiOpen, setMidiOpen] = useState(false)` is passed to `<Dialog open onOpenChange>`. It is controlled, and starts `false` on both the server and the client, so hydration matches.
- `Param` ids (`m-out`, `m-ch`) keep working: they're unique and exist only while the dialog is open.
- *Alternative: `forceMount` with hidden content.* Rejected. It keeps hidden controls in the DOM for no gain, and complicates the "controls not on the sheet" check.

### 3. The MIDI button
- **Markup:** `<DialogTrigger asChild><Button …><MidiLogo /></Button></DialogTrigger>`.
  - The trigger gives `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`.
  - `aria-label="MIDI"` gives the accessible name.
  - The existing `Button` gives the border, the hover invert and the dashed focus outline.
- **Logo:** a small `MidiLogo` component inlines the Commons SVG with its viewBox cropped to the ink, `137 96 712 266`. It uses `fill="currentColor"` (so it inverts with the button's text color), `aria-hidden` and `focusable="false"`. A comment gives the source URL and its status (PD-textlogo; MIDI is a trademark of the MIDI Manufacturers Association).
- **Size:** the button is `h-11` (44 px), with padding so the logo is drawn about 48×18 px. That gives a box of about 66×44, above the 44×44 minimum, and the wordmark is still readable.
- **Position:** `fixed z-40`, with `right: calc(16px + env(safe-area-inset-right, 0px))` and `bottom: calc(16px + env(safe-area-inset-bottom, 0px))`. `z-40` keeps it under the dialog overlay and select popups (`z-50`).
- **Live state:** `data-live={midiLive || undefined}`, where `midiLive = !!(midi.port && midi.port.state === "connected")`. A `data-[live]:bg-foreground data-[live]:text-background` rule inverts it, and hover keeps working. Since `midi` comes from `M.status()` on every `statechange`, unplugging and replugging update it with no new code.
- **Placement in the tree:** the button sits inside the same `<Dialog>` as the content. The fixed position makes its DOM location irrelevant to layout. Placing it right after the main grid puts it last in tab order, after SAVE MIDI.
- *Alternative: `aria-pressed` for the live state.* Rejected. The button opens a dialog and doesn't toggle anything, so `aria-pressed` would misstate it. The live state is visual only, and the status line already says it in text.

### 4. Never covering content
`html`'s bottom padding becomes `max(76px, calc(60px + 16px + env(safe-area-inset-bottom, 0px)))`, which is the 44 px button plus 16 px offset plus 16 px of air, plus the safe area. That holds at every width. The two-column desktop layout's right column ends in the status block and the note, and those end above the button once scrolled to the bottom.

### 5. Select inside the dialog
Select popups portal to `body` after the dialog's portal, at the same `z-50`, so DOM order puts them on top. Radix registers the Select as a nested dismissable layer: picking an option closes only the select, and Escape closes the select first and the dialog on a second press. While a modal dialog is open, Radix gives body `pointer-events: none`, but the select content sets its own `pointer-events: auto`. This is checked in the browser (task) rather than assumed.

### 6. Page structure after the move
- The parameter section loses the MIDI `grid` block and the `<hr>` after it, so the sheet reads WIND … SOUNDFONT, a rule, then the transport buttons.
- The status block keeps `audioLine`, `midiLine` and `takeLine`, and the footer note about the `.mid` format stays. That note describes file export, not MIDI OUT.

### 7. Verification
- **Scratch updates:** `midi-check.mjs` (50 checks) and `ui-check.mjs` (77 checks) gain an `openMidi(page)` helper that clicks the button named "MIDI" before driving MIDI controls. Their assertions don't change.
- **New scratch `midi-dialog-check.mjs`:** Playwright at 1280 and 375 px, covering every scenario in the spec:
  - position and size measured from `getBoundingClientRect` against the viewport;
  - two colors from computed styles with the dialog open;
  - no `requestMIDIAccess` call on open, counted in the stub;
  - focus trap and focus return via `document.activeElement`;
  - Escape, CLOSE and outside click;
  - CHANNEL select inside the dialog;
  - a tube tap with the dialog closed, sending a note-on;
  - live inversion via the stub's `statechange` (disconnect and reconnect);
  - no overlap at scroll end, comparing every text/control box with the button box;
  - the server HTML from `curl`, and no hydration warnings in the console.
- **Production build:** `pnpm build`. Then compare the First Load JS increase (Dialog shares Radix internals with Select, so a small increase is expected) and report it.

## Risks / Trade-offs

- **[A transparent overlay gives no sign that the page is inert]** → Accepted, as the two-color rule requires. The dialog's border and centered position carry the modality. A dithered 1-bit overlay would be the fallback if it reads poorly, and it would need the user's approval.
- **[Wordmark at about 18 px tall on a 1× screen]** → It is pure black rectangles, so it stays crisp. If it's hard to read, the button can grow to `h-12` without other changes.
- **[Two-step Escape when a select is open inside the dialog]** → That's standard nested-layer behavior and matches Radix defaults. It's left as is.
- **[Trademark]** → The wordmark marks MIDI compatibility, which is the normal nominative use. It isn't altered beyond cropping the viewBox and recoloring it to `currentColor` (black). If the MIDI Association's logo-use terms are later found to forbid that, the button falls back to the text "MIDI".
- **[MIDI controls hidden from first-time visitors]** → The fixed button is visible on every screen and the status line names MIDI. This is the intent of the proposal.

## Migration Plan

- Work on branch `midi-dialog` and check the Vercel preview on a phone and on desktop before merging. Merging deploys to https://chime.dmbk.io.
- Saved settings (`windchime.*` in `localStorage`) are unchanged, so returning visitors keep their port and channel.
- Rollback is reverting the merge commit.
