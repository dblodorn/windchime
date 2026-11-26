# Proposal

## Why

A saved composition can only be reached by scrolling the COMPOSITIONS list, and SHARE makes a long `#c=` link that stands for nothing kept anywhere. Giving every saved composition its own address (`chime.dmbk.io/c/<id>`) makes compositions linkable things, and having SHARE save before it copies means every shared composition joins the library once, with its own route, instead of living only in a fragment.

Whoever saved or shared a composition should be able to find their own again without an account. The dx7, vz10m and juno60 editors already solve that with a device key and a YOURS filter; Chime should work the same way, with the key's hash stored on each composition in the compositions database.

## What Changes

- **Composition route**: `/c/<id>` (the composition's 24-hex id) opens that saved composition in the player, the same way a row in COMPOSITIONS does, and shows its title. A hidden, missing or malformed id shows that the composition could not be found and leaves the page usable with the browser's saved units.
- **SHARE saves, then copies the route**: SHARE saves the current units through the API and copies `https://chime.dmbk.io/c/<id>`. Units bit-identical to a stored composition (same fingerprint, which includes positions and stacking) get that composition's id back and nothing new is stored, so sharing the same thing twice gives the same link. If the save fails (rate limit, network, API down), SHARE falls back to today's `#c=` link so sharing never stops working.
- **Device key and YOURS**: the first save or share makes a device key (32 random bytes, base64url, in `localStorage`), as the synth editors do. Every save and share sends it as `creatorKey`. COMPOSITIONS gains ALL / YOURS (YOURS lists compositions saved with this browser's key), a YOURS badge on rows saved from this device, and a DEVICE KEY section to show, copy or paste in a key from another browser.
- **Old links keep working**: `#c=` links (format version 2) are still read, unchanged.
- **API (companion change in dmbk-graphql-api, `chime-compositions`)**: saves take an optional `creatorKey`; a new composition stores `creatorHash` = `sha256("chime-creator:" + key)` (never the key); `ChimeComposition.yours(creatorKey)`; `dmbkSoundChimeCompositions(creatorKey)` narrows the list to one key's compositions. Duplicates stay global (one composition per fingerprint): a duplicate save returns the stored composition and does not change who owns it. Compositions stored before this have no owner and are nobody's. Nothing about deleting changes (compositions still can't be deleted through the API).

## Capabilities

### New Capabilities
- `composition-routes`: the `/c/<id>` route: loading a saved composition by id, its title on the page, and what a hidden, missing or malformed id shows.

### Modified Capabilities
- `share-links`: SHARE saves the composition and copies its route; the `#c=` link becomes the fallback when the save fails; reading `#c=` links is unchanged.
- `saved-compositions`: saves carry the device key; the panel gains ALL / YOURS, the YOURS badge and the DEVICE KEY section.

## Impact

- **windchime**: a new `app/c/[id]/` route (server-rendered title and share card, the player itself still the client `Chime`); `components/Chime.tsx` (SHARE flow, loading a composition by id); `components/Compositions.tsx` (filter, badge, device key; Relay operations gain `creatorKey` / `yours`); a new `lib/device.ts`; `lib/share.ts` unchanged except where SHARE calls it for the fallback; `schemas/dmbk-graphql-api.graphql` re-pulled; the persisted-operations allowlist gains the new operations.
- **dmbk-graphql-api**: `chime-compositions` spec, model, validator (`creatorHash` optional, so stored documents stay valid), resolvers and the save mutation. It must ship before windchime uses `creatorKey`.
- **Rate limits**: each SHARE now takes from the visitor's save budget (10 an hour, duplicates included). Past it, SHARE copies a `#c=` link instead.
- **Public list**: compositions made by SHARE are listed in COMPOSITIONS like saved ones.
- **Changelog**: one FEATURE entry.
