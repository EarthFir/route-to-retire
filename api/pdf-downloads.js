// ─── PDF export tracking (partner dashboard "PDF exports" metric) ─────────────
// PDF generation itself is entirely client-side (see src/lib/pdfDownload.js),
// so this is the only server call in that flow — a small beacon fired after a
// successful download, purely so the partner dashboard can show a real count
// instead of "not tracked". POST increments a partner's counters; GET reads
// them back. Backed by Upstash Redis via its REST API (no new npm dependency,
// same fetch-only approach as api/subscribe.js).
//
// Requires KV_REST_API_URL and KV_REST_API_TOKEN — set automatically when you
// connect an "Upstash for Redis" store to this Vercel project under Storage;
// add the same two to .env.local for local testing. Until those are set, GET
// responds { configured: false } rather than a fabricated number.

import { redis, monthKey } from "./_lib/upstash.js";

const KNOWN_PARTNERS = ["harbour-vale", "simpsonfs", "innes-reid", "acumen", "churchill-wm", "hartsfield", "howard-wright"];

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
  const allKey = `pdf-exports:${partner}:all`;
  const monthKeyName = `pdf-exports:${partner}:${monthKey()}`;

  try {
    if (req.method === "POST") {
      await Promise.all([redis(["incr", allKey], creds), redis(["incr", monthKeyName], creds)]);
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "GET") {
      const [allTime, thisMonth] = await redis(["mget", allKey, monthKeyName], creds);
      res.status(200).json({ configured: true, allTime: Number(allTime) || 0, thisMonth: Number(thisMonth) || 0 });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch {
    res.status(502).json({ error: "Tracking store is unavailable." });
  }
}
