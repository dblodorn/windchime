# changelog Specification

## Purpose
A public page at `/changelog` that lists what has changed in Chime: every shipped feature, bug fix and enhancement, each in one short line, newest first.

## Requirements

### Requirement: Changelog page
The site SHALL serve a page at `/changelog`, titled "Changelog · Chime", with the heading CHANGELOG and a link named BACK that goes back to the player at `/`. It SHALL be readable without JavaScript, since it is the same HTML for every visitor. It SHALL follow the two-color, monospace, square visual rules of `ui-controls`: black on white (except the type badges), Knif Mono, no rounded corners, shadows or icons, and the dashed keyboard focus outline. It SHALL fit a 320 px viewport without scrolling sideways, and it SHALL scroll vertically when its content is taller than the viewport.

#### Scenario: Open the page
- **WHEN** a visitor opens `/changelog`
- **THEN** the page shows the heading CHANGELOG, the BACK link and the list of entries, in black Knif Mono on white

#### Scenario: Back to the player
- **WHEN** the visitor activates BACK
- **THEN** the player opens at `/` with the units saved in that browser

#### Scenario: Phone width
- **WHEN** the viewport is 320 px wide
- **THEN** every entry wraps inside the viewport and the page does not scroll sideways

### Requirement: Changelog entries
Each entry SHALL have a date (`YYYY-MM-DD`, the day it shipped), a type and one short remark. The type SHALL be one of FEATURE, FIX or ENHANCEMENT. The type SHALL be shown as a square badge: white text on a fill from Sanzo Wada combination 225, Dusky Green (`#00592e`) for FEATURE, Dark Slate Purple (`#53225c`) for ENHANCEMENT and Carmine (`#d60036`) for FIX, each at least 4.5:1 against the white text. The remark SHALL be one concise sentence or phrase about what a player sees, hears or can do, not how it was built. Entries SHALL be listed newest first. Entries with the same date SHALL keep the order they were written in, with the most recent change first. The date SHALL be in a `<time>` element whose `dateTime` is that date. The list SHALL be a list in the accessibility tree.

#### Scenario: Newest first
- **WHEN** the page is opened
- **THEN** the first entry has the latest date and the last entry has the earliest

#### Scenario: Entry content
- **WHEN** the visitor reads any entry
- **THEN** it shows a date, exactly one of FEATURE, FIX or ENHANCEMENT in a badge of that type's color, and a one-line remark

### Requirement: Changelog coverage
The changelog SHALL cover the history of Chime from its first release (2026-10-31), with an entry for each shipped feature, bug fix and enhancement. Changes that a player can't notice SHALL NOT get an entry: moving or archiving specs, notes for developers or agents, and tooling. From this change on, every change that ships a feature, bug fix or enhancement SHALL add its entry to the changelog in the same change.

#### Scenario: Backfilled history
- **WHEN** the page is first published
- **THEN** it lists the first release on 2026-10-31 and an entry for each shipped feature, fix or enhancement since, including channel focus and the upright channel strip

#### Scenario: Housekeeping is left out
- **WHEN** a change only archives OpenSpec files or edits agent notes
- **THEN** no entry is added for it

#### Scenario: New work adds an entry
- **WHEN** a later change ships a feature, fix or enhancement
- **THEN** that change also adds an entry with its date, type and remark at the top of the list
