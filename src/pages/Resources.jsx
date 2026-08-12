import {
  NAVY, FENNEC, BODY, MUTED,
  Container, Eyebrow, Header, LandingFooter,
} from "../components/landing/Chrome.jsx";

// ─── Resources index ──────────────────────────────────────────────────────────
// A hub for plain-English, scenario-based articles. No content yet — this is
// the shell plus a preview of what's coming, so the nav link has somewhere
// real to go while the articles get written.

const TOPICS = [
  { title: "Can I ease off my pension contributions?", teaser: "How to tell whether your savings could carry the rest of the way on their own." },
  { title: "Am I saving enough for retirement?", teaser: "A plain-English look at what \"on track\" actually means." },
  { title: "What happens if I retire earlier than planned?", teaser: "How bringing your date forward changes the numbers." },
  { title: "How does the State Pension fit into my target?", teaser: "When it starts, how much it's worth, and what it means for your own pot." },
  { title: "Should I consolidate old workplace pensions?", teaser: "The trade-offs worth understanding before combining old pots." },
  { title: "What if my investment returns are lower than expected?", teaser: "Stress-testing your plan against a more cautious assumption." },
];

export default function Resources() {
  return (
    <div className="overflow-x-hidden">
      <Header />

      <section className="pt-16 pb-10 sm:pt-20 sm:pb-12">
        <Container>
          <Eyebrow>Resources</Eyebrow>
          <h1 className="font-serif font-bold text-4xl sm:text-5xl leading-[1.06] mb-5 max-w-2xl" style={{ color: NAVY, letterSpacing: "-.02em" }}>
            Answers to the questions people actually ask.
          </h1>
          <p className="text-lg leading-relaxed max-w-xl" style={{ color: BODY }}>
            Plain-English articles on common retirement scenarios — no jargon, no sales pitch. We're writing these now;
            here's what's on the way.
          </p>
        </Container>
      </section>

      <section className="pb-20 sm:pb-24">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TOPICS.map((t) => (
              <div key={t.title} className="bg-white rounded-3xl p-6" style={{ border: `1px solid ${FENNEC}`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
                <span className="inline-flex font-display font-semibold text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full mb-4" style={{ backgroundColor: "#F3F2EA", color: MUTED }}>
                  Coming soon
                </span>
                <h3 className="font-serif font-bold text-lg mb-1.5" style={{ color: NAVY }}>{t.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{t.teaser}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <LandingFooter />
    </div>
  );
}
