// The Relay environment for the dmbk GraphQL API. Operations go to /api/graphql by persisted id, never as query
// text; that route forwards only ids the Relay compiler wrote from this app's source and adds the API key
// (app/api/graphql/route.js). Browser-only: created lazily from a client component.
import { Environment, Network, RecordSource, Store } from "relay-runtime";

// An error from the API (or the route), with its `extensions.code`.
export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function fetchOperation(params, variables) {
  if (!params.id) throw new Error(`Operation ${params.name} was not persisted. Run \`pnpm relay\`.`);
  let res;
  try {
    res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id: params.id, variables }),
    });
  } catch {
    throw new ApiError("API_UNAVAILABLE", "The dmbk API could not be reached.");
  }
  let body;
  try { body = await res.json(); } catch { throw new ApiError("API_UNAVAILABLE", `The dmbk API answered ${res.status} with no JSON.`); }
  // Raised with the API's code rather than handed to Relay, which would only report a nulled payload.
  const first = body.errors?.[0];
  if (first) throw new ApiError(first.extensions?.code ?? "INTERNAL_SERVER_ERROR", first.message);
  return body;
}

export function createRelayEnvironment() {
  return new Environment({ network: Network.create(fetchOperation), store: new Store(new RecordSource()) });
}
