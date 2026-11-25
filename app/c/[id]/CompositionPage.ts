// Server-only: one saved composition by its 24-hex id, for /c/[id] (its page, title and card), through the API with
// this app's key (lib/server/api.ts). React's cache() lets the page, its metadata and its image share one request.
import { cache } from "react";
import { graphql, type ConcreteRequest } from "relay-runtime";
import { runPersisted } from "../../../lib/server/api.ts";
import * as Sh from "../../../lib/share.ts";
import type { CompositionPageQuery$data } from "./__generated__/CompositionPageQuery.graphql";

const Query = graphql`
  query CompositionPageQuery($id: ID!) {
    node(id: $id) {
      __typename
      ... on ChimeComposition {
        title
        units { instrument volume tubes wind decay cutoff resonance root scale voice patch channel midiMode notes x y rank }
      }
    }
  }
`;

export type Loaded =
  | { kind: "found"; id: string; title: string; units: Sh.UnitFields[] }
  | { kind: "missing" } // malformed id, hidden or missing: a 404
  | { kind: "error" }; // the API couldn't be reached, or sent units this build can't open

export const loadComposition = cache(async (id: string): Promise<Loaded> => {
  if (!Sh.COMPOSITION_ID.test(id)) return { kind: "missing" };
  const persisted = (Query as ConcreteRequest).params.id; // the compiler's persisted id, as the browser posts it
  if (!persisted) throw new Error("CompositionPageQuery is not persisted.");
  // reads aren't rate-limited, so no visitor IP; a slow API shouldn't hold the page long
  const { status, json } = await runPersisted(persisted, { id: Sh.compositionGlobalId(id) }, { timeoutMs: 4000 });
  const body = json as { data?: CompositionPageQuery$data | null; errors?: unknown[] } | null;
  if (status !== 200 || !body?.data || body.errors?.length) return { kind: "error" };
  const node = body.data.node;
  if (!node || node.__typename !== "ChimeComposition") return { kind: "missing" };
  const units = Sh.fromSaved(node.units);
  return units ? { kind: "found", id, title: node.title, units } : { kind: "error" };
});
