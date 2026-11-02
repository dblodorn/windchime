# Tasks

## 1. Setup

- [x] 1.1 Create branch `add-korean-scales` from `main`, and save the current catalog as a baseline: write `SCALE_LIST` (group, name, deg) to `scales-before.json` in the session scratchpad with a Node one-liner. Verify: the file has 27 entries, with RYUKYU first.
  - Result: 27 entries, RYUKYU first.

## 2. Catalog (`lib/engine.js`)

- [x] 2.1 Insert the `"Korea"` group into `SCALES` right after "Japan and Okinawa". It holds PYEONGJO `[0, 2, 5, 7, 9]`, UJO `[0, 2, 5, 7, 9]`, GYEMYEONJO `[0, 3, 5, 7, 10]`, PYEONGJO HEXATONIC `[0, 2, 5, 7, 9, 10]` and NANDO-GYEMYEONJO `[0, 2, 3, 5, 7]`, in that order. Five-note scales get five degrees, with no hand-written octave (design Decisions). Verify: `node -e 'import("./lib/engine.js").then(m => console.log(m.SCALE_LIST.length))'` prints 32.
  - Result: prints 32.
- [x] 2.2 Write the scratch `scales-check.mjs` and run it in Node. It checks:
  - the group order matches the spec, and RYUKYU is `SCALE_LIST[0]`;
  - the Korea entries match the spec table;
  - `sixOf` gives `0 2 5 7 9 12` for PYEONGJO, `0 2 5 7 9 10` for PYEONGJO HEXATONIC, and `0 3 5 7 10 12` for GYEMYEONJO;
  - with root 69 (A4), GYEMYEONJO names A4 C5 D5 E5 G5 A5, and with root 72 (C5), PYEONGJO names C5 D5 F5 G5 A5 C6;
  - with the Korea group removed, `SCALE_LIST` equals `scales-before.json` exactly.

  Verify: every check passes.
  - Result: 12/12.

## 3. Browser verification

- [x] 3.1 Write the scratch `korean-scales-check.mjs` (Playwright, with the MIDI stub from `midi-check.mjs`) against a production build (`pnpm build`, then restart the server on port 3123). At 1280 and 375 px it checks:
  - SCALE shows RYUKYU on load;
  - the opened select's headings, in order, are JAPAN AND OKINAWA, KOREA, PENTATONIC, HEXATONIC, MODES AND MAQAM, CHORDS AND SERIES;
  - there are 32 options, and the five Korean options sit under KOREA in spec order;
  - with ROOT C5, choosing PYEONGJO makes the SCALE row read `0 +2 +5 +7 +9 +12` and the tube readout show C5 D5 F5 G5 A5 C6;
  - PYEONGJO HEXATONIC reads `0 +2 +5 +7 +9 +10`, with A#5 on tube 6;
  - with ROOT A4, GYEMYEONJO shows A4 C5 D5 E5 G5 A5;
  - with a connected stub port, ROOT C5 and NANDO-GYEMYEONJO, tapping tube 2 sends a note-on with note 74 on the chosen channel;
  - no hydration or Radix warnings are logged.

  Verify: all checks pass, and the menu screenshot at 375 px is saved to the scratchpad.
  - Result: 22/22 at 1280 and 375 px. The screenshot is `korean-scales-menu-375.png` in the session scratchpad. The KOREA heading sits right under MIYAKO-BUSHI, in the same style as the other groups.
- [x] 3.2 Run the existing scratch checks `ui-check.mjs`, `midi-check.mjs`, `drawing-check.mjs` and `sim-same.mjs` against the same build. Verify: ui-check 79/79, midi-check 50/50, drawing-check 30/30, and SIM IDENTICAL. Or each changed count is explained by the longer SCALE list alone.
  - Result: ui-check 79/79, midi-check 50/50, drawing-check 30/30, SIM IDENTICAL.

## 4. Docs and release

- [x] 4.1 Update `CLAUDE.md`: "27 scales" becomes "32 scales" in engine section 2, and the Node smoke test "(prints 27)" becomes "(prints 32)". Verify: `grep -n "27" CLAUDE.md` shows no scale count, and `grep -n "32" CLAUDE.md` shows both lines.
- [ ] 4.2 Commit, push the branch and open a PR. The description lists the five scales and their sources (from proposal.md), the check results, and the 375 px menu screenshot. Verify: the PR URL and the Vercel preview URL are noted in this task's completion message, and the preview deploy succeeded.
- [ ] 4.3 Check the Vercel preview on a phone and on desktop: the KOREA group appears second, each Korean scale sounds and retunes the tubes, and the menu scrolls cleanly at phone width. Verify: the user confirms before merging to `main`.
