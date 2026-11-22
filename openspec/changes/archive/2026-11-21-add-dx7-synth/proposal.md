# Proposal

## Why

The DX7 editor (dblodorn/dx7) published its emulator as `@dblodorn/yamaha-dx7-engine@0.1.0` and its voice library is on the dmbk API (`dx7-voices`). windchime's external-synth registry was built so a second emulator is one entry: this is that entry.

## What Changes

- `@dblodorn/yamaha-dx7-engine@0.1.0`, pinned. `pnpm-workspace.yaml` exempts it from pnpm's one-day release-age hold, so a release can be adopted the day it's published.
- `EXTERNAL_SYNTHS` gains `yamaha-dx7` (YAMAHA DX7). It is appended, so its link code is 2, and links and saves are unchanged for every existing synth:
  - `patchType` is `Dx7Voice`, `patchBytes` 155;
  - INIT is `lib/synths/yamaha-dx7-init.ts`: INIT VOICE with three carriers, so it's as loud as the built-in voices;
  - a new registry field, `nameLength`, gives the PATCH search limit (VZ 12, DX7 10).
- `PatchSelect.tsx`: `PatchSelectDx7Query` (`dmbkSoundDx7Voices`), and one `toPage` for every synth's connection.
- The schema is pulled with the DX7 types.
- dmbk-graphql-api's chime catalog gains `x:yamaha-dx7` (its PR #46), and the chime validator is already updated.
- Also: the VZ-10M's louder INIT (`88dfd13` on `add-vz10m-synth`, pushed after PR #33 merged, so it never reached `main`).
- Changelog lines; `CLAUDE.md`.

## Non-goals

- Changing how links or saves encode synths: the registry's append rule already covers this.

## Capabilities

### Modified Capabilities
- `external-synths` (in the unarchived `add-vz10m-synth`): adds the DX7 entry.
