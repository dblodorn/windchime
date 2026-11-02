# Proposal

## Why

The SCALE menu has an East Asian group for Japan and Okinawa, but nothing from Korea, whose court and folk music (gagok, sanjo, pansori) is built on its own named modes. Adding them gives the chime a set of tunings it can't play today under their Korean names. Duplicating interval sets already in the menu under other names is fine: the Korean name is what a player looks for.

## What Changes

- Add a **KOREA** group to the SCALE menu, placed right after "Japan and Okinawa". Names use Revised Romanization, the current South Korean standard, in the menu's uppercase style:

  | Name | Semitones from the root | Notes |
  |---|---|---|
  | PYEONGJO | 0 2 5 7 9 | sol-la-do-re-mi |
  | UJO | 0 2 5 7 9 | sol-la-do-re-mi |
  | GYEMYEONJO | 0 3 5 7 10 | la-do-re-mi-sol |
  | PYEONGJO HEXATONIC | 0 2 5 7 9 10 | sol-la-do-re-mi-fa |
  | NANDO-GYEMYEONJO | 0 2 3 5 7 | |

- The scale count goes from 27 to 32. Ryukyu stays first and remains the default. Saved settings and existing scales are unchanged.
- Scales with five notes fill the sixth tube with the root an octave up, as every pentatonic in the menu already does. PYEONGJO HEXATONIC fills all six tubes.

### Where the values come from

The source the user gave, Ian Ring's [Korean tradition page](https://ianring.com/musictheory/scales/traditions/korean), lists these names, mostly taken from Manuel Op de Coul's [List of Musical Modes](https://www.huygens-fokker.org/docs/modename.html). It was cross-checked against Korean sources, and one entry was corrected:

- **Pyeongjo** and **ujo** are both the sol mode, 0 2 5 7 9. This matches the yulmyeong notes for pyeongjo (hwang–tae–jung–im–nam, [earticle A298945](https://www.earticle.net/Article/A298945)), a sol-la-do-re-mi layout ([Choral Journal, Lee 2020](https://acda-publications.s3.us-east-2.amazonaws.com/CJ/November2020/LeeNov20.pdf)), and Op de Coul's "Ujo, P'yongjo" (2 3 2 2 3). Scholars split on how the two differ in practice, by register, ornament or the last note ([Shin, MTO 30.4](https://mtosmt.org/issues/mto.24.30.4/mto.24.30.4.kim.html)), so both names get the same pitches.
- **Gyemyeonjo** is the la mode, 0 3 5 7 10. This matches the yulmyeong notes (hwang–hyeop–jung–im–mu), la-do-re-mi-sol in the Choral Journal, and its stated equivalence with Chinese yu-jo. Ring's page puts "Kyemyonjo" on the major pentatonic (0 2 4 7 9). No Korean source supports that, so it is not used. Ring's "P'yongjo-kyemyonjo" is the same la-mode set, so it isn't added a second time.
- **Pyeongjo hexatonic** (0 2 5 7 9 10) is Op de Coul's six-note "P'yongjo". Korean sources describe pyeongjo as five-note, but note that in pansori its top note sits between mi and fa (g-a-c-d-f with the f falling toward e, per Shin). The six-note form holds both, so it is kept under a name that says it's the hexatonic form.
- **Nando-gyemyeonjo** (0 2 3 5 7) appears only in Op de Coul's list and lists derived from it. No Korean-language source for it was found. It is kept because the user asked for the scales on Ring's page, and it is the one entry resting on a single Western source.

## Capabilities

### New Capabilities
- `scales`: the SCALE menu's catalog, covering the groups and their order, the default scale, how a scale maps to the six tubes, and the Korean group's names and intervals. Only the Korean group's contents and the catalog rules it depends on are specified here; the existing groups keep their current contents.

### Modified Capabilities
None. `ui-controls` already requires grouped selects with headings, and the SCALE select needs no new behavior.

## Impact

- `lib/engine.js`: one new group in `SCALES`. `SCALE_LIST`, `sixOf`, the sim and MIDI are unchanged.
- `CLAUDE.md`: "27 scales" becomes 32 in the engine notes and the Node smoke test.
- Scratch checks: a Node check of the new entries and of `sixOf`, and a browser check that the KOREA heading and its five options appear in the SCALE select and set the tube readout.
- No dependencies, UI component, storage or API changes.
