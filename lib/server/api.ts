// Server-only: runs one persisted operation against the dmbk GraphQL API (graphql.dmbk.network) with this app's key.
// The key lives only in the server's env (DMBK_GRAPHQL_API_KEY). Used by app/api/graphql/route.ts (the browser's
// proxy) and by the /c/[id] page, so this is the one place that holds the key, the URL and the error mapping.
import persistedOperations from "./persisted-operations.json";

// persisted id → operation text
const OPERATIONS: Record<string, string> = persistedOperations;
const API_URL = process.env.DMBK_GRAPHQL_API_URL || "https://graphql.dmbk.network/graphql";

/** The text of a persisted operation, or undefined. hasOwn, so an id like "constructor" can't reach the prototype. */
export const persistedText = (id: string): string | undefined => (Object.hasOwn(OPERATIONS, id) ? OPERATIONS[id] : undefined);

export interface ApiAnswer { status: number; json: unknown; retryAfter: string | null }

/** The API's answer, or a GraphQL error with code API_UNAVAILABLE (status 502) when it can't be reached or read. */
export async function runPersisted(
  id: string,
  variables: unknown,
  { ip = null, timeoutMs = 10_000 }: { ip?: string | null; timeoutMs?: number } = {},
): Promise<ApiAnswer> {
  const query = persistedText(id);
  if (!query) throw new Error(`Unknown persisted operation ${id}.`);
  const key = process.env.DMBK_GRAPHQL_API_KEY;
  if (!key && process.env.NODE_ENV === "production") throw new Error("DMBK_GRAPHQL_API_KEY is not set.");

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(key ? { "x-api-key": key } : {}),
        ...(ip ? { "x-end-user-ip": ip } : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    console.error("[dmbk-api]", err);
    return unavailable("The dmbk API could not be reached.");
  }
  try {
    return { status: res.status, json: await res.json(), retryAfter: res.headers.get("retry-after") };
  } catch {
    return unavailable(`The dmbk API answered ${res.status} with no JSON.`);
  }
}

const unavailable = (message: string): ApiAnswer =>
  ({ status: 502, json: { data: null, errors: [{ message, extensions: { code: "API_UNAVAILABLE" } }] }, retryAfter: null });
