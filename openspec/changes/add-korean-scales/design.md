# Design

## Context

See proposal.md for why the change is made and where the intervals come from. The requirements are in `specs/scales/spec.md`.

The catalog is one table in `lib/engine.js`:

- `SCALES` is an array of `[group, [[name, degrees], ...]]`.
- `SCALE_LIST` flattens it to `{ group, name, deg }`.
- `sixOf(deg)` turns any degree list into six tube offsets. It repeats the list an octave up when the list has fewer than six notes.

`components/Chime.jsx` builds the SCALE select from these. Each group gets a `SelectLabel` with `g.toUpperCase()`. Each option's value is its index in `SCALE_LIST`, held in `scaleIdx`, which starts at 0 and is never written to `localStorage`. The tubes, the readout, sound, MIDI and `.mid` export all read `P.scale`, which comes from `sixOf`. Adding scales therefore touches only the data.

## Goals / Non-Goals

**Goals:**
- Add the Korea group as data only, right after "Japan and Okinawa".
- Leave the order and contents of every existing group as they are.

**Non-Goals:**
- No changes to `sixOf`, the select component, or how scales are stored or chosen.
- No microtonal or ornamented versions (such as the wavering top note in pansori pyeongjo). Every scale stays in 12-TET, and per-tube cents remain on the CLAUDE.md idea list.
- No per-scale notes or source citations in the UI. The menu shows plain names.

## Decisions

- **Group name `"Korea"` in the data, shown as `KOREA`.** It matches how "Japan and Okinawa" is stored, and the select already uppercases group labels. Browser checks should compare headings without regard to case, or against the uppercase text.
- **Placed second, by inserting it into `SCALES`.** Every index after "Japan and Okinawa" shifts by five. That is safe because `scaleIdx` is not persisted and nothing else stores a scale index: takes and `.mid` files hold notes, not scale ids. A separate "regional" array appended at the end was considered, which would keep indices stable. It was rejected because the indices don't need to be stable, and it would split the East Asian groups apart.
- **Duplicates as separate entries.** UJO repeats PYEONGJO's degrees, and both match the existing YO (`[0, 2, 5, 7, 9]`). GYEMYEONJO matches MINOR PENTATONIC. They stay separate entries because the select keys options by index, not by degree list, so equal degree lists never collide. No de-duplication logic is added.
- **Five-note scales are written with five degrees and left to `sixOf`.** This is how the existing pentatonics are written, so PYEONGJO reaches C6 on tube 6 through the octave repeat, not through a hand-written 12. PYEONGJO HEXATONIC is written with six degrees and fills the tubes exactly.

## Risks / Trade-offs

- [The degree lists could be mistyped] → A scratch Node check compares each Korean entry's `sixOf` output with the spec's tables and scenarios (C5 PYEONGJO, C5 PYEONGJO HEXATONIC, A4 GYEMYEONJO), and checks that `SCALE_LIST.length` is 32.
- [Existing scales could shift or change by accident while editing the array] → The Node check also confirms that the 27 existing entries, with the Korea group removed, are identical to `main` and in the same order. The browser `ui-check` and the `sim-same` check must still pass.
- [The menu gets longer on a phone] → The list grows by five rows in a scrolling Radix select. It's acceptable, and the preview deploy is checked at phone width.
- [Nando-gyemyeonjo rests on a single Western source] → It is called out in the proposal. Removing it later is a one-line data change.

## Migration Plan

There is no data migration. The steps are: a branch, a PR with a Vercel preview for the user to check, then a merge to `main`, which deploys production. To roll back, revert the commit. No stored state refers to the new entries.
