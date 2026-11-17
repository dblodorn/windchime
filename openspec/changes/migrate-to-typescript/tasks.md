# Tasks

## 1. Baseline and setup

- [x] 1.1 Create branch `migrate-to-typescript` from `main` and verify `git status` is clean and `pnpm build` passes before any change
- [x] 1.2 Write a baseline script in the scratchpad that imports the JS engine and share code and saves golden outputs to the scratchpad: `encode()` of fixed compositions (1 unit, 16 units, a furin, roots 0 and 119), `buildMidi(renderTake(60))` bytes for seed 12345 (GM tubular bells and `v0`), strike count and the first 50 strike times for seed 12345 at WIND 0.45 (2, 6 and 8 tubes, and a furin); verify that running it twice gives identical files
- [x] 1.3 Save `pnpm catalog` output and a copy of `lib/server/persisted-operations.json` next to the golden outputs; verify both files are non-empty
- [x] 1.4 Add dev dependencies `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@types/react-relay`, `@types/relay-runtime` with `pnpm add -D`; verify `pnpm-lock.yaml` updated and `pnpm install --frozen-lockfile` succeeds
- [x] 1.5 Replace `jsconfig.json` with `tsconfig.json` (strict, `noEmit`, `moduleResolution: "bundler"`, `jsx: "preserve"`, `erasableSyntaxOnly`, `allowImportingTsExtensions`, `@/*` alias, Next plugin, temporary `allowJs`) and add `"typecheck": "tsc --noEmit"`; verify `pnpm typecheck` and `pnpm build` both pass with no files converted yet
- [x] 1.6 Set `engines.node` to `>=22.18` and check the Vercel project `windchime`'s Node.js version is 22.18 or higher (24 expected); verify by reading the project setting

## 2. lib (leaf modules first)

- [x] 2.1 `git mv` and type `lib/utils`, `lib/colors`, `lib/changelog` to `.ts` (changelog `type` as a string union keyed into `TYPES`); verify `pnpm typecheck` passes
- [x] 2.2 `git mv lib/engine.js lib/engine.ts` and add interfaces for params `P`, voices, SF2 structures (preset, zone, region, sample header, font) and the sim, plus `export type Chime = ReturnType<typeof createChime>`; type Tone's dynamic import as `typeof import("tone")`; verify `pnpm typecheck` passes and `node -e 'import("./lib/engine.ts").then(m => console.log(m.SCALE_LIST.length, typeof m.createChime))'` prints `32 function`
- [x] 2.3 Add the `declare global` augmentation for `AudioContext.setSinkId`/`sinkchange`/`sinkId` constructor option and `navigator.audioSession`, only for what TypeScript's DOM lib lacks; verify `pnpm typecheck` passes with no `@ts-ignore` in `lib/`
- [x] 2.4 `git mv lib/share.js lib/share.ts`, import `./engine.ts`, export `Unit` from `z.infer<typeof UnitSchema>` (plus `id`) and the composition and packed-unit types; verify `pnpm typecheck` passes and `node -e 'import("./lib/share.ts")'` exits 0
- [x] 2.5 `git mv` and type `lib/midiout.ts` (status snapshot interface, Web MIDI types from the DOM lib, note-off timer map) and `lib/relay/environment.ts` (typed `ApiError` and fetch function); verify `pnpm typecheck` passes
- [x] 2.6 Rerun the baseline script against the `.ts` engine and share code and diff against the golden outputs; verify every file is byte-identical

## 3. Relay

- [x] 3.1 Set `language: "typescript"` in `relay.config.json` and `compiler.relay` (keep them identical); verify `pnpm relay` writes `__generated__/*.graphql.ts` and no `.js` artifacts remain after removing the old `__generated__/` dirs
- [x] 3.2 Diff the regenerated `lib/server/persisted-operations.json` against the saved copy; verify ids and operation text are identical

## 4. Components

- [x] 4.1 `git mv` and type `components/ui/*` to `.tsx` (`badge`, `button`, `checkbox`, `dialog`, `popover`, `select`, `sheet`, `slider` with its `ticks` prop, `search-select` with its `groups`/`rank` types and `contentStyle`); verify `pnpm typecheck` passes
- [x] 4.2 `git mv components/Compositions.jsx components/Compositions.tsx` and use the Relay-generated types for its query, fragment and mutation (including the `updater`); if a hook doesn't type-check against `@types/react-relay`, add a narrow local declaration; verify `pnpm typecheck` passes
- [x] 4.3 `git mv components/Chime.jsx components/Chime.tsx` and type it with `Unit` from `lib/share.ts`, `Chime` from the engine, the MIDI status type, refs, and `InkContext`; no control-flow changes; verify `pnpm typecheck` passes

## 5. App, scripts and config

- [x] 5.1 `git mv` and type `app/layout`, `app/page`, `app/changelog/page`, `app/opengraph-image` to `.tsx` and `app/api/graphql/route` to `.ts` (typed `Request`, persisted map as `Record<string, string>`); verify `pnpm typecheck` passes and `/changelog` still ships no client JS of its own in `pnpm build` output
- [x] 5.2 `git mv` `scripts/catalog.mjs`, `relay.mjs`, `fetch-api-schema.mjs` to `.ts` (catalog imports `../lib/engine.ts`) and point the `package.json` scripts at them; verify `pnpm relay` and `pnpm catalog` run, and `pnpm catalog` output matches the saved copy
- [x] 5.3 `git mv next.config.mjs next.config.ts` with the `NextConfig` type and set `tsx: true` in `components.json`; leave `postcss.config.mjs`; verify `pnpm build` passes
- [x] 5.4 Remove `allowJs` from `tsconfig.json`; verify `git ls-files '*.js' '*.jsx' '*.mjs'` lists only `postcss.config.mjs`, and `pnpm typecheck` and `pnpm build` pass
- [x] 5.5 Check for escape hatches; verify `grep -rn "@ts-ignore\|: any\|as any" app components lib scripts` returns nothing unexplained, and every `@ts-expect-error` has a reason comment

## 6. Verification

- [x] 6.1 Rerun the baseline script on the final tree and diff against the golden outputs; verify every file is byte-identical
- [x] 6.2 Run `pnpm start` and a Playwright pass (`--mute-audio`, fake MIDI, stubbed `/api/graphql`): load with no console errors or hydration warnings, strike a tube, open SETTINGS and change SCALE and SOUNDFONT by search, COPY, SHARE and reopen the link, check MIDI `0x9n`/`0x8n` and CC bytes, PANIC, and open COMPOSITIONS and load a row; verify every step passes
- [ ] 6.3 Push the branch and open the Vercel preview; verify the deploy succeeds (including `pnpm relay` under Vercel's Node) and the preview loads

## 7. Docs

- [x] 7.1 Update CLAUDE.md: Stack (TypeScript by default, replacing "Keep it JS unless asked"), every path in Layout to `.ts`/`.tsx`, Commands (`pnpm typecheck`), Testing (engine checks run with `node` on `.ts` files; drop the module-type warning note if Node no longer prints it), and the shadcn note (`tsx: true`); verify `grep -n "\.jsx\?\b\|plain JavaScript\|Keep it JS" CLAUDE.md` finds nothing stale
- [x] 7.2 Update AGENTS.md and README.md the same way; verify the same grep finds nothing stale in either
- [ ] 7.3 Commit, open the PR against `main` (no changelog entry: not player-facing); verify the PR shows the renames as renames
