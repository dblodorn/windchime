# Design

## Context

- The app is one client page, `app/page.jsx` → `components/Chime.jsx`.
- `app/layout.jsx` sets the font, and `globals.css` pads `html` (16 px at the sides, 76 px at the bottom for the old fixed button row). A second route inherits both.
- The COMPOSITIONS panel is `SheetContent` (`components/ui/sheet.jsx`), a fixed `flex flex-col gap-3.5 overflow-y-auto` column:
  - `SheetHeader` comes first.
  - `<Compositions>` (loaded with `next/dynamic`) follows, rendering SAVE, the list and MORE as siblings.
  - Today the whole panel scrolls, heading included.

## Goals / Non-Goals

**Goals:**
- A static, prerendered `/changelog` page with no client JavaScript of its own.
- Adding an entry is a one-line edit to one file.
- A pinned footer in the panel. Only the middle area scrolls.

**Non-Goals:**
- No RSS, version numbers, PR links or per-entry pages.
- No "new since your last visit" badge.
- No generating entries from git.

## Decisions

- **Entries in `lib/changelog.js`.** It exports `CHANGELOG`, an array of `{ date: "YYYY-MM-DD", type: "FEATURE" | "FIX" | "ENHANCEMENT", text }`, written newest first, so a new entry goes at the top. The page renders it in file order and doesn't sort, which keeps same-day entries in the order they were written. A dev-only check isn't worth it for one file.
  - Rejected: Markdown or MDX, which would need a parser or a new dependency.
  - Rejected: git or PR scraping, which can't write player-facing remarks.
- **`app/changelog/page.jsx` is a server component** that exports `metadata` with the title `Changelog · Chime`. It is a plain `<main>` with:
  - a header row: `CHANGELOG` on the left, a `CHIME` link on the right, styled like a text button;
  - then a `<ul>` of entries.
- **Entry layout.** Each `<li>` is a grid:
  - the `<time>` date in 10 px tracking-wide type and the type label in the same style, on one line;
  - the 13 px remark under them.
  - Entries are separated by 1px top rules, which matches the 1-bit look of the composition rows without making them look clickable.
  - The page is at most about 560 px wide and left-aligned.
  - The inherited `html` padding gives the 16 px gutters. The remark wraps with `overflow-wrap:anywhere` for 320 px.
- **Back link.** Use Next's `<Link href="/">`. It is a client navigation: Chime remounts and reads `windchime.units`, so the composition comes back, muted as on any load.
- **Footer link.** The CHANGELOG link is a `<Link href="/changelog">` in the same tab.
  - Leaving the player stops its sound, but nothing is lost, since units are saved locally within 250 ms of every change.
  - Rejected: a new tab, which breaks the one-ink, no-chrome feel and is harder to come back from on phones.
  - Rejected: a sound-stopping confirm, which is more friction than the change deserves.
- **Panel layout.** In `Chime.jsx`, pass `className="overflow-hidden"` to `SheetContent`, so the panel itself no longer scrolls. `sheet.jsx` stays generic. The children become:
  1. `SheetHeader`, unchanged;
  2. a scroll area: `div.min-h-0.flex-1.overflow-y-auto.grid.content-start.gap-3.5` holding `<Compositions>`;
  3. `<footer className="border-t border-foreground pt-3 …">` holding the link.
  - Because the scroll area is `flex-1`, the footer stays at the bottom even when the list is short.
  - The sheet's existing bottom padding already covers the safe-area inset.
  - The scroll area gets `-mx-1 px-1 -mt-1 pt-1 pb-1`, so the 3 px-offset dashed focus outlines of SAVE, the rows and MORE aren't clipped. The 3 px offset plus the 1 px outline needs 4 px, which is the `p-1`.
  - `Compositions` returns siblings inside its provider, so it is wrapped rather than changed.
- **Link style.** Both links look like a text button: a bordered `h-8 px-2.5` box that inverts on hover.
  - The panel's CHANGELOG link uses `Button asChild` around the `Link`.
  - The page's CHIME link writes out the button classes instead. Importing `components/ui/button` pulled radix-ui into `/changelog`'s client JS: 40.7 kB, against 164 B without it.

## Risks / Trade-offs

- [Same-tab navigation stops the sound] → Units restore from local storage. The spec only promises the saved units come back, muted.
- [The changelog drifts from what ships] → CLAUDE.md and AGENTS.md get a standing rule: any change that ships a feature, fix or enhancement adds its entry in the same change. The `changelog` spec states the same rule.
- [The 76 px bottom padding on `html`, meant for the old fixed row, applies to `/changelog`] → It's harmless extra air at the end of the list.
- [Remarks in the backfill are judgment calls] → They're written from each PR's own summary. The user reviews the list in the PR.

## Migration Plan

Additive. Push to main to deploy. Rolling back is a revert. There's no data or link format involved.
