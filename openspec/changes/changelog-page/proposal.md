# Proposal

## Why

Chime has changed in 29 merged PRs, but there's nowhere to see what's new: visitors find features by accident, and returning players can't tell what changed. A short public changelog, kept up as work lands, fixes that.

## What Changes

- A new page at `/changelog`: a list of entries, newest first. Each has a date, a type (FEATURE, FIX or ENHANCEMENT) and one short line. It uses the same visual rules as the player (black on white, Knif Mono, square), and it has a link back to the player.
- The entries live in one data file. A new entry is a one-line addition.
- The page is backfilled from the merged PRs #1–#29. The `archive-*` PRs are left out, since they only move OpenSpec files. Docs-only and tooling-only work (AGENTS.md, Codex skills) is left out too.
- The COMPOSITIONS panel (MENU) gets a small footer pinned to its bottom edge, holding a CHANGELOG link. The saved-compositions list scrolls above the footer instead of the whole panel scrolling.
- From now on, any feature, bug fix or enhancement that ships gets an entry.

## Capabilities

### New Capabilities
- `changelog`: the `/changelog` page, its entries (date, type, remark), their order, the link back, and the rule that every shipped feature, fix or enhancement gets an entry.

### Modified Capabilities
- `saved-compositions`: the panel's layout gains a footer with a CHANGELOG link, pinned at the bottom. The list area scrolls above it instead of the whole panel scrolling.

## Impact

- New: `app/changelog/page.jsx` (a server component, prerendered static) and an entries file (e.g. `lib/changelog.js`).
- `components/Chime.jsx` (the `SheetContent` layout) and possibly `components/Compositions.jsx` (the scroll region).
- `components/ui/sheet.jsx`, if its content needs to become a flex column.
- CLAUDE.md / AGENTS.md: the layout list and a note that significant changes get a changelog entry.
- No API, storage or share-link changes. No new dependencies.
