# Tasks

- [x] 1.1 Install `@dblodorn/yamaha-dx7-engine@0.1.0` (pinned); `pnpm-workspace.yaml` release-age exemption. Verify: `pnpm install --frozen-lockfile` and `pnpm build`.
- [x] 1.2 `lib/synths/yamaha-dx7-init.ts`; the registry entry with `nameLength` on both synths. Verify: the INIT reads as INIT VOICE and peaks at 0.307 with the published engine.
- [x] 1.3 `PatchSelectDx7Query`, `toPage`, per-synth search length; schema pulled; Relay compiles (8 operations). Verify: typecheck.
- [x] 1.4 The chime catalog with `x:yamaha-dx7` in dmbk-graphql-api (#46); `chime:collection -- --apply`. Verify: it reports the validator up to date.
- [x] 1.5 The louder VZ INIT from `88dfd13`.
- [x] 1.6 Playwright against `next start` with the API stubbed. Verify:
  - SOUND → YAMAHA DX7 shows PATCH = INIT VOICE;
  - PATCH lists the DX7 library, and picking BELL DX7 fetches `Dx7Voice:<id>`;
  - the notes line reads `YAMAHA DX7 · BELL DX7 · RYUKYU`;
  - SOUND loads the `yamaha-dx7-engine` worklet and it sounds;
  - no errors.
- [ ] 2.1 After dmbk-graphql-api #45 and #46 deploy and this merges: on https://chime.dmbk.io pick YAMAHA DX7 and a shared patch, save the composition, reload it.
