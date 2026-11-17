// The Relay environment for the dmbk GraphQL API. Operations go to /api/graphql by persisted id, never as query
// text; that route forwards only ids the Relay compiler wrote from this app's source and adds the API key
// (app/api/graphql/route.ts). Browser-only: created lazily from a client component.
import { Environment, Network, RecordSource, Store } from "relay-runtime";
import type { GraphQLResponse, RequestParameters, Variables } from "relay-runtime";

// An error from the API (or the route), with its `extensions.code`.
export class ApiError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function fetchOperation(params: RequestParameters, variables: Variables): Promise<GraphQLResponse> {
  if (!params.id) throw new Error(`Operation ${params.name} was not persisted. Run \`pnpm relay\`.`);
  let res: Response;
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
  // the API's answer: data and/or errors carrying an extensions.code
  let body: { data?: unknown; errors?: { message: string; extensions?: { code?: string } }[] };
  try { body = await res.json(); } catch { throw new ApiError("API_UNAVAILABLE", `The dmbk API answered ${res.status} with no JSON.`); }
  // Raised with the API's code rather than handed to Relay, which would only report a nulled payload.
  const first = body.errors?.[0];
  if (first) throw new ApiError(first.extensions?.code ?? "INTERNAL_SERVER_ERROR", first.message);
  return body as GraphQLResponse;
}

export function createRelayEnvironment() {
  return new Environment({ network: Network.create(fetchOperation), store: new Store(new RecordSource()) });
}
