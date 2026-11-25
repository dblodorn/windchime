# Design

## Context

See proposal.md for why and the specs for the required behavior. Current state that shapes the approach:

- `app/page.tsx` renders `<Chime />`, a client component that prerenders one default unit and replaces it with `windchime.units` (or a `#c=` composition) in a mount effect.
- The browser reaches the API only through `app/api/graphql/route.ts`, which forwards Relay-persisted operations by id with the server's API key. Relay is kept off the page until MENU is pressed: `Compositions.tsx` (list, SAVE) is loaded by `next/dynamic`.
- `ChimeComposition` is already a `Node`; `node(id)` returns null for hidden and missing compositions. Global ids are base64 of `ChimeComposition:<24 hex>`. The API already keeps one composition per fingerprint and returns it with `created: false` on a duplicate save.
- The synth editors' device key (`apps/editor/lib/device.ts` in juno60, the same in dx7 and vz10m) and the API's `creatorHash` / `yours(creatorKey)` / `creatorKey` list filter are the pattern to copy. The compositions collection has none of it yet.

## Goals / Non-Goals

**Goals:**
- `/c/<id>` server-renders the composition (units, title, card) with no client fetch before the units appear.
- SHARE keeps working everywhere it does now, including Safari's clipboard rules and a down or rate-limited API.
- Ownership is the editors' device-key scheme, stored on the composition, with no change to fingerprints or titles.
- Relay and the GraphQL route stay off `/` until MENU, SAVE or SHARE is used.

**Non-Goals:**
- Deleting, renaming or updating compositions, even your own (the API still deletes nothing).
- Claiming compositions saved before this change, or moving a composition to the key that shared a duplicate.
- Search in the list, or per-composition analytics.
- Changing the `#c=` format (stays version 2) or its reader.

## Decisions

### 1. Hex id in the address, global id on the wire
The address uses the 24-hex `_id` (`/c/6560f1…`): short, the stored id, and what the API's own spec names. The app converts at the edge: `toGlobalId(hex) = base64("ChimeComposition:" + hex)` for `node(id)`, and `hexOf(globalId)` after a save. A path segment that isn't exactly 24 lowercase hex is a 404 without any API call.
*Alternative:* the base64 global id in the URL. Longer, has `=` padding, and leaks the type name for nothing.

### 2. A server component route that shares the proxy's forwarding code
`app/c/[id]/page.tsx` is a dynamic server component. It runs one Relay-compiled query, `CompositionPageQuery` (`node(id) { ... on ChimeComposition { id title units {...} } }`), whose persisted id and text come from the compiler like every other operation. The forwarding part of `route.ts` (API URL, key, timeout, error mapping) moves into `lib/server/api.ts` (`runPersisted(id, variables, ip?)`), used by both the route and the page, so there is one place that holds the key. The page wraps the fetch in React `cache()` so `generateMetadata` (document title `<TITLE> · Chime`) and the page share one request, and `app/c/[id]/opengraph-image.tsx` renders the existing card with the title under the head (same Knif Mono loading as `app/opengraph-image.tsx`). Reads are not rate-limited, so no visitor IP is sent from the page.
- `node` null → `notFound()`. `app/c/[id]/not-found.tsx` renders `<Chime notice="COMPOSITION NOT FOUND" />`, so the status is 404 and the player still works with the stored units.
- API unreachable, or units that fail `Sh.fromSaved` → `<Chime notice="COULD NOT OPEN" />` with status 200, nothing replaced, address kept.
- Found → `<Chime initial={{ id: hex, units }} />`, units already through `Sh.fromSaved`.

The response is uncached (`dynamic = "force-dynamic"`), so hiding a composition takes effect on the next request.
*Alternative:* render `/c/[id]` as the plain page and fetch on the client. That gives no title or card for link previews and a flash of the stored units first.

### 3. Chime takes `initial` and `notice`
With `initial`, `Chime` server-renders those units (they hydrate as they were rendered, muted). Its mount effect calls `replaceComposition(initial.units)` instead of reading `windchime.units`, so the save effect writes them over the stored units. A `#c=` fragment on a `/c/` address is removed and ignored: the path names the composition. Positions are clamped by the existing `fitted` logic. `notice` shows a one-line `role="status"` message fixed at the top left (same 16 px + safe-area inset as MENU, `z-40`, black on white, 1 px border, a CLOSE text button), dismissed by CLOSE or the first press on a unit. It's a few lines in `Chime.tsx` with the package's `Button`, not a new component.

### 4. The address follows a canonical encoding
`Chime` keeps `shown: { id, code } | null`, where `code = Sh.encode(units)`, the share-link encoding. It already leaves out SOUND, OUTPUT and everything else that is never saved, and holds exactly the fields the API fingerprints. An effect on `units` compares `Sh.encode(units)` with `shown.code`, and on the first difference calls `history.replaceState(null, "", "/")` and clears `shown`. `shown` is set by the `/c/` mount, by loading a row (`openSaved` gets the composition id as well as its records), and by a successful SHARE, each also doing `replaceState` to `/c/<hex>`. A RESET, a `#c=` link or a REMOVE all change the encoding, so they need no code of their own. The stacking order is left out of this comparison (`addressCode` numbers the units by page order), because every press on a unit brings it to the front: tapping SOUND on a unit behind another would otherwise take the address away. SHARE still saves the real stacking order.
*Alternative:* track a "dirty" flag in every `change()` caller. Easy to miss one, and it can't tell a change that was put back.

### 5. SHARE saves through a lazily loaded module and writes the clipboard with a promise
`Compositions.tsx` gains a plain async export, `shareComposition(units, creatorKey): Promise<{ id: string } | { error: string }>`, which runs the same save mutation as SAVE through `commitMutation` on `relayEnvironment()`, with the same `prependSaved` updater, so a list that's already loaded shows the new entry. SHARE imports the module with `import()` on press, so Relay still loads only when needed.

The clipboard write has to start inside the click (Safari drops user activation across an `await`). SHARE therefore calls `navigator.clipboard.write([new ClipboardItem({ "text/plain": textPromise })])` synchronously, where `textPromise` resolves to `origin + "/c/" + hex` on success, or to the `#c=` link on any failure or after a 5 s cap. Safari and Chromium accept a promise in `ClipboardItem`. Where `ClipboardItem` is missing (Firefox before 127), it awaits the save and uses `writeText`, then the existing share-sheet and address-bar fallbacks. The copied origin is `location.origin`, so previews copy preview addresses and production copies `https://chime.dmbk.io`.
*Alternative:* save first, then `writeText`. Fails in Safari after the network round trip.

### 6. Device key: copy the editors' module
`lib/device.ts` is the juno60 editor's `device.ts` (32 random bytes, base64url, `readKey` / `ensureKey` / `useKey`, `KEY_PATTERN`), stored as `windchime.deviceKey` in `localStorage` with the same try/catch as the other `windchime.*` keys. `ensureKey()` is called in the SAVE and SHARE handlers, so a browser that never saves never gets one. The DEVICE KEY section is a native `<details>` under the list, with the editor's copy, the package's `Button` and `TextField`, and text 16 px on iOS like the search field. Keeping the same wording across the four apps is deliberate.

### 7. Compositions list: `yours` and a `creatorKey` filter
`ListQuery` gains `$creatorKey: String` (YOURS) and `$yoursKey: String!` (every row asks `yours(creatorKey: $yoursKey)`; the empty string means no key and is false for every row). ALL / YOURS is a `role="group"` named SHOW with two pressed-state `Button`s, as in the editors. Switching refetches the list with the new variables, and Relay keeps each filter's connection separately. The badge is the package's `Badge` (`YOURS`, title `SAVED FROM THIS DEVICE`).

### 8. API companion change (dmbk-graphql-api `chime-compositions`)
A separate OpenSpec change there, shipped first:
- The save input gains an optional `creatorKey` (43 base64url characters, else `BAD_USER_INPUT`).
- A new document gets `creatorHash = sha256("chime-creator:" + key)` through `$setOnInsert`, so a duplicate save never overwrites an existing owner.
- `creatorHash` is optional in the validator, so stored documents stay valid.
- `ChimeComposition.yours(creatorKey: String!): Boolean!`.
- `dmbkSoundChimeCompositions(creatorKey)` narrows the list to that key's compositions, using an index on `{ creatorHash: 1, _id: -1 }`.
- Fingerprint and title code are untouched.
- The key is never stored or logged.

## Risks / Trade-offs

- [Every SHARE spends a save from the 10-an-hour budget, duplicates included] → SHARE falls back to the `#c=` link silently (the spec wants sharing never to fail), and the fallback is a full composition. If it turns out to bite, raising the budget or exempting duplicates is an API-only change.
- [The public list fills with every shared variation] → Accepted for now (proposal decision). Admin hiding still works. Unlisted shares would be a later API change.
- [Duplicates are global, so sharing someone else's composition copies their address and it isn't marked yours] → Matches the spec (one composition per fingerprint). The YOURS list only shows what this key created.
- [Clipboard promise support differs by browser] → `ClipboardItem` with a promise in Safari and Chromium, `writeText` after the save elsewhere, then the share sheet and address bar, as today.
- [The server render needs the API: a slow API delays `/c/` pages] → The forwarding code's 10 s timeout becomes 4 s for page reads, after which the page renders with `COULD NOT OPEN`.
- [Losing the device key loses YOURS, and anyone with the key sees the same YOURS] → The key only marks and filters compositions (nothing can be changed with it here), and the DEVICE KEY note says so.

## Migration Plan

1. Ship the dmbk-graphql-api change and apply its collection validator (`chime:collection -- --apply`). Older windchime builds keep working, since `creatorKey` is optional.
2. In windchime, run `pnpm schema:pull` and commit the schema, then build (which also runs the Relay compiler). Push to `main` to deploy. `/` keeps working with old `#c=` links, and `/c/<id>` works for every existing composition.
3. Rollback: revert the windchime deploy. Copied `/c/` addresses then 404 at Vercel until it's redeployed, while `#c=` links and the list keep working. The API change stays: an unused optional field.
