import { Link } from "../lib/Link.jsx";
import SiteFooter from "./SiteFooter.jsx";
import { usePageTitle } from "../lib/usePageTitle.js";

// ─── Content Page Shell ───────────────────────────────────────────────────────
// Shared layout for the informational pages (methodology, disclaimer, privacy).
// Keeps the calculator's visual language: soft grey backdrop, yellow branding,
// a single white rounded card for the body copy.

export function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold font-serif" style={{ color: '#09324A' }}>{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: '#4a5a5f' }}>{children}</div>
    </section>
  );
}

export default function ContentPage({ title, intro, children }) {
  usePageTitle(title ? `${title} - Route to Retire` : undefined, intro);

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: '#F3F2EA' }}>
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tight inline-block font-serif" style={{ color: '#09324A' }}>
            Route to Retire
          </Link>
          <h1 className="text-2xl font-bold tracking-tight font-serif" style={{ color: '#09324A' }}>{title}</h1>
          {intro && <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: '#8a9599' }}>{intro}</p>}
          <div>
            <Link to="/check" className="text-xs font-medium" style={{ color: '#1B6F81' }}>← Back to the calculator</Link>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-6" style={{ borderColor: '#DAD7C8', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {children}
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
