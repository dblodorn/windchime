# Design

- **Registry:** nothing outside `lib/synths.ts` and `PatchSelect.tsx` knows which synths exist. Share links store `1 + index` (DX7 = 2), saved compositions store `x:yamaha-dx7`, and `lib/patches.ts` fetches any synth's patch through `SynthPatch` with the entry's `patchType` and `patchBytes`. Round-trip checked in Node: two DX7 units (with and without a patch) and a VZ unit survive `encode`/`decode` and `toSaved`/`fromSaved`.
- **INIT loudness:** the DX7 engine sums carriers unnormalised (as the hardware does), so the DX7's INIT VOICE (one carrier) peaks at 0.125. Algorithm 32 with OP1, OP2 and OP3 in phase (OSC KEY SYNC on) at 99, 99 and 90 peaks at 0.307, measured with the published package. That matches the VZ INIT's target, the built-in voices' level.
- **Search length:** the DX7 API refuses `search` over 10 characters, so the PATCH field's `maxLength` and the trimmed query come from the entry's `nameLength`.
- **Order of deploys:**
  - the API (#46, after #45) has to be live before DX7 units can save compositions or list patches;
  - the chime validator update already ran;
  - until the API deploys, a DX7 unit still plays INIT, and PATCH shows COULD NOT LOAD.
