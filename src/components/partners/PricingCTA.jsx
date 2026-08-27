import BookDemoButton from "./BookDemoButton.jsx";

// ─── Partner program pricing card ─────────────────────────────────────────────
// A single SaaS-style pricing card selling the partner program itself — this
// is Route to Retire's own pitch to the adviser, not part of any fictional
// partner branding, so it stays on the site's own palette, styled dark like
// the calculator's own "Your Projection" results card. The standard rate is
// shown struck through against the early-adopter offer so it's clear this is
// an introductory price, not the only one that'll ever exist. Shared between
// the real /partners overview page and the Harbour & Vale demo, so it only
// needs to be written once.
const PILOT_FEATURES = [
  "Branded calculator page for your firm",
  "Custom colours, logo, and contact details",
  "Preloaded retirement scenarios for newsletters and campaigns",
  "Lead capture form routed to your inbox or CRM",
  "Monthly activity summary",
  "Hosted and maintained by Route to Retire",
  "Compliance-friendly assumptions and disclaimer copy",
];

export default function PricingCTA({ demoFallbackHref, demoFallbackLabel }) {
  return (
    <section className="py-16 px-4" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="text-center max-w-lg mx-auto mb-10 space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#09324A", fontFamily: "'Source Serif 4', serif" }}>
          Launch your own branded retirement calculator
        </h2>
        <p className="text-sm" style={{ color: "#8a9599" }}>
          Early partners lock in this rate for as long as they stay on it.
        </p>
      </div>

      <div
        className="relative rounded-[28px] p-7 sm:p-8 max-w-sm mx-auto overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#0c4060 0%,#09324A 46%,#061f2e 100%)",
          border: "1px solid rgba(255,255,255,.10)",
          boxShadow: "0 30px 70px -40px rgba(6,31,46,.7), inset 0 1px 0 rgba(255,255,255,.16)",
        }}
      >
        <div className="relative mb-5">
          <div className="inline-flex font-display font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(255,251,8,.14)", color: "#FFFB08" }}>
            Founding Partner Offer
          </div>
        </div>

        <div className="relative mb-6">
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif font-bold text-3xl" style={{ color: "#FFFB08" }}>£149<span className="text-base font-sans font-medium">/mo</span></span>
          </div>
          <div className="text-xs mt-1.5" style={{ color: "rgba(243,242,234,.55)" }}>First 30 days free</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(243,242,234,.55)" }}>
            Setup fee waived <span className="line-through">£199</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(243,242,234,.55)" }}>No minimum term — cancel any time</div>
        </div>

        <ul className="relative space-y-2 mb-6">
          {PILOT_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: "rgba(243,242,234,.85)" }}>
              <span className="shrink-0" style={{ color: "#AED0C9" }}>✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <BookDemoButton
          className="relative w-full flex items-center justify-center gap-2 font-semibold text-sm sm:text-base rounded-full px-6 py-3.5 hover:opacity-90 transition font-display"
          style={{ backgroundColor: "#FFFB08", color: "#09324A" }}
          fallbackHref={demoFallbackHref}
          fallbackLabel={demoFallbackLabel}
        />
      </div>
    </section>
  );
}
