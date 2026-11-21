// An external synth's shared patches, fetched from its dmbk library by id (openspec/specs/external-synths). Imported
// with a dynamic import() from components/Chime.tsx, so Relay and every request stay off the page until a unit
// has a shared patch. One fetch per patch per visit, shared between units; names come with the bytes.
import { fetchQuery, graphql } from "relay-runtime";
import { relayEnvironment } from "./relay/environment";
import type { ExternalSynth } from "./synths";
import type { patchesQuery } from "./__generated__/patchesQuery.graphql";

// Any synth's patch, through the SynthPatch interface every library type implements
const PatchQuery = graphql`
  query patchesQuery($id: ID!) {
    node(id: $id) {
      ... on SynthPatch { name data }
    }
  }
`;

export interface Patch { name: string; bytes: Uint8Array }

const fetched = new Map<string, Promise<Patch | null>>();
const names = new Map<string, string>();
const key = (synth: ExternalSynth, id: string) => `${synth.id}:${id}`;
// the API's global id: base64 of "<Type>:<id>" (Pothos)
const globalId = (synth: ExternalSynth, id: string) => btoa(`${synth.patchType}:${id}`);

// The patch, or null when the library says it's not there (deleted or hidden). A failed request rejects and is
// forgotten, so the next call tries again.
export function getPatch(synth: ExternalSynth, id: string): Promise<Patch | null> {
  const k = key(synth, id);
  let p = fetched.get(k);
  if (!p) {
    p = fetchQuery<patchesQuery>(relayEnvironment(), PatchQuery, { id: globalId(synth, id) }, { fetchPolicy: "store-or-network" })
      .toPromise()
      .then(res => {
        const node = res?.node;
        if (!node || node.data === undefined || node.name === undefined) return null;
        const bytes = Uint8Array.from(atob(node.data), c => c.charCodeAt(0));
        if (bytes.length !== synth.patchBytes) return null;
        names.set(k, node.name.trim());
        return { name: node.name.trim(), bytes };
      });
    p.catch(() => fetched.delete(k));
    fetched.set(k, p);
  }
  return p;
}

// a name already known (fetched, or remembered when it was picked from the list), else undefined
export const knownName = (synth: ExternalSynth, id: string) => names.get(key(synth, id));
export const rememberName = (synth: ExternalSynth, id: string, name: string) => { names.set(key(synth, id), name.trim()); };
