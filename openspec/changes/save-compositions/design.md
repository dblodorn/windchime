# Design

## Context

Chime is a client component (`components/Chime.jsx`) that prerenders and talks to no server today. Units are plain records validated by `Sh.UnitSchema`. Share links pack them as integers (`PackedUnitSchema`) and decode through `CompositionSchema`. The mount effect and the `hashchange` listener already replace the page's units from a link (`linkedUnits`) and end the old units' MIDI notes.

The store and the write path belong to dmbk-graphql-api, in its OpenSpec change `chime-compositions`, which defines:
- `dmbkSoundChimeCompositions(first, after)`, public;
- `dmbkSoundSaveChimeComposition(input: { units })`, which needs a client key, generates the title, and collapses duplicates;
- `ChimeUnit`, with the share link's integers under readable names, `midiMode` as `POLY`/`MONO`, scale by name, and voice id or null.

The API refuses mutations without a key and wants keys sent only from servers (`api-access`). lora-trainer, the API's other Relay client, solved this with a same-origin proxy that forwards persisted operations by id. This change copies that design, in plain JS and with the App Router.

Order across the repos:
1. `scripts/catalog.mjs` here, first: the API copies its output.
2. The API change deploys, its collection is created, and a key is issued.
3. The rest of this change.

## Goals / Non-Goals

**Goals:** save and browse with no account; the API key never in the browser; no network traffic until the panel or SAVE is used; a loaded composition behaves exactly like an opened link; 1-bit visual rules intact.

**Non-Goals:**
- deleting or renaming your own saves;
- search or filters;
- URLs per saved composition (SHARE covers sharing);
- moderation UI (admins hide through the API);
- server rendering of the list.

## Decisions

**Relay, compiled, persisted.**
- `relay.config.json`: `src: "."`, `schema: "./schemas/dmbk-graphql-api.graphql"`, `language: "javascript"`, `eagerEsModules: true`, and `persistConfig` writing `lib/server/persisted-operations.json` (SHA256). It excludes `node_modules`, `__generated__`, `.next` and `lib/server`.
- `next.config.mjs` gets `compiler: { relay: { src: ".", language: "javascript", eagerEsModules: true } }`, mirroring the config. The two must agree.
- `scripts/relay.mjs` seeds an empty persisted map so the compiler can start on a fresh checkout, as lora-trainer's does.
- `dev` and `build` run `pnpm relay` first. Vercel runs `build` with devDependencies installed, so the compiler runs there.
- Generated `__generated__/` and the persisted map are git-ignored.

*Alternative:* hand-written `fetch` with query strings and no Relay. Rejected: the user asked for Relay, and the persisted allowlist is what lets a keyed proxy be safe.

**Route handler as the only door.** `app/api/graphql/route.js` (`export const runtime = "nodejs"`, `dynamic = "force-dynamic"`), ported from lora-trainer's `pages/api/graphql.ts`:
- POST only;
- same-origin check through `Sec-Fetch-Site`, with `Origin` against `Host` as the fallback;
- the id must be an own property of the persisted map, and query text is refused;
- forwarding to `DMBK_GRAPHQL_API_URL` (default `https://graphql.dmbk.network/graphql`) with:
  - `x-api-key: DMBK_GRAPHQL_API_KEY`;
  - `x-end-user-ip`, taken from the first entry of `x-forwarded-for` (Vercel sets it to the visitor);
  - no cookie and no `Authorization`, because windchime has no sessions;
- `cache-control: no-store`.

A missing key in production throws at request time, so a misconfigured deploy fails loudly but only on this route. Locally, with no key, saves get the API's `FORBIDDEN` while reads still work through the playground tier.

**The environment and when it mounts.** `lib/relay/environment.js` (fetch function posting `{ id, variables }`, `ApiError` carrying `extensions.code`) is created lazily in `Chime`'s state. `RelayEnvironmentProvider` wraps only the panel. The panel's content is a client-only component that mounts when the sheet first opens, using `useLazyLoadQuery` under `Suspense` with `fetchPolicy: "store-and-network"`. It doesn't render on the server, so there is no hydration mismatch and no fetch on page load. The list is a `usePaginationFragment` over the connection (`first: 20`); MORE calls `loadNext(20)`. SAVE is `useMutation`. On success it prepends the new edge with `@prependEdge` on the connection id, which Relay skips when the edge is already present (duplicate save → no second row).

**Units across the wire.** `lib/share.js` gains `toSaved(units)` and `fromSaved(units)`. They reuse the integer conversion that `pack` already does (volume ×100, decay ×10, cutoff ×1000, resonance ×10, channel, flags split into `midiMode` and `notes`, and `x`/`y`/`rank`). The scale is sent by name and the voice id as stored. `fromSaved` rebuilds records in page order, assigns `z` from `rank`, and runs `CompositionSchema`, the same path as `decode`. A composition that fails (for example a voice id this build doesn't know) leaves the page alone. Sharing one converter with the link code is what makes the round-trip scenario hold.

**One replace path.** `Chime` already replaces units for a link: `linkedUnits` → end old MIDI notes → `setUnits` → the save effect writes `windchime.units`. That becomes `replaceComposition(units)`, which both the link handler and the panel's row click call. The panel then closes.

**The catalog script.** `scripts/catalog.mjs` (Node, imports `lib/engine.js`, reads `public/TimGM6mb.sf2` with `addFont`) prints `{ scales: SCALE_LIST names, voices: { v<i>: VOICES[i].name, "s0:<p>": preset name } }` as JSON, run as `pnpm catalog`. The API stores a copy and validates against it. CLAUDE.md's index rule grows one step: after appending a scale or replacing the font file, run `pnpm catalog` and update the API's copy before relying on it.

**Panel component.** `pnpm dlx shadcn@4.23.0 add sheet`, then stripped per the house rules (no `rounded-*`, `shadow-*`, `ring-*`, `dark:*` or lucide imports, and a transparent overlay like `dialog.jsx`'s). The side is `right`, `w-[min(360px,100vw)]`, with `border-l` and the `CLOSE` text button. Rows are full-width buttons with the title on one line, `n CHIMES · YYYY-MM-DD` under it, and hover inverts. Dates are formatted in the browser from `createdAt`, as UTC date only, so they don't depend on locale.

**MENU button.** Same fixed row as SHARE and MIDI: `right-[calc(16px+84px+84px+safe)]`, `h-11 w-11`, Lucide `Menu` at a whole-pixel size with `shapeRendering="crispEdges"`, `aria-label="MENU"`, `aria-haspopup="dialog"`. It's placed in `Chime`, not in a unit. CLAUDE.md's icon exception list grows by this one.

## Risks / Trade-offs

- **Relay adds weight** (about 40 KB gzipped runtime) to a tiny app. Mitigation: the panel and its Relay imports load with `next/dynamic` when MENU is first pressed, so first paint is unchanged.
- **Proxy on serverless.** Each save is one function call. Latency is the API round trip. Acceptable.
- **`x-forwarded-for` trust.** On Vercel the first entry is the client as Vercel saw it. A visitor can't spoof past that for rate limiting purposes beyond what Vercel allows.
- **Schema drift.** The checked-in schema can lag the API. The compile fails on removed fields, which is the intended signal. Additive API changes don't break it.
- **Catalog drift.** Adding a scale here without updating the API makes saves using it fail with `COULD NOT SAVE`. That's visible and safe, and documented.
- **Testing needs the API.** Playwright tests stub the route by intercepting `/api/graphql` with fixture responses. One manual run against the real API checks the full path.

## Migration Plan

1. Land `scripts/catalog.mjs` (task 1). The API change can then copy it.
2. After the API is live: set `DMBK_GRAPHQL_API_KEY` (and optionally `DMBK_GRAPHQL_API_URL`) in Vercel for Production and Preview, then pull the schema, build and deploy.
3. Rollback: revert. Nothing local changes shape (`windchime.units` is untouched).

## Open Questions

- MENU sits left of SHARE, and the panel opens from the right. If you'd rather have it top-left with a left-side panel, that's a placement change only.
