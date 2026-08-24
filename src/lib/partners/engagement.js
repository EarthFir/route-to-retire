// ─── Client-side funnel beacon ─────────────────────────────────────────────────
// Fire-and-forget POST to api/engagement.js. Never awaited by callers and never
// throws — a tracking failure must not affect the visitor's experience (the
// page has already loaded, the click already scrolled, the lead already sent).

export function trackEngagement(partnerSlug, event) {
  fetch("/api/engagement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partner: partnerSlug, event }),
  }).catch(() => {});
}

// Visits are deduped to once per browser per day (via localStorage) so the
// conversion-rate math (enquiries ÷ visits) isn't skewed by page reloads or
// repeat testing — an approximation of unique visitors, not exact, but close
// enough without adding accounts or cookies.
export function trackVisit(partnerSlug) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const key = `rtr-visit-${partnerSlug}-${today}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall through and
    // track anyway rather than silently dropping the visit.
  }
  trackEngagement(partnerSlug, "visit");
}
