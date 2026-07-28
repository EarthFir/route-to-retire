import { Link } from "../lib/Link.jsx";
import SiteFooter from "./SiteFooter.jsx";

// ─── Content Page Shell ───────────────────────────────────────────────────────
// Shared layout for the informational pages (methodology, disclaimer, privacy).
// Keeps the calculator's visual language: soft grey backdrop, yellow branding,
// a single white rounded card for the body copy.

export function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold" style={{ color: '#2B2B2B' }}>{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: '#666666' }}>{children}</div>
    </section>
  );
}

export default function ContentPage({ title, intro, children }) {
  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: '#F5F6F8' }}>
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <Link to="/" className="text-3xl font-bold tracking-tight inline-block" style={{ color: '#F4C84A' }}>
            Route to Retire
          </Link>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#2B2B2B' }}>{title}</h1>
          {intro && <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: '#A0A4AB' }}>{intro}</p>}
          <div>
            <Link to="/" className="text-xs font-medium" style={{ color: '#B8860B' }}>← Back to the calculator</Link>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-6" style={{ borderColor: '#E6E8EC', borderWidth: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {children}
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
