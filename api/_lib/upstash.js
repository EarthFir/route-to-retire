// ─── Shared Upstash Redis REST helper ──────────────────────────────────────────
// Plain fetch() against Upstash's REST API — no @upstash/redis dependency,
// same approach as the rest of this codebase's server calls (api/subscribe.js).
// Used by any api/*.js function that needs partner-scoped counters.

export function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7); // YYYY-MM (UTC)
}

export async function redis(pathSegments, { url, token }) {
  const res = await fetch(`${url}/${pathSegments.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Upstash command failed: ${res.status}`);
  return (await res.json()).result;
}
