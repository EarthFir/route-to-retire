import { Link } from "../../lib/Link.jsx";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Unbranded content page shell ──────────────────────────────────────────────
// Same visual language as ContentPage.jsx (soft grey backdrop, white rounded
// card) but with every Route to Retire mention/link stripped out — no RTR
// wordmark header, no "back to the calculator" link into RTR's own /check,
// no SiteFooter. Used by the three shared /partners/* legal pages
// (PartnerMethodology, PartnerDisclaimer, PartnerPrivacy), which read the
// same regardless of which white-label partner's calculator linked here, so
// one set of pages covers every current and future partner.

export function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold font-serif" style={{ color: "#09324A" }}>{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: "#4a5a5f" }}>{children}</div>
    </section>
  );
}

export default function PartnerContentPage({ title, intro, children }) {
  usePageTitle(title, intro);

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: "#F3F2EA" }}>
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-2xl font-bold tracking-tight font-serif" style={{ color: "#09324A" }}>{title}</h1>
          {intro && <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: "#8a9599" }}>{intro}</p>}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-6" style={{ borderColor: "#DAD7C8", borderWidth: "1px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          {children}
        </div>

        <footer className="mt-8 pt-6 pb-8 text-center" style={{ borderTop: "1px solid #DAD7C8" }}>
          <nav className="flex items-center justify-center gap-4 text-xs font-medium flex-wrap">
            <Link to="/partners/methodology" style={{ color: "#1B6F81" }}>Methodology</Link>
            <span style={{ color: "#DAD7C8" }}>·</span>
            <Link to="/partners/disclaimer" style={{ color: "#1B6F81" }}>Disclaimer</Link>
            <span style={{ color: "#DAD7C8" }}>·</span>
            <Link to="/partners/privacy" style={{ color: "#1B6F81" }}>Privacy</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
