// ─── Private partner stats (visits, CTA clicks, enquiries, PDF exports) ───────
// Powers the key-gated dashboard at /partners/:slug/stats. Combines the
// engagement counters (api/engagement.js) and PDF export counter
// (api/pdf-downloads.js) into one response, reading the same Redis keys those
// two already write — no new tracking, just a private read of it.
//
// Read access requires a per-partner secret (STATS_KEY_HARBOUR_VALE,
// STATS_KEY_SIMPSONFS, ...) as a ?key= query param, since these numbers,
// while not sensitive, shouldn't be viewable by anyone who guesses the URL.
// Tracking itself (the POST beacons in the other two files) stays open to
// anonymous visitors, who never have a key.

import { redis, monthKey } from "./_lib/upstash.js";

const STATS_KEY_ENV = {
  "harbour-vale": "STATS_KEY_HARBOUR_VALE",
  simpsonfs: "STATS_KEY_SIMPSONFS",
  "innes-reid": "STATS_KEY_INNES_REID",
  acumen: "STATS_KEY_ACUMEN",
  "churchill-wm": "STATS_KEY_CHURCHILL_WM",
};
const EVENTS = ["visit", "cta-click", "enquiry-submitted"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const partner = req.query.partner;
  const envName = typeof partner === "string" ? STATS_KEY_ENV[partner] : undefined;
  if (!envName) {
    res.status(400).json({ error: "Unknown partner." });
    return;
  }

  const expectedKey = process.env[envName];
  if (!expectedKey || req.query.key !== expectedKey) {
    res.status(401).json({ error: "Invalid or missing key." });
    return;
  }

  const { KV_REST_API_URL: url, KV_REST_API_TOKEN: token } = process.env;
  if (!url || !token) {
    res.status(200).json({ configured: false });
    return;
  }

  const creds = { url, token };
  const month = monthKey();

  try {
    const engagementKeys = EVENTS.flatMap((event) => [
      `engagement:${partner}:${event}:all`,
      `engagement:${partner}:${event}:${month}`,
    ]);
    const pdfKeys = [`pdf-exports:${partner}:all`, `pdf-exports:${partner}:${month}`];
    const values = await redis(["mget", ...engagementKeys, ...pdfKeys], creds);

    const result = { configured: true };
    EVENTS.forEach((event, i) => {
      const camel = event.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      result[camel] = { allTime: Number(values[i * 2]) || 0, thisMonth: Number(values[i * 2 + 1]) || 0 };
    });
    const pdfOffset = EVENTS.length * 2;
    result.pdfExports = { allTime: Number(values[pdfOffset]) || 0, thisMonth: Number(values[pdfOffset + 1]) || 0 };

    res.status(200).json(result);
  } catch {
    res.status(502).json({ error: "Tracking store is unavailable." });
  }
}
