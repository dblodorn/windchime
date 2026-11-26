# Tasks

## 1. API companion change (dmbk-graphql-api, ships first)

- [x] 1.1 Open an OpenSpec change in dmbk-graphql-api (`chime-composition-owner`) whose `chime-compositions` delta covers `creatorKey` on save, `creatorHash` (optional, set on insert only), `yours(creatorKey)` and the `creatorKey` list filter; verify `openspec validate --strict` passes for it
- [x] 1.2 Implement it there: input validation (43 base64url chars, else `BAD_USER_INPUT`), `sha256("chime-creator:" + key)` written with `$setOnInsert`, the `yours` field, the list filter with a `{ creatorHash: 1, _id: -1 }` index, the optional `creatorHash` in the collection validator; verify with typecheck and a throwaway-collection test that a duplicate save by key B keeps key A's ownership, fingerprints of existing documents are unchanged, and a key never appears in stored documents or logs
- [x] 1.3 Apply the validator (`npm run chime:collection -- --apply`), deploy, and verify against production that `yours` and `creatorKey` resolve and that a keyless save still works

## 2. Shared server code and schema

- [x] 2.1 Run `pnpm schema:pull` and commit the schema; verify `pnpm relay` still compiles with no errors
- [x] 2.2 Move the forwarding code from `app/api/graphql/route.ts` into `lib/server/api.ts` (`runPersisted(id, variables, { ip, timeoutMs })`) and use it from the route; verify the route still refuses unknown ids and cross-origin posts and forwards a save (Playwright or curl against `pnpm start` with a stub API)
- [x] 2.3 Add `toGlobalId(hex)` / `hexOf(globalId)` and the 24-hex check next to the share code; verify with a Node script that they round-trip and reject `hello`, 23-char and uppercase ids

## 3. Device key

- [x] 3.1 Add `lib/device.ts` (copy of the editors' module, stored as `windchime.deviceKey`, storage access in try/catch); verify in Node with a stubbed `localStorage` that `ensureKey` makes a 43-char key once and `useKey` rejects non-keys

## 4. The `/c/<id>` route

- [x] 4.1 Add `CompositionPageQuery` and `app/c/[id]/page.tsx` (dynamic, `cache()`d fetch with a 4 s timeout, `fromSaved`, `generateMetadata` title `<TITLE> · Chime`); verify `curl` of a real id returns 200 with the units' first render and the title in `<title>`
- [x] 4.2 Add `app/c/[id]/not-found.tsx` rendering `<Chime notice="COMPOSITION NOT FOUND" />`; verify a hidden/missing id and `/c/hello` return 404 with the player, and `/c/hello` makes no API request
- [x] 4.3 Add `app/c/[id]/opengraph-image.tsx` with the title under the head; verify the image renders for a real id and its URL is in the page's `og:image`
- [x] 4.4 Make `Chime` accept `initial` and `notice`: server-render `initial` units, replace stored units on mount, drop a `#c=` fragment on `/c/`, show the dismissable notice; render `COULD NOT OPEN` when the API is down; verify in Playwright that a `/c/` page shows the units muted on OUTPUT 1–2, `windchime.units` becomes them, and with the API stubbed down the stored units stay and the notice shows

## 5. Address follows the composition

- [x] 5.1 Add `shown = { id, code }` and the effect that compares `Sh.encode(units)` and `replaceState`s to `/` on the first difference; set it from the `/c/` mount and from `openSaved` (which now receives the composition id) and `replaceState` to `/c/<hex>`; verify in Playwright: open `/c/<id>`, toggle SOUND and change OUTPUT (address unchanged), change WIND (address becomes `/`), reload (edit kept); load a row (address becomes `/c/<id>`)

## 6. SHARE saves and copies the address

- [x] 6.1 Export `shareComposition(units, creatorKey)` from `Compositions.tsx` (save mutation via `commitMutation`, same `prependSaved` updater); verify typecheck and that `/` loads no Relay chunk until SHARE, SAVE or MENU (network log in Playwright)
- [x] 6.2 Rework SHARE: `ensureKey()`, `SHARING…` while saving, `ClipboardItem` with a promise resolving to `origin/c/<hex>` or the `#c=` link on failure or after 5 s, `writeText` fallback where `ClipboardItem` is missing, then the existing share-sheet / address-bar fallbacks; on success set `shown` and the address; verify in Playwright with the API stubbed: copied text is `/c/<hex>`, sharing twice copies the same address, moving a unit gives a new one, `RATE_LIMITED` and a down API copy a `#c=` link that opens the same units

## 7. COMPOSITIONS: YOURS and DEVICE KEY

- [x] 7.1 SAVE sends `creatorKey` (`ensureKey()` on press); verify the posted variables include it and the units are otherwise byte-for-byte what they were (pinned non-external composition)
- [x] 7.2 Add `$creatorKey` / `$yoursKey` to the list, the `YOURS` badge, and the SHOW group (ALL / YOURS, YOURS disabled without a key); verify in Playwright with the API stubbed that YOURS refetches with `creatorKey`, badges follow `yours`, and a keyless browser has YOURS disabled
- [x] 7.3 Add the DEVICE KEY `<details>` section (note, masked key with SHOW/HIDE and COPY, paste field + USE KEY, messages); verify in Playwright that a bad key is refused and a good one replaces the stored key and the next list request uses it, and that no key appears in copied links or sent units

## 8. Finish

- [x] 8.1 Add the FEATURE changelog line, update CLAUDE.md (route, SHARE flow, device key, `lib/server/api.ts`, address rule) and check COLOPHON needs no new credit; verify `pnpm build` passes
- [x] 8.2 End-to-end on the preview deployment: share from one browser, open the copied `/c/` address in another (units, title, link preview), see it marked YOURS only in the first, and check 390 px and 1280 px layouts have no console errors
