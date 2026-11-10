# Tasks

## 1. Entries

- [x] 1.1 Create `lib/changelog.js` exporting `CHANGELOG` (`{ date, type, text }`, newest first) and backfill it. Use the first release and live MIDI (2026-10-31), then PRs #1–#29 by merge date. Skip the `archive-*` PRs (#10, #13, #15) and #23 (AGENTS.md). Split a PR into several entries where it shipped several distinct things. Add an entry for this changelog itself. Each remark is one short line. Verify: Node imports the file, every `type` is FEATURE, FIX or ENHANCEMENT, every `date` matches `YYYY-MM-DD`, and the dates never increase down the list.

## 2. Page

- [x] 2.1 Add `app/changelog/page.jsx`: a server component with `metadata.title = "Changelog · Chime"`, the CHANGELOG heading, a CHIME `Link` to `/` styled as a text button, and a `<ul>` of entries (each with a `<time dateTime>` date, a type label and the remark) in the 1-bit style. Verify: `pnpm build` lists `/changelog` as static (○), and the page HTML holds every entry.
- [x] 2.2 Check layout in Playwright at 320, 375 and 1280 px. Verify: there is no horizontal scroll, the first entry is the newest, keyboard focus on CHIME shows the dashed outline, and CHIME returns to `/` with the stored units.

## 3. Panel footer

- [x] 3.1 In `components/Chime.jsx`, make `SheetContent` `overflow-hidden`. Wrap `<Compositions>` in a `min-h-0 flex-1 overflow-y-auto` scroll area, with 4 px of padding offset by negative margins so focus outlines aren't clipped. Add a footer with a 1px top rule holding a CHANGELOG link to `/changelog`. Verify in Playwright, with the GraphQL route stubbed to 20+ rows:
  - the heading and footer stay fixed while the list scrolls;
  - with 2 rows, the footer sits at the bottom edge;
  - the focus outline of the first row and of SAVE isn't clipped;
  - CHANGELOG opens `/changelog`;
  - at 320 px nothing scrolls sideways.
- [x] 3.2 Re-run the existing COMPOSITIONS checks (open, save, load a row, MORE, Escape closes and focus returns to MENU). Verify: all pass.

## 4. Docs

- [x] 4.1 Update `CLAUDE.md`:
  - the layout list: `app/changelog/page.jsx`, `lib/changelog.js`;
  - the COMPOSITIONS panel note: the pinned footer and the scroll area;
  - a standing rule under Constraints: any change that ships a feature, fix or enhancement adds a one-line entry to the top of `lib/changelog.js` in the same change.

  Then `cp CLAUDE.md AGENTS.md`. Verify: `cmp CLAUDE.md AGENTS.md` prints nothing.
- [x] 4.2 Run `openspec validate changelog-page --strict`. Verify: it passes.
