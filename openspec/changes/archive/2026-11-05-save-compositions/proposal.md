# Proposal

## Why

A composition can only travel as a share link today, so nobody can come across other people's chimes. Visitors should be able to save a composition, without an account, to a public list. Anyone opening Chime should then be able to browse that list and load any composition into the player.

## What Changes

- A **MENU** button (Lucide `Menu`, the hamburger icon, in a square 44×44 button) fixed in the lower-right row, 8 px left of SHARE.
- MENU opens a **COMPOSITIONS** side panel from the right edge:
  - a SAVE button that saves the current composition;
  - the public list of saved compositions, newest first, each showing its title, unit count and date;
  - MORE to page further.
- Selecting a composition loads it the way opening a share link does: it replaces the units (and therefore the saved state), every unit starts muted, and the old units' MIDI notes are ended.
- The titles come from the API (unit count, key, instrument). The panel never asks for a name.
- **Relay** is the client for the dmbk GraphQL API (`graphql.dmbk.network`). The browser posts only persisted operation ids to a same-origin route, `app/api/graphql`. That route adds windchime's API key and the visitor's IP, and forwards only operations compiled from this app. This is the setup lora-trainer uses.
- The API's schema is checked in at `schemas/dmbk-graphql-api.graphql` and refreshed on purpose with `pnpm schema:pull`. `pnpm relay` runs before `dev` and `build`.
- `pnpm catalog` prints the scale and voice catalog the API validates against. It must be re-copied to the API whenever `SCALES` or the bundled font grows.
- An exception to the icon rule, by request: MENU is the only icon outside the four round unit buttons. It stays square.

## Capabilities

### New Capabilities
- `saved-compositions`: the MENU button, the COMPOSITIONS panel, saving, the public list, loading a saved composition, and the server route that is this app's only way to the API.

### Modified Capabilities
(none: share links, units, storage and the visual rules keep their requirements. Loading a saved composition is specified in the new capability.)

## Impact

- Depends on dmbk-graphql-api's `chime-compositions` change being deployed, its collection created, and a `windchime` API key set in Vercel as `DMBK_GRAPHQL_API_KEY`.
- New dependencies: `react-relay`, `relay-runtime`; dev dependencies `relay-compiler` and `get-graphql-schema`. `next.config.mjs` gains `compiler.relay`, there is a new `relay.config.json`, and `pnpm-lock.yaml` is updated.
- New files:
  - `app/api/graphql/route.js` (Node runtime) and `lib/relay/environment.js`;
  - `components/Compositions.jsx`, `components/ui/sheet.jsx` (shadcn, restyled 1-bit);
  - `scripts/catalog.mjs`, `scripts/relay.mjs`, `scripts/fetch-api-schema.mjs`, `schemas/dmbk-graphql-api.graphql`.
- Changed:
  - `components/Chime.jsx` (MENU button, panel, load path shared with links);
  - `lib/share.js` (convert units to and from the API's integer form);
  - `.gitignore` (`__generated__/`, the persisted-operation map), `CLAUDE.md`.
- First network call to anything but static files. It happens only when the panel opens or SAVE is pressed. Page load stays offline-capable as today.
