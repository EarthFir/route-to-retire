import { createHash } from "node:crypto";

// ─── Pro waitlist → Mailchimp ─────────────────────────────────────────────────
// Vercel serverless function. Keeps the Mailchimp API key server-side; the
// frontend (src/pages/Pro.jsx) just POSTs { email, message } here.
//
// Requires these env vars to be set in the Vercel project (and a local
// .env.local for `vercel dev`): MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX
// (e.g. "us21", the suffix after the "-" in the API key), MAILCHIMP_AUDIENCE_ID.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email } = req.body ?? {};
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }

  const { MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID } = process.env;
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) {
    res.status(500).json({ error: "Mailchimp is not configured yet." });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const subscriberHash = createHash("md5").update(normalizedEmail).digest("hex");
  const authHeader = `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64")}`;
  const base = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}`;

  const memberRes = await fetch(`${base}/members/${subscriberHash}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({
      email_address: normalizedEmail,
      status_if_new: "subscribed",
    }),
  });

  if (!memberRes.ok) {
    const detail = await memberRes.json().catch(() => ({}));
    res.status(502).json({ error: detail.detail || "Mailchimp couldn't process that request." });
    return;
  }

  // Tag separately — the members PUT endpoint doesn't accept tags directly.
  await fetch(`${base}/members/${subscriberHash}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({ tags: [{ name: "pro-waitlist", status: "active" }] }),
  }).catch(() => {});

  res.status(200).json({ ok: true });
}
