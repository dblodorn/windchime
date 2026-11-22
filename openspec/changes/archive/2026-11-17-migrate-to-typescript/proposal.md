# Proposal

## Why

Chime is about 3,600 lines of plain JavaScript, and its data shapes are only written down in CLAUDE.md: the unit record, a chime's `P`, the share link's byte layout, the SF2 tables, the MIDI port state. Nothing checks them, so a renamed field or a wrong argument shows up in the browser, not at build time. TypeScript is now the default for all new work, and this project's notes still say "keep it JS", so the app should move over before more code is added in JS.

## What Changes

- Every source file becomes TypeScript: `.js` → `.ts` and `.jsx` → `.tsx` in `app/`, `components/` (including `components/ui/`) and `lib/`. The scripts (`scripts/*.mjs`) and the config files (`next.config.mjs`, `postcss.config.mjs`) become `.ts` where their tool supports it.
- A `tsconfig.json` with `strict` on replaces `jsconfig.json` and keeps the `@/*` alias. `pnpm build` (Next's type check) fails on type errors, and a `typecheck` script (`tsc --noEmit`) is added.
- Types for the shapes that matter: the unit record (from the zod `UnitSchema` with `z.infer`, so it can't drift from the schema), a chime's params and engine API, voices, the SF2 structures, the MIDI status snapshot, and the Relay operations (the compiler emits TypeScript instead of JS).
- Relay switches to `language: "typescript"` in both `relay.config.json` and `next.config` (they must agree).
- shadcn's `components.json` sets `tsx: true`, so components added later come in as TypeScript.
- CLAUDE.md, AGENTS.md and the README say TypeScript by default instead of "plain JavaScript (no TypeScript). Keep it JS unless asked.", and their file paths are updated.
- Nothing a player sees, hears or saves changes: same UI, same sound, same MIDI bytes, same share links and saved compositions. No changelog entry, since it isn't player-facing.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. This is a language change with no change in behavior, so the change sets `skip_specs: true`.

## Impact

- Every file under `app/`, `components/` and `lib/` is renamed and typed; `components/Chime.jsx` (913 lines) and `lib/engine.js` (937 lines) are most of the work.
- Config: new `tsconfig.json` and `next-env.d.ts`, `jsconfig.json` removed, `relay.config.json`, `next.config`, `components.json`, `package.json` scripts.
- New dev dependencies: `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@types/react-relay`, `@types/relay-runtime`. `pnpm-lock.yaml` is updated with them.
- Engine in Node: the smoke test and the Node-side checks import `lib/engine.js` directly today. They'll need a TypeScript-aware runner (Node's type stripping or `tsx`); the notes will say which.
- Generated Relay artifacts (`__generated__/`) become `.ts`; they stay git-ignored. The persisted-operations map, its ids and the API route's behavior don't change.
- No API, storage, share-link or deploy changes.
