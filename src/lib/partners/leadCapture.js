// ─── Lead capture adapter ──────────────────────────────────────────────────────
// The browser never talks to a partner's endpoint directly — it posts to our
// own api/lead-submit.js, which owns the real delivery attempt: retries a
// couple of times, and if that genuinely fails, emails the partner as a
// fallback and always alerts Route to Retire. That relay is also what decides
// mock vs. real delivery per partner (see api/_lib/partners.js) — the client
// doesn't need to know which mode a partner is in.

export async function submitLead(config, payload) {
  const res = await fetch("/api/lead-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partner: config.slug, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Something went wrong sending your details. Please try again.");
  }
  return data;
}
