// ─── Partner funnel tracking (visits, CTA clicks, enquiries submitted) ────────
// Powers the adviser-facing "conversion rate" numbers: visitors → people who
// click "Discuss with [Firm]" → people who actually submit the enquiry form.
// Submission counting fires independently of where the lead itself goes (see
// submitLead in src/lib/partners/leadCapture.js) — a partner can route real
// lead data straight to their own CRM via externalFormEndpoint mode and we'd
// still see none of it, so this is a count-only beacon, never the lead payload
// itself. Same Upstash-via-REST approach as api/pdf-downloads.js.
//
// Requires KV_REST_API_URL and KV_REST_API_TOKEN (see api/pdf-downloads.js for
// where those come from). Until set, GET responds { configured: false }.

import { redis, monthKey } from "./_lib/upstash.js";

const KNOWN_PARTNERS = ["harbour-vale", "simpsonfs", "innes-reid", "acumen", "churchill-wm"];
const EVENTS = ["visit", "cta-click", "enquiry-submitted"];

function keysFor(partner, event) {
  const month = monthKey();
  return {
    all: `engagement:${partner}:${event}:all`,
    month: `engagement:${partner}:${event}:${month}`,
  };
}

export default async function handler(req, res) {
  const partner = req.method === "GET" ? req.query.partner : req.body?.partner;
  if (typeof partner !== "string" || !KNOWN_PARTNERS.includes(partner)) {
    res.status(400).json({ error: "Unknown partner." });
    return;
  }

  const { KV_REST_API_URL: url, KV_REST_API_TOKEN: token } = process.env;
  if (!url || !token) {
    res.status(200).json({ configured: false });
    return;
  }

  const creds = { url, token };

  try {
    if (req.method === "POST") {
      const event = req.body?.event;
      if (!EVENTS.includes(event)) {
        res.status(400).json({ error: "Unknown event." });
        return;
      }
      const { all, month } = keysFor(partner, event);
      await Promise.all([redis(["incr", all], creds), redis(["incr", month], creds)]);
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "GET") {
      const allKeys = EVENTS.map((event) => keysFor(partner, event));
      const values = await redis(["mget", ...allKeys.flatMap((k) => [k.all, k.month])], creds);
      const result = { configured: true };
      EVENTS.forEach((event, i) => {
        const camel = event.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        result[camel] = { allTime: Number(values[i * 2]) || 0, thisMonth: Number(values[i * 2 + 1]) || 0 };
      });
      res.status(200).json(result);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch {
    res.status(502).json({ error: "Tracking store is unavailable." });
  }
}
