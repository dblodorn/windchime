// The browser's only way to the dmbk GraphQL API (graphql.dmbk.network): POST { id, variables } → the API's answer.
// The API wants this app's key as `x-api-key`, and the key lives only in the server's env (DMBK_GRAPHQL_API_KEY).
// Only operations the Relay compiler persisted from this app's source are forwarded, by id: forwarding query text
// would let anything that can make a same-origin request run any operation the key allows. The visitor's IP goes
// along as `x-end-user-ip`, which keys the API's per-visitor save limit. No cookie or other header is forwarded.
import { persistedText, runPersisted } from "../../../lib/server/api.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const answer = (status: number, body: unknown) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const refuse = (status: number, code: string, message: string, headers: Record<string, string> = {}) =>
  Response.json({ data: null, errors: [{ message, extensions: { code } }] }, { status, headers: { "cache-control": "no-store", ...headers } });

// Browsers send Sec-Fetch-Site on every fetch; Origin against Host is the fallback. A request with neither is
// refused, so the check can't be skipped by leaving headers out.
function isSameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

// Vercel puts the visitor first in x-forwarded-for. The API checks that it is an IP address.
const visitorIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || null;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return refuse(403, "FORBIDDEN", "Cross-origin requests are not accepted.");

  let body: { id?: unknown; variables?: unknown } | null;
  try { body = await req.json(); } catch { body = null; }
  // A body with query text and no id lands here too.
  const id = body && typeof body.id === "string" ? body.id : null;
  if (!id || !persistedText(id)) return refuse(400, "PERSISTED_QUERY_NOT_FOUND", "Unknown operation.");
  const variables = body!.variables && typeof body!.variables === "object" ? body!.variables : {};

  const { status, json, retryAfter } = await runPersisted(id, variables, { ip: visitorIp(req) });
  return retryAfter ? Response.json(json, { status, headers: { "cache-control": "no-store", "retry-after": retryAfter } }) : answer(status, json);
}

export function GET() {
  return refuse(405, "METHOD_NOT_ALLOWED", "Use POST.", { allow: "POST" });
}
