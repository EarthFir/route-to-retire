// ─── Resend transactional email helper ─────────────────────────────────────────
// Used by api/lead-submit.js for the two "someone needs to know now" cases in
// lead delivery: notifying a partner directly if their configured endpoint is
// down, and alerting Route to Retire so a failure is never silent. Plain
// fetch, no SDK — same minimal-dependency approach as api/subscribe.js's
// Mailchimp calls.
//
// Requires RESEND_API_KEY and RESEND_FROM_EMAIL (a sender verified in your
// Resend account — resend.com/domains). Until a custom domain is verified,
// Resend's shared sandbox sender can only deliver to the account's own
// sign-up address, which covers the alert-to-us path but not fallback emails
// to a partner.

export async function sendEmail({ to, subject, text }) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new Error("Resend is not configured.");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: RESEND_FROM_EMAIL, to, subject, text }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.message || `Resend responded ${res.status}`);
  }
}
