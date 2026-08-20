import { useState } from "react";
import {
  NAVY, YELLOW, FENNEC, BAND, BODY, MUTED,
  Container, Eyebrow, IconCircle, PrimaryCTA, SecondaryCTA, Header, LandingFooter,
} from "../components/landing/Chrome.jsx";
import { usePageTitle } from "../lib/usePageTitle.js";

// ─── Pro details page ─────────────────────────────────────────────────────────
// Pro isn't built yet — no accounts, no Stripe. This page explains what it will
// include and collects interest via a Mailchimp waitlist (api/subscribe.js),
// tagged "pro-waitlist" so signups are easy to find once payments land.

const FEATURES = [
  { icon: "⧉", title: "Save multiple scenarios", copy: "Keep more than one version of your plan and compare them side by side." },
  { icon: "♥", title: "Add a spouse or partner", copy: "Model retirement together, not just as an individual." },
  { icon: "⇄", title: "Compare retirement ages", copy: "See how retiring a few years earlier or later changes the numbers." },
  { icon: "↓", title: "Export to PDF", copy: "Take a clean copy of your plan away with you." },
  { icon: "▤", title: "Print a retirement summary", copy: "A one-page summary that's easy to share or file." },
  { icon: "↺", title: "Revisit your plan later", copy: "Come back and pick up where you left off." },
];

function ProWaitlistForm() {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.target;
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setSucceeded(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl p-8 text-center bg-white" style={{ border: `1px solid ${FENNEC}`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
        <p className="font-serif font-bold text-xl" style={{ color: NAVY }}>You're on the list.</p>
        <p className="text-sm mt-2" style={{ color: MUTED }}>We'll email you the moment Route to Retire Pro is ready.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 space-y-4" style={{ border: `1px solid ${FENNEC}`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
      <div>
        <label htmlFor="pro-email" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>Email</label>
        <input
          id="pro-email"
          type="email"
          name="email"
          required
          placeholder="your.email@example.com"
          className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none"
          style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
        />
      </div>
      {error && <p className="text-xs" style={{ color: "#E74C3C" }}>{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 px-4 font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-display"
        style={{ backgroundColor: YELLOW, color: NAVY }}
      >
        {submitting ? "Sending…" : "Join the waitlist"}
      </button>
    </form>
  );
}

export default function Pro() {
  usePageTitle(
    "Route to Retire Pro",
    "Save multiple scenarios, plan as a couple, and export a clean PDF summary with Route to Retire Pro — coming soon.",
  );

  return (
    <div className="overflow-x-hidden">
      <Header />

      <section className="pt-16 pb-14 sm:pt-20 sm:pb-16 text-center">
        <Container>
          <div className="flex justify-center">
            <div className="inline-flex items-center font-display font-bold text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: YELLOW, color: NAVY }}>
              Route to Retire Pro
            </div>
          </div>
          <h1 className="font-serif font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.06] mb-5 max-w-3xl mx-auto" style={{ color: NAVY, letterSpacing: "-.02em" }}>
            Plan with more confidence.
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto mb-8" style={{ color: BODY }}>
            See a few different routes side by side, plan together as a couple, and keep a clean record you can come back
            to. Pro is built for people who want to go beyond a single snapshot.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <SecondaryCTA to="/check">Continue with the free check</SecondaryCTA>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20" style={{ backgroundColor: BAND }}>
        <Container>
          <Eyebrow>What's included</Eyebrow>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-10" style={{ color: NAVY, letterSpacing: "-.02em" }}>Everything in the free check, plus room to plan properly.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-3xl p-6" style={{ border: `1px solid ${FENNEC}`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
                <IconCircle>{f.icon}</IconCircle>
                <h4 className="font-serif font-bold text-lg mt-4 mb-1" style={{ color: NAVY }}>{f.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.copy}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center max-w-xl mx-auto mb-10">
            <Eyebrow>Coming soon</Eyebrow>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-3" style={{ color: NAVY, letterSpacing: "-.02em" }}>Pro is on its way.</h2>
            <p className="text-[15px] leading-relaxed" style={{ color: BODY }}>
              We're currently building Route to Retire Pro, leave your email and we'll let you know the moment it's
              ready — no obligation, no spam.
            </p>
          </div>
          <ProWaitlistForm />
        </Container>
      </section>

      <section className="py-16 sm:py-20 text-center" style={{ background: "linear-gradient(158deg,#0c3c58 0%,#09324A 60%,#072839 100%)" }}>
        <Container>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl mb-4" style={{ color: "#F3F2EA", letterSpacing: "-.02em" }}>Not ready to wait?</h2>
          <p className="text-base leading-relaxed max-w-lg mx-auto mb-7" style={{ color: "rgba(243,242,234,.75)" }}>
            The free One-Minute Check already covers the essentials — no sign-up needed.
          </p>
          <PrimaryCTA to="/check">Start my check →</PrimaryCTA>
        </Container>
      </section>

      <LandingFooter />
    </div>
  );
}
