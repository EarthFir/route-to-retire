// ─── Partner lead relay: confirm, retry, fall back, alert ──────────────────────
// The browser used to POST a lead straight to a partner's own endpoint
// (Formspree, CRM, Zapier webhook). That meant a silent failure downstream —
// their Zap breaks, their form key expires — showed up nowhere: our
// engagement counter still only increments on a real success (see
// PartnerCalculatorPage.jsx), but nobody would notice a *drop* in enquiries
// until someone asked "we haven't had any leads from that page, is it
// working?". This function is the fix: it owns the actual delivery attempt
// server-side, retries a couple of times, and if delivery genuinely fails,
// emails the partner directly as a fallback and always alerts Route to Retire
// — so a failure is loud instead of silent.
//
// A partner with no endpoint configured (see api/_lib/partners.js) runs in
// mock mode: logged, not sent anywhere — used for the fictional Harbour &
// Vale demo and for real prospects before they've supplied a real endpoint.

import { getPartner } from "./_lib/partners.js";
import { sendEmail } from "./_lib/resend.js";
import { redis } from "./_lib/upstash.js";

const ALERT_EMAIL = process.env.LEAD_ALERT_EMAIL || "hello@routetoretire.co.uk";
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [500, 1500];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatPayload(payload) {
  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

async function attemptDelivery(endpoint, payload) {
  let lastError = "";
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { delivered: true };
      lastError = `Endpoint responded ${res.status}`;
    } catch (err) {
      lastError = err.message || "Network error";
    }
    if (attempt < MAX_ATTEMPTS - 1) await sleep(RETRY_DELAYS_MS[attempt]);
  }
  return { delivered: false, lastError };
}

// Best-effort record in Upstash so a failure is still discoverable even if
// the alert email itself doesn't land. Capped so a run of failures can't
// grow the list unbounded.
async function logFailure(slug, entry) {
  const { KV_REST_API_URL: url, KV_REST_API_TOKEN: token } = process.env;
  if (!url || !token) return;
  const creds = { url, token };
  const key = `lead-failures:${slug}`;
  try {
    await redis(["lpush", key, JSON.stringify(entry)], creds);
    await redis(["ltrim", key, "0", "49"], creds);
  } catch {
    // Nothing more we can do — the alert email is the primary channel.
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { partner: slug, payload } = req.body ?? {};
  const partner = getPartner(slug);
  if (!partner) {
    res.status(400).json({ error: "Unknown partner." });
    return;
  }
  if (!payload || typeof payload !== "object") {
    res.status(400).json({ error: "Missing lead details." });
    return;
  }

  if (!partner.endpoint) {
    console.info(`[lead-submit] mock lead for ${partner.firmName}:`, payload);
    res.status(200).json({ ok: true, via: "mock" });
    return;
  }

  const { delivered, lastError } = await attemptDelivery(partner.endpoint, payload);
  if (delivered) {
    res.status(200).json({ ok: true, via: "direct" });
    return;
  }

  let firmNotified = false;
  if (partner.fallbackEmail) {
    firmNotified = await sendEmail({
      to: partner.fallbackEmail,
      subject: `New enquiry (delivery fallback) — ${partner.firmName}`,
      text: `This lead couldn't be delivered to your usual system automatically (${lastError}). Details below:\n\n${formatPayload(payload)}`,
    })
      .then(() => true)
      .catch(() => false);
  }

  await sendEmail({
    to: ALERT_EMAIL,
    subject: `Lead delivery failed — ${partner.firmName}`,
    text: `A lead for ${partner.firmName} (${slug}) failed to reach their endpoint after ${MAX_ATTEMPTS} attempts.\n\nLast error: ${lastError}\nFallback email to partner: ${firmNotified ? "sent" : "not sent (none configured, or it also failed)"}\n\nLead details:\n${formatPayload(payload)}`,
  }).catch(() => {});

  await logFailure(slug, { at: new Date().toISOString(), error: lastError, firmNotified, payload });

  if (firmNotified) {
    res.status(200).json({ ok: true, via: "fallback-email" });
  } else {
    res.status(502).json({ ok: false, error: "We couldn't deliver your details right now. Please try again shortly." });
  }
}
