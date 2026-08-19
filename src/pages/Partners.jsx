import {
  NAVY, TEAL, FENNEC, BAND, BODY, MUTED,
  Container, Eyebrow, PrimaryCTA, SecondaryCTA, Header, LandingFooter,
} from "../components/landing/Chrome.jsx";
import PricingCTA from "../components/partners/PricingCTA.jsx";
import { usePageTitle } from "../lib/usePageTitle.js";

// ─── Partners overview page ────────────────────────────────────────────────────
// The real, Route to Retire-branded pitch for the adviser partner program —
// reachable from the footer, not pushed on B2C visitors. Explains the hosted
// (not embedded) model and links through to the Harbour & Vale page as a
// live example, since that page is styled entirely as a fictional firm and
// isn't a fit to land B2C or cold-adviser traffic on directly.

const PARTNER_BENEFITS = [
  "Hosted, branded calculator page",
  "Your colours, logo, and contact details",
  "Result-based call to action",
  "Lead capture after calculator completion",
  "Monthly activity summary",
  "Useful for newsletters, campaigns, and website traffic",
];

export default function Partners() {
  usePageTitle(
    "Partner With Route to Retire",
    "Launch a branded retirement calculator for your firm, hosted and maintained by Route to Retire.",
  );

  return (
    <div className="overflow-x-hidden">
      <Header />

      <section className="pt-16 pb-14 sm:pt-20 sm:pb-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-12 items-center">
            <div>
              <Eyebrow>For financial advisers</Eyebrow>
              <h1 className="font-serif font-bold text-4xl sm:text-5xl mb-5" style={{ color: NAVY, letterSpacing: "-.02em" }}>
                Turn retirement curiosity into better conversations.
              </h1>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: BODY }}>
                We host a branded retirement calculator for your firm — no code or website changes on your end. Send
                clients there from your newsletter, campaigns, or website, and warmer, better-qualified enquiries come
                back to you.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-7">
                {PARTNER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm" style={{ color: BODY }}>
                    <span className="mt-0.5" style={{ color: TEAL }}>✓</span>{b}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-4">
                <PrimaryCTA to="/partners/harbour-vale">See a live example →</PrimaryCTA>
                <SecondaryCTA href="/#get-in-touch">Get in touch</SecondaryCTA>
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ backgroundColor: "white", border: `1px solid ${FENNEC}`, boxShadow: "0 20px 44px -28px rgba(9,50,74,.35)" }}>
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
                <span className="ml-3 text-xs font-medium truncate" style={{ color: MUTED }}>routetoretire.co.uk/partners/yourfirm</span>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "linear-gradient(158deg,#0c3c58,#072839)" }}>
                <div className="flex items-center justify-between mb-4 gap-2">
                  <span className="font-display font-semibold text-[11px] uppercase tracking-widest" style={{ color: "#AED0C9" }}>Branded calculator</span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: "rgba(243,242,234,.7)", border: "1px solid rgba(174,208,201,.3)" }}>Your logo here</span>
                </div>
                <div className="flex items-baseline justify-between mb-2.5">
                  <span className="text-sm" style={{ color: "rgba(243,242,234,.82)" }}>Projected pot</span>
                  <span className="font-serif font-bold text-2xl" style={{ color: "#FFFB08" }}>£287k</span>
                </div>
                <div className="h-1.5 rounded-full relative" style={{ backgroundColor: "rgba(243,242,234,.15)" }}>
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "62%", backgroundColor: "#FFFB08" }} />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <PricingCTA demoFallbackHref="/#get-in-touch" demoFallbackLabel="Get in touch" />

      <section className="py-16 sm:py-20 text-center" style={{ backgroundColor: BAND }}>
        <Container>
          <Eyebrow>See it in action</Eyebrow>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-4" style={{ color: NAVY, letterSpacing: "-.02em" }}>
            See a live example
          </h2>
          <p className="text-[15px] leading-relaxed max-w-xl mx-auto mb-8" style={{ color: BODY }}>
            Harbour &amp; Vale Financial Planning is a fictional firm we built to show exactly what a branded page for
            your firm could look like — try the calculator, the enquiry form, and the numbers an adviser would see.
          </p>
          <PrimaryCTA to="/partners/harbour-vale">View the Harbour &amp; Vale demo →</PrimaryCTA>
        </Container>
      </section>

      <LandingFooter />
    </div>
  );
}
