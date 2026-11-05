// The browser's only way to the dmbk GraphQL API (graphql.dmbk.network): POST { id, variables } → the API's answer.
// The API wants this app's key as `x-api-key`, and the key lives only in the server's env (DMBK_GRAPHQL_API_KEY).
// Only operations the Relay compiler persisted from this app's source are forwarded, by id: forwarding query text
// would let anything that can make a same-origin request run any operation the key allows. The visitor's IP goes
// along as `x-end-user-ip`, which keys the API's per-visitor save limit. No cookie or other header is forwarded.
import persistedOperations from "../../../lib/server/persisted-operations.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPERATIONS = persistedOperations;
const API_URL = process.env.DMBK_GRAPHQL_API_URL || "https://graphql.dmbk.network/graphql";

const answer = (status, body) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const refuse = (status, code, message, headers = {}) =>
  Response.json({ data: null, errors: [{ message, extensions: { code } }] }, { status, headers: { "cache-control": "no-store", ...headers } });

// Browsers send Sec-Fetch-Site on every fetch; Origin against Host is the fallback. A request with neither is
// refused, so the check can't be skipped by leaving headers out.
function isSameOrigin(req) {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

// Vercel puts the visitor first in x-forwarded-for. The API checks that it is an IP address.
const visitorIp = req => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || null;

export async function POST(req) {
  if (!isSameOrigin(req)) return refuse(403, "FORBIDDEN", "Cross-origin requests are not accepted.");

  let body;
  try { body = await req.json(); } catch { body = null; }
  // hasOwn, so an id like "constructor" can't reach the prototype. A body with query text and no id lands here too.
  const id = body && typeof body.id === "string" ? body.id : null;
  const query = id && Object.hasOwn(OPERATIONS, id) ? OPERATIONS[id] : undefined;
  if (!query) return refuse(400, "PERSISTED_QUERY_NOT_FOUND", "Unknown operation.");
  const variables = body.variables && typeof body.variables === "object" ? body.variables : {};

  const key = process.env.DMBK_GRAPHQL_API_KEY;
  if (!key && process.env.NODE_ENV === "production") throw new Error("DMBK_GRAPHQL_API_KEY is not set.");
  const ip = visitorIp(req);

  let res;
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
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("[graphql-proxy]", err);
    return refuse(502, "API_UNAVAILABLE", "The dmbk API could not be reached.");
  }
  let json;
  try { json = await res.json(); } catch { return refuse(502, "API_UNAVAILABLE", `The dmbk API answered ${res.status} with no JSON.`); }
  const retry = res.headers.get("retry-after");
  return retry ? Response.json(json, { status: res.status, headers: { "cache-control": "no-store", "retry-after": retry } }) : answer(res.status, json);
}

export function GET() {
  return refuse(405, "METHOD_NOT_ALLOWED", "Use POST.", { allow: "POST" });
}
