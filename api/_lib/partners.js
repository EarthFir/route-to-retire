// ─── Server-side partner lead-delivery registry ────────────────────────────────
// Where each partner's real lead endpoint (and optional fallback inbox) lives
// once wired up. Deliberately not exposed to the client — endpoints used to be
// baked into the bundle via VITE_*_LEAD_ENDPOINT, which meant the browser was
// trusted to hit the right URL and there was no way to retry, confirm, or fall
// back on failure. See api/lead-submit.js, which is the only thing that reads
// this file.
//
// No endpoint configured for a partner => that partner runs in mock mode
// (lead-submit.js logs it and returns ok without a network call).

const PARTNERS = {
  "harbour-vale": {
    firmName: "Harbour & Vale Financial Planning",
    endpoint: process.env.HARBOUR_VALE_LEAD_ENDPOINT || "",
    fallbackEmail: process.env.HARBOUR_VALE_FALLBACK_EMAIL || "",
  },
  simpsonfs: {
    firmName: "Simpson Financial Services",
    endpoint: process.env.SIMPSONFS_LEAD_ENDPOINT || "",
    fallbackEmail: process.env.SIMPSONFS_FALLBACK_EMAIL || "",
  },
  "innes-reid": {
    firmName: "Innes Reid",
    endpoint: process.env.INNES_REID_LEAD_ENDPOINT || "",
    fallbackEmail: process.env.INNES_REID_FALLBACK_EMAIL || "",
  },
  acumen: {
    firmName: "Acumen Financial Planning",
    endpoint: process.env.ACUMEN_LEAD_ENDPOINT || "",
    fallbackEmail: process.env.ACUMEN_FALLBACK_EMAIL || "",
  },
  "churchill-wm": {
    firmName: "Churchill Wealth Management",
    endpoint: process.env.CHURCHILL_WM_LEAD_ENDPOINT || "",
    fallbackEmail: process.env.CHURCHILL_WM_FALLBACK_EMAIL || "",
  },
};

export function getPartner(slug) {
  return PARTNERS[slug];
}
