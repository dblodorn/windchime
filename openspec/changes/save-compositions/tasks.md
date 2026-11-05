## 1. Catalog (lands first; the API change copies its output)

- [x] 1.1 Add `scripts/catalog.mjs` and a `catalog` package script. It prints `{ scales, voices }` JSON (scale names in `SCALE_LIST` order; `v<i>` → built-in voice name; `s0:<p>` → GM preset name from `public/TimGM6mb.sf2`)
- [x] 1.2 Check it: 32 scales, every built-in voice, 136 presets, ids matching what `chooseVoice` accepts

## 2. Wait for the API

- [ ] 2.1 dmbk-graphql-api `chime-compositions` is deployed, `chime_compositions` exists in production, and a `windchime` key is issued
- [ ] 2.2 `DMBK_GRAPHQL_API_KEY` is set in Vercel (Production and Preview) by the user

## 3. Relay toolchain

- [x] 3.1 Add `react-relay` and `relay-runtime`, plus the dev dependencies `relay-compiler` and `get-graphql-schema`, with `pnpm add`, so the lockfile is updated
- [x] 3.2 Add `scripts/fetch-api-schema.mjs` (`pnpm schema:pull`) and commit `schemas/dmbk-graphql-api.graphql`
- [x] 3.3 Add `relay.config.json` (JS, persisted to `lib/server/persisted-operations.json`) and `scripts/relay.mjs` (seeds the map), make `dev`/`build` run `pnpm relay` first, and add `compiler.relay` to `next.config.mjs`
- [x] 3.4 Ignore `__generated__/` and the persisted map in `.gitignore`. `pnpm build` passes with no operations yet

## 4. Server route

- [x] 4.1 Add `app/api/graphql/route.js`:
  - POST only, same-origin check, persisted-id allowlist (own properties only);
  - forwards with `x-api-key` and `x-end-user-ip` (first `x-forwarded-for` entry), and no cookie;
  - `no-store`, and `API_UNAVAILABLE` on network failure.
- [x] 4.2 Add `lib/relay/environment.js` (fetch by id, `ApiError` with code)

## 5. Units across the wire

- [x] 5.1 Add `toSaved(units)` and `fromSaved(savedUnits)` to `lib/share.js`, sharing `pack`'s integer conversion, with `fromSaved` ending in `CompositionSchema`
- [x] 5.2 Node check: for the share-link test cases (16 units, mixed voices and scales, edge values), `encode(fromSaved(toSaved(u)))` equals `encode(u)`, and `fromSaved` rejects an unknown scale or a 17-unit list

## 6. UI

- [x] 6.1 `pnpm dlx shadcn@4.23.0 add sheet`, then restyle to 1-bit (strip rounded, shadow, ring, dark and lucide; transparent overlay; dashed focus)
- [x] 6.2 Factor `Chime`'s link replace into `replaceComposition(units)` (end old MIDI notes, set units, close any open popovers), used by the link handlers and the panel
- [x] 6.3 Add the MENU button (Lucide `Menu`, `crispEdges`, `h-11 w-11`, 8 px left of SHARE, `aria-label="MENU"`, `aria-haspopup="dialog"`)
- [x] 6.4 Add `components/Compositions.jsx`, loaded with `next/dynamic` on first open, under `RelayEnvironmentProvider`:
  - list query with a pagination fragment (20 at a time, MORE);
  - LOADING…, COULD NOT LOAD and RETRY states;
  - rows with title, `n CHIMES` and UTC date.
- [x] 6.5 SAVE: a `useMutation` with `@prependEdge`; SAVING… → SAVED, `TOO MANY SAVES, TRY LATER` on `RATE_LIMITED`, and `COULD NOT SAVE` otherwise
- [x] 6.6 Row click: `fromSaved` → `replaceComposition`, then close the panel; `COULD NOT OPEN` when the units fail their checks

## 7. Tests

- [x] 7.1 Playwright, with `/api/graphql` intercepted by fixtures:
  - no request until MENU;
  - the panel's name, width at 320 px and Escape/focus return;
  - list, MORE, error with RETRY;
  - SAVE states including rate-limited;
  - load replaces units, muted, survives reload;
  - the round-trip share link;
  - MENU/SHARE/MIDI order and spacing.
- [x] 7.2 Route checks against `pnpm start`: query text, an unknown id, GET and a cross-origin POST are each refused with no upstream call. The API key appears in no client bundle (`grep` over `.next/static`)
- [x] 7.3 Existing `pw/share.cjs`, `pw/ui.cjs` and `pw/sfui.cjs` still pass
- [ ] 7.4 Manual end-to-end against the real API from a Vercel preview: save, see it listed, load it in another browser

## 8. Docs

- [x] 8.1 `CLAUDE.md`:
  - Stack (Relay) and Layout (route, environment, panel, schemas, scripts);
  - MENU in the icon exceptions;
  - the panel's rules for tests (find by name "COMPOSITIONS");
  - env vars, `pnpm schema:pull` / `pnpm relay` / `pnpm catalog`;
  - the index rule's new catalog step.
