import {
  NAVY, TEAL, FENNEC, BAND, BODY, MUTED,
  Container, Eyebrow, IconCircle, PrimaryCTA, Header, LandingFooter,
} from "../components/landing/Chrome.jsx";
import BookDemoButton from "../components/partners/BookDemoButton.jsx";
import { usePageTitle } from "../lib/usePageTitle.js";

// ─── Partners overview page ────────────────────────────────────────────────────
// The real, Route to Retire-branded pitch for the adviser partner program —
// reachable from the footer, not pushed on B2C visitors. CTA hierarchy is
// deliberate: the hero leads with the single primary "See your branded
// calculator" action (-> /partners/preview); the closing section is the
// secondary "Contact us" fallback for anyone who wants to talk it through
// instead. Ordered to answer, in sequence, the three things a sceptical
// adviser is actually thinking: will this produce enquiries (ROI block),
// will compliance let me (moved up, right after ROI), and is this still
// going to exist in six months (founding offer + demo).

const VALUE_LEGS = [
  {
    title: "Your website tells people about you. This finds out about them.",
    copy: "A brochure page lets a visitor read and leave, and the firm never knows they were there. A calculator turns an anonymous visitor into a named enquiry.",
  },
  {
    title: "It gives you something to send.",
    copy: "Most small firms have a newsletter, a website and nothing interesting to put in either. A branded calculator is an evergreen answer to “what do I send the list this month”, and it works across newsletter, website, campaigns and social.",
  },
  {
    title: "The enquiry arrives already briefed.",
    copy: "You know their pot, their target retirement age, their income target and their projected shortfall before you pick up the phone. That is a brief, not a lead.",
  },
];

const COMPLIANCE_POINTS = [
  "The tool models what the user enters and nothing more. It does not give financial advice, tax advice or personal recommendations, and every projection carries that in writing.",
  "Assumptions and methodology are published and linked from every calculation, so your compliance officer can read exactly how the numbers are produced.",
  "Enquiries go straight to you. We never store your clients' contact details.",
  "Our hosted partner pages are not indexed by Google and so never compete with your own site in search results.",
];

const DELIVERY_OPTIONS = [
  { label: "Hosted by us", meaning: "A branded page at routetoretire.co.uk/partners/yourfirm. Send people to it from anywhere.", effort: "Nothing to install" },
  { label: "Your own subdomain", meaning: "calculator.yourfirm.co.uk pointing at our infrastructure.", effort: "One DNS record" },
  { label: "Embedded", meaning: "Runs inside a page on your own site.", effort: "One script tag" },
];

const FAQS = [
  { q: "Is this financial advice?", a: "No. It models the figures the user enters and says so on every result." },
  { q: "What happens to my clients' data?", a: "The enquiry goes directly to your inbox or CRM. We keep no copy." },
  { q: "Do I need a developer?", a: "No. Hosted needs nothing, a subdomain needs one DNS record, and the embed is a single line of code." },
  { q: "Will it compete with my own website in Google?", a: "No, hosted partner pages are noindexed." },
  { q: "What if I cancel?", a: "The page comes down, or redirects to any URL you nominate. Your choice, written into the terms." },
];

function SectionEyebrow({ children }) {
  return (
    <div className="text-center mb-4">
      <span className="inline-flex font-display font-semibold text-[12px] uppercase tracking-widest" style={{ color: TEAL }}>{children}</span>
    </div>
  );
}

export default function Partners() {
  usePageTitle(
    "Partner With Route to Retire",
    "A branded retirement calculator for your firm — turn anonymous website visitors into named, briefed enquiries.",
  );

  return (
    <div className="overflow-x-hidden">
      <Header />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-14 sm:pt-20 sm:pb-16">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>For financial advisers</Eyebrow>
            <h1 className="font-serif font-bold text-4xl sm:text-5xl mb-5" style={{ color: NAVY, letterSpacing: "-.02em" }}>
              Helping financial advisers turn website visits into client conversations.
            </h1>
            <p className="text-[16px] leading-relaxed mb-8 max-w-xl" style={{ color: BODY }}>
              A retirement calculator in your firm's branding. Put it on your site or send people to it from a
              newsletter, and enquiries come back to you with the client's own numbers attached.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <PrimaryCTA to="/partners/preview">See your branded calculator →</PrimaryCTA>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Three-leg value proposition ─────────────────────────────── */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUE_LEGS.map((leg) => (
              <div key={leg.title} className="rounded-3xl p-6" style={{ backgroundColor: "white", border: `1px solid ${FENNEC}` }}>
                <h3 className="font-serif font-bold text-lg mb-2" style={{ color: NAVY }}>{leg.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>{leg.copy}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Live example ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 text-center" style={{ backgroundColor: BAND }}>
        <Container>
          <SectionEyebrow>See it in action</SectionEyebrow>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-4" style={{ color: NAVY, letterSpacing: "-.02em" }}>
            See a live example
          </h2>
          <p className="text-[15px] leading-relaxed max-w-xl mx-auto mb-8" style={{ color: BODY }}>
            Harbour &amp; Vale Financial Planning is a fictional firm we built to show exactly what a branded page for
            your firm could look like — try the calculator, the enquiry form, and the format an adviser dashboard
            would take.
          </p>
          <PrimaryCTA to="/partners/harbour-vale">View the Harbour &amp; Vale demo →</PrimaryCTA>
        </Container>
      </section>

      {/* ─── Compliance & data ────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-10">
            <SectionEyebrow>Compliance &amp; data</SectionEyebrow>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl" style={{ color: NAVY, letterSpacing: "-.02em" }}>
              Built so your compliance officer says yes.
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {COMPLIANCE_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed rounded-2xl p-5" style={{ backgroundColor: "white", border: `1px solid ${FENNEC}`, color: BODY }}>
                <span className="mt-0.5 shrink-0" style={{ color: TEAL }}>●</span>{point}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ─── Delivery options ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: BAND }}>
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-10">
            <SectionEyebrow>How it's delivered</SectionEyebrow>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-3" style={{ color: NAVY, letterSpacing: "-.02em" }}>
              One price. Three ways to run it.
            </h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {DELIVERY_OPTIONS.map((opt, i) => (
              <div key={opt.label} className="flex items-start gap-4 rounded-2xl p-5" style={{ backgroundColor: "white", border: `1px solid ${FENNEC}` }}>
                <IconCircle>{i + 1}</IconCircle>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                    <h3 className="font-serif font-bold text-[15px]" style={{ color: NAVY }}>{opt.label}</h3>
                    <span className="text-xs font-medium" style={{ color: TEAL }}>{opt.effort}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: BODY }}>{opt.meaning}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed max-w-2xl mx-auto text-center mt-6" style={{ color: BODY }}>
            Most firms eventually want this on their own domain, so the traffic, the analytics and any search benefit
            stay with you rather than with us. Same price either way, and you can switch whenever you like.
          </p>
        </Container>
      </section>

      {/* ─── Founding offer + annual ──────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7" style={{ background: "linear-gradient(160deg,#0c4060 0%,#09324A 46%,#061f2e 100%)", boxShadow: "0 30px 70px -40px rgba(6,31,46,.7)" }}>
              <div
                className="absolute top-6 -right-11 w-40 rotate-45 text-center py-1 font-display font-bold text-[10px] uppercase tracking-wider"
                style={{ backgroundColor: "#FFFB08", color: "#09324A" }}
              >
                First 30 days free
              </div>
              <div className="inline-flex font-display font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ backgroundColor: "rgba(255,251,8,.14)", color: "#FFFB08" }}>
                Founding Partner Offer
              </div>
              <h3 className="font-serif font-bold text-2xl mb-1" style={{ color: "#F3F2EA" }}>First ten firms.</h3>
              <div className="font-serif font-bold text-3xl mb-4" style={{ color: "#FFFB08" }}>£149<span className="text-base font-sans font-medium">/mo</span></div>
              <ul className="space-y-2">
                {[
                  "You keep that rate for as long as you stay",
                  "Setup fee waived — normally £199",
                  "No minimum term. Cancel any time.",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "rgba(243,242,234,.85)" }}>
                    <span className="shrink-0" style={{ color: "#AED0C9" }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl p-6 sm:p-7" style={{ background: "linear-gradient(160deg,#0c4060 0%,#09324A 46%,#061f2e 100%)", boxShadow: "0 30px 70px -40px rgba(6,31,46,.7)" }}>
              <div className="inline-flex font-display font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full mb-5" style={{ backgroundColor: "rgba(255,251,8,.14)", color: "#FFFB08" }}>
                Prefer annual?
              </div>
              <h3 className="font-serif font-bold text-2xl mb-1" style={{ color: "#F3F2EA" }}>Two months free.</h3>
              <div className="font-serif font-bold text-3xl mb-4" style={{ color: "#FFFB08" }}>£1,490<span className="text-base font-sans font-medium">/yr</span></div>
              <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(243,242,234,.85)" }}>
                Twelve months for the price of ten — £1,490 instead of £1,788.
              </p>
              <p className="text-xs" style={{ color: "rgba(243,242,234,.65)" }}>Same features, same founding rate, billed once a year.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── ROI block ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 text-center" style={{ backgroundColor: BAND }}>
        <Container>
          <div className="max-w-2xl mx-auto">
            <SectionEyebrow>The maths</SectionEyebrow>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-6" style={{ color: NAVY, letterSpacing: "-.02em" }}>
              Acquire one client and the tool pays for itself.
            </h2>
            <p className="text-[15px] leading-relaxed mb-3" style={{ color: BODY }}>
              The FCA's 2025 market survey puts the median advised client at around <strong>£2,000</strong> a year, on{" "}
              <strong>£250,000</strong> of assets — one new client more than covers what this costs for the year.
            </p>
            <p className="text-xs mb-0" style={{ color: MUTED }}>
              Source:{" "}
              <a href="https://www.fca.org.uk/data/understanding-financial-advice-market" target="_blank" rel="noopener noreferrer" style={{ color: TEAL }}>
                FCA, Understanding the advice market: financial advice firms survey 2025
              </a>
              . We make no claim about how many enquiries your firm will get — that depends on your site traffic and mailing list.
            </p>
          </div>
        </Container>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <SectionEyebrow>Questions</SectionEyebrow>
              <h2 className="font-serif font-bold text-3xl sm:text-4xl" style={{ color: NAVY, letterSpacing: "-.02em" }}>Before you ask.</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((f) => (
                <div key={f.q} className="rounded-2xl p-5" style={{ backgroundColor: "white", border: `1px solid ${FENNEC}` }}>
                  <p className="font-serif font-bold text-[15px] mb-1.5" style={{ color: NAVY }}>{f.q}</p>
                  <p className="text-sm leading-relaxed" style={{ color: BODY }}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 text-center" style={{ background: "linear-gradient(158deg,#0c3c58 0%,#09324A 60%,#072839 100%)" }}>
        <Container>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl mb-4" style={{ color: "#F3F2EA", letterSpacing: "-.02em" }}>
            Ready to get yours set up?
          </h2>
          <p className="text-base leading-relaxed max-w-lg mx-auto mb-7" style={{ color: "rgba(243,242,234,.75)" }}>
            Get in touch and we'll get your customised calculator set up today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <BookDemoButton
              className="inline-flex items-center justify-center gap-2 font-semibold text-[15px] sm:text-base rounded-full px-7 py-3.5 transition hover:opacity-90 font-display"
              style={{ backgroundColor: "#FFFB08", color: "#09324A", boxShadow: "0 10px 26px -10px rgba(255,251,8,.55)" }}
              fallbackHref="/#get-in-touch"
              fallbackLabel="Contact us"
            />
          </div>
        </Container>
      </section>

      <LandingFooter />
    </div>
  );
}
