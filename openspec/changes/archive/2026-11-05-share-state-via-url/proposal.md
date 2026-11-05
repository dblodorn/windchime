# Proposal

## Why

A composition (the units on the page and their settings) lives only in one browser's localStorage, so the only way to show someone a setup is to describe it. A link that carries the whole composition lets anyone open the same chimes in one tap. Measured worst case, 16 units with every field at its longest, packs into about 400 URL characters, so a link fits everywhere links go.

## What Changes

- A SHARE button, fixed to the lower right just left of the MIDI button, the same size (44 px tall, same width) and style, labelled with the text `SHARE` (no icon). Activating it copies a link to the current composition to the clipboard (or opens the system share sheet where the clipboard is unavailable) and briefly confirms with the label `COPIED`.
- The link is the page URL with the composition in the `#` fragment, in a compact, versioned encoding: per unit VOLUME, TUBES, WIND, DECAY, FREQUENCY, RESONANCE, ROOT, SCALE, SOUNDFONT, CHANNEL, MIDI MODE, NOTES, position and stacking order, quantized to the sliders' own steps so nothing is lost.
- Opening a link replaces the saved composition: the linked units load instead of the stored ones and are saved over them. The fragment is then removed from the address bar so a reload keeps later edits rather than reopening the link.
- Linked data is checked like stored data (clamped, unknown values fall back to defaults, at most 16 units). A link that can't be read is ignored and the saved composition loads as usual.
- Not carried: SOUND (units always open muted; audio starts only from a tap) and the MIDI port and SEND options (they belong to the receiver's machine). Positions are carried and pulled back inside the receiver's viewport, as for stored units.

## Capabilities

### New Capabilities
- `share-links`: the SHARE button, what a link carries, the encoding and its version, and how an opened link is read, validated and applied.

### Modified Capabilities
- `chime-units`: "Units saved across visits" gains the exception that a share link in the URL replaces the saved units on load.

## Impact

- `components/Chime.jsx`: SHARE button next to MIDI; encode on click; decode in the mount effect that reads `windchime.units`, before falling back to storage; clear the fragment with `history.replaceState`.
- New `lib/share.js` (encode/decode, no DOM at module top level, importable in Node for checks), with zod schemas that validate a unit before it is encoded and after it is decoded. The same unit schema replaces the hand-written field checks in `readUnit`, so stored and linked data follow one definition.
- The encoding depends on the order of `SCALE_LIST` and the GM font's preset indices; changing either later needs a new encoding version so old links keep their meaning.
- New dependency: `zod` 4 (lockfile updated). No server change: the fragment is never sent to the server, so prerendering and Vercel's URL limits are unaffected.
- CLAUDE.md: document SHARE, the link format and its versioning rule.
