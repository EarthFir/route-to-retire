import { useState } from "react";
import { useForm, ValidationError } from "@formspree/react";
import RetirementCalculator from "../components/RetirementCalculator.jsx";
import { Link } from "../lib/Link.jsx";

// ─── Route to Retire — Landing Page ───────────────────────────────────────────
// Marketing homepage that wraps the existing calculator ("Your first step")
// with hero, education, trust, upsell and B2B sections. All Pro / adviser /
// provider CTAs are marketing placeholders that funnel into a single shared
// interest-capture form (reusing the same Formspree endpoint as the in-app
// feedback form) rather than standing up separate, half-built backends.

const NAVY = "#09324A";
const TEAL = "#1B6F81";
const YELLOW = "#FFFB08";
const FENNEC = "#DAD7C8";
const CREAM = "#F3F2EA";
const MINT_TINT = "#E7F1EF";
const BAND = "#E7E6DC";
const BODY = "#4a5a5f";
const MUTED = "#8a9599";

// ─── Shared bits ───────────────────────────────────────────────────────────────

function Container({ children, className = "" }) {
  return <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

function Eyebrow({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{ width: 26, height: 2, backgroundColor: TEAL }} />
      <span className="font-display font-semibold text-[12px] uppercase" style={{ letterSpacing: ".14em", color: TEAL }}>
        {children}
      </span>
    </div>
  );
}

function IconCircle({ children }) {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0" style={{ backgroundColor: MINT_TINT, color: NAVY }}>
      {children}
    </div>
  );
}

function PrimaryCTA({ href, onClick, children }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 font-semibold text-[15px] sm:text-base rounded-full px-7 py-3.5 transition hover:opacity-90 font-display"
      style={{ backgroundColor: YELLOW, color: NAVY, boxShadow: "0 10px 26px -10px rgba(255,251,8,.55)" }}
    >
      {children}
    </a>
  );
}

function SecondaryCTA({ href, onClick, dark, children }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 font-semibold text-[15px] sm:text-base rounded-full px-6 py-3 transition hover:opacity-70 font-display"
      style={dark ? { color: "#F3F2EA", border: "1.5px solid rgba(243,242,234,.35)" } : { color: NAVY, border: "1.5px solid rgba(9,50,74,.2)" }}
    >
      {children}
    </a>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────────

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-40"
      style={{ backgroundColor: "rgba(243,242,234,.92)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderBottom: "1px solid rgba(9,50,74,.08)" }}
    >
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link to="/" className="font-serif font-bold text-xl" style={{ color: NAVY, letterSpacing: "-.01em" }}>
          Route to Retire
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium" style={{ color: NAVY }}>
          <a href="#check">Check</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/methodology">Resources</Link>
          <a href="#trust">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="#check"
            className="hidden sm:inline-flex font-semibold text-sm rounded-full px-6 py-2.5 hover:opacity-90 transition font-display"
            style={{ backgroundColor: YELLOW, color: NAVY }}
          >
            Start my check
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
          >
            <span className="block w-5 h-0.5 rounded-full transition" style={{ backgroundColor: NAVY, transform: open ? "translateY(2px) rotate(45deg)" : "none" }} />
            <span className="block w-5 h-0.5 rounded-full transition" style={{ backgroundColor: NAVY, opacity: open ? 0 : 1 }} />
            <span className="block w-5 h-0.5 rounded-full transition" style={{ backgroundColor: NAVY, transform: open ? "translateY(-8px) rotate(-45deg)" : "none" }} />
          </button>
        </div>
      </Container>
      {open && (
        <div className="md:hidden" style={{ borderTop: "1px solid rgba(9,50,74,.08)" }}>
          <Container className="flex flex-col gap-1 py-4 text-[15px] font-medium" style={{ color: NAVY }}>
            <a href="#check" onClick={() => setOpen(false)} className="py-2">Check</a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="py-2">How it works</a>
            <Link to="/methodology" className="py-2">Resources</Link>
            <a href="#trust" onClick={() => setOpen(false)} className="py-2">About</a>
            <a
              href="#check"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex justify-center font-semibold text-sm rounded-full px-6 py-2.5 font-display"
              style={{ backgroundColor: YELLOW, color: NAVY }}
            >
              Start my check
            </a>
          </Container>
        </div>
      )}
    </header>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-14 pb-10 sm:pt-20 sm:pb-14">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          <div>
            <Eyebrow>Retirement planning, made plain</Eyebrow>
            <h1 className="font-serif font-bold text-[42px] sm:text-6xl lg:text-[64px] leading-[1.04] mb-6" style={{ color: NAVY, letterSpacing: "-.03em" }}>
              Find your route to retirement.
            </h1>
            <p className="text-lg leading-relaxed max-w-[46ch] mb-3" style={{ color: BODY }}>
              A quick, easy-to-follow view of whether you're on track — and a clear, calm sense of what to do next.
            </p>
            <p className="text-[15px] leading-relaxed max-w-[46ch] mb-8" style={{ color: MUTED }}>
              Whether you're getting started, catching up, or wondering when you can ease off.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-7">
              <PrimaryCTA href="#check">Check my route →</PrimaryCTA>
              <SecondaryCTA href="#how-it-works">See how it works</SecondaryCTA>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: MUTED }}>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TEAL }} />No sign-up to start</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TEAL }} />Takes around one minute</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TEAL }} />Assumptions explained</span>
            </div>
          </div>

          <div className="relative">
            <div
              className="relative rounded-[28px] overflow-hidden h-[300px] sm:h-[380px]"
              style={{ background: "linear-gradient(135deg, #AED0C9 0%, #E7F1EF 45%, #FFFB08 130%)" }}
            >
              <div className="absolute" style={{ top: -60, left: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(9,50,74,.10), rgba(9,50,74,0) 70%)" }} />
              <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path
                  d="M0,230 C60,225 90,175 140,165 C190,155 210,205 260,165 C310,125 320,70 400,45"
                  fill="none"
                  stroke="#09324A"
                  strokeOpacity=".22"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div
              className="absolute left-4 right-4 sm:left-8 sm:right-[-18px] bottom-[-28px] rounded-2xl p-5 sm:p-6"
              style={{ background: "linear-gradient(158deg,#0c3c58,#072839)", boxShadow: "0 26px 56px -22px rgba(9,50,74,.55)" }}
            >
              <div className="flex items-center justify-between mb-4 gap-3">
                <span className="font-display font-semibold text-[11px] uppercase tracking-widest" style={{ color: "#AED0C9" }}>The One-Minute Check</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: "rgba(243,242,234,.65)", border: "1px solid rgba(174,208,201,.3)" }}>Step 1 of 4</span>
              </div>
              <div className="flex items-baseline justify-between mb-2.5">
                <span className="text-sm" style={{ color: "rgba(243,242,234,.82)" }}>Target retirement age</span>
                <span className="font-serif font-bold text-2xl" style={{ color: "#FFFB08" }}>65</span>
              </div>
              <div className="h-1.5 rounded-full relative" style={{ backgroundColor: "rgba(243,242,234,.15)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "58%", backgroundColor: "#FFFB08" }} />
                <div className="absolute top-1/2 rounded-full" style={{ left: "58%", width: 16, height: 16, transform: "translate(-50%,-50%)", backgroundColor: "#FFFB08", border: "3px solid #09324A" }} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ─── Check (embeds the real calculator) ──────────────────────────────────────

function CheckSection() {
  return (
    <section id="check" className="pt-10 pb-16 sm:pb-20">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <Eyebrow>Your first step</Eyebrow>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl" style={{ color: NAVY, letterSpacing: "-.02em" }}>The One-Minute Retirement Check</h2>
          </div>
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: BODY }}>
            Move a few sliders and see how your projected pension pot compares with your target. Nothing is saved, there's no sign-up, and you can refine the details later.
          </p>
        </div>
        <RetirementCalculator embedded />
      </Container>
    </section>
  );
}

// ─── How it works ───────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, title: "Tell us where you are", copy: "A few light questions. Rough numbers are fine to start." },
  { n: 2, title: "See your route", copy: "Whether you look on track, behind, or closer than you thought." },
  { n: 3, title: "Understand your next step", copy: "See the one or two changes that could make the biggest difference." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20" style={{ backgroundColor: BAND }}>
      <Container>
        <Eyebrow>How it works</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-2">
          {STEPS.map((s, i) => (
            <div key={s.n}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-11 h-11 rounded-full flex items-center justify-center font-serif font-bold text-lg shrink-0" style={{ backgroundColor: YELLOW, color: NAVY }}>{s.n}</span>
                {i < STEPS.length - 1 && <span className="hidden md:block flex-1 h-px" style={{ backgroundColor: "rgba(9,50,74,.15)" }} />}
              </div>
              <h3 className="font-serif font-bold text-xl mb-2" style={{ color: NAVY }}>{s.title}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: BODY }}>{s.copy}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── What you get ───────────────────────────────────────────────────────────────

const GET_ITEMS = [
  { icon: "✓", title: "Whether you look on track", copy: "A straight answer for your target age." },
  { icon: "£", title: "Your projected income", copy: "What your pot could pay you each year." },
  { icon: "⇅", title: "The biggest levers", copy: "Which changes matter most for you." },
  { icon: "→", title: "Where to focus next", copy: "A sensible next step, not a sales pitch." },
];

function WhatYouGet() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Eyebrow>What you get</Eyebrow>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-10" style={{ color: NAVY, letterSpacing: "-.02em" }}>A clear picture, made simple.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {GET_ITEMS.map((it) => (
            <div key={it.title} className="bg-white rounded-3xl p-6 flex gap-4" style={{ border: `1px solid ${FENNEC}`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
              <IconCircle>{it.icon}</IconCircle>
              <div>
                <h4 className="font-serif font-bold text-lg mb-1" style={{ color: NAVY }}>{it.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{it.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── Trust ───────────────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { title: "Assumptions made simple", copy: "Every projection is explained in words." },
  { title: "No pressure", copy: "No cold calls, no hard sell." },
  { title: "Privacy-conscious", copy: "Start without creating an account." },
  { title: "Made to be understood", copy: "Built to make pension planning clearer." },
];

function Trust() {
  return (
    <section id="trust" className="py-16 sm:py-20" style={{ backgroundColor: BAND }}>
      <Container>
        <Eyebrow>Built to be trusted</Eyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {TRUST_ITEMS.map((it) => (
            <div key={it.title} className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${FENNEC}` }}>
              <div className="font-bold mb-2" style={{ color: TEAL }}>✓</div>
              <h4 className="font-serif font-bold text-[17px] mb-1" style={{ color: NAVY }}>{it.title}</h4>
              <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>{it.copy}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── Pro upsell ─────────────────────────────────────────────────────────────────

const PRO_FEATURES = [
  "Save multiple scenarios",
  "Add a spouse or partner",
  "Compare retirement ages",
  "Export to PDF",
  "Print a retirement summary",
  "Revisit your plan later",
];

function ProUpsell({ setTopic }) {
  return (
    <section id="pro" className="py-16 sm:py-20">
      <Container>
        <div className="rounded-[28px] p-8 sm:p-12 overflow-hidden relative" style={{ background: "linear-gradient(160deg,#0c4060 0%,#09324A 46%,#061f2e 100%)" }}>
          <div className="absolute pointer-events-none" style={{ top: -120, right: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(174,208,201,.18), rgba(174,208,201,0) 70%)" }} />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center font-display font-bold text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-5" style={{ backgroundColor: YELLOW, color: NAVY }}>
                Route to Retire Pro
              </div>
              <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-4" style={{ color: "#F3F2EA", letterSpacing: "-.02em" }}>Want to compare a few routes?</h2>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: "rgba(243,242,234,.78)" }}>
                Unlock Route to Retire Pro to save scenarios, plan as a couple, and export a clean PDF summary.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <PrimaryCTA href="#get-in-touch" onClick={() => setTopic("pro")}>Unlock Pro →</PrimaryCTA>
                <SecondaryCTA href="#check" dark>Continue with the free check</SecondaryCTA>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: "rgba(255,251,8,.16)", color: YELLOW }}>✓</span>
                  <span className="text-sm" style={{ color: "#F3F2EA" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ─── Provider / affiliate moment ─────────────────────────────────────────────

const PROVIDER_LINKS = ["Compare pension options", "Explore SIPP providers", "Learn about pension consolidation"];

function ProviderMoment({ setTopic }) {
  return (
    <section id="providers" className="py-16 sm:py-20" style={{ backgroundColor: BAND }}>
      <Container>
        <div className="max-w-3xl">
          <Eyebrow>Need somewhere to take action?</Eyebrow>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl mb-4" style={{ color: NAVY, letterSpacing: "-.02em" }}>
            We may point you toward pension and SIPP providers.
          </h2>
          <p className="text-[15px] leading-relaxed mb-7" style={{ color: BODY }}>
            We may link to pension and SIPP providers where relevant. Some links may earn Route to Retire a commission. This
            does not affect your calculator results, and we don't present these as personal recommendations.
          </p>
          <div className="flex flex-wrap gap-3">
            {PROVIDER_LINKS.map((label) => (
              <a
                key={label}
                href="#get-in-touch"
                onClick={() => setTopic("providers")}
                className="inline-flex items-center gap-2 font-medium text-sm rounded-full px-5 py-2.5 bg-white hover:opacity-70 transition"
                style={{ color: TEAL, border: `1px solid ${FENNEC}` }}
              >
                {label} →
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

// ─── For financial advisers ──────────────────────────────────────────────────

const ADVISER_BENEFITS = [
  "Embeddable calculator",
  "Co-branded experience",
  "Result-based call to action",
  "Lead capture after calculator completion",
  "Adviser-friendly client summary",
  "Useful for newsletters, campaigns, and website traffic",
];

function AdviserSection({ setTopic }) {
  return (
    <section id="advisers" className="py-16 sm:py-20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-12 items-center">
          <div>
            <Eyebrow>For financial advisers</Eyebrow>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-4" style={{ color: NAVY, letterSpacing: "-.02em" }}>
              Turn retirement curiosity into better conversations.
            </h2>
            <p className="text-[15px] leading-relaxed mb-6" style={{ color: BODY }}>
              Embed Route to Retire in your website, newsletter, or campaign landing page and turn retirement curiosity into
              better-qualified conversations.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-7">
              {ADVISER_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm" style={{ color: BODY }}>
                  <span className="mt-0.5" style={{ color: TEAL }}>✓</span>{b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-4">
              <PrimaryCTA href="#get-in-touch" onClick={() => setTopic("adviser")}>Ask about adviser embeds →</PrimaryCTA>
              <SecondaryCTA href="#check">See example journey</SecondaryCTA>
            </div>
          </div>

          <div className="rounded-3xl p-5" style={{ backgroundColor: "white", border: `1px solid ${FENNEC}`, boxShadow: "0 20px 44px -28px rgba(9,50,74,.35)" }}>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
              <span className="ml-3 text-xs font-medium truncate" style={{ color: MUTED }}>yourfirm.co.uk/retirement-check</span>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(158deg,#0c3c58,#072839)" }}>
              <div className="flex items-center justify-between mb-4 gap-2">
                <span className="font-display font-semibold text-[11px] uppercase tracking-widest" style={{ color: "#AED0C9" }}>Co-branded check</span>
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
  );
}

// ─── Shared "get in touch" interest capture ──────────────────────────────────
// One real, working Formspree form (reusing the existing feedback endpoint)
// backs every soft CTA above — Pro, adviser embeds, provider comparisons and
// general contact all land here with the relevant topic pre-selected.

const TOPICS = [
  { value: "general", label: "General question / feedback" },
  { value: "pro", label: "Route to Retire Pro" },
  { value: "adviser", label: "Adviser embeds" },
  { value: "providers", label: "Pension & SIPP providers" },
];

function GetInTouch({ topic, setTopic }) {
  const [state, handleSubmit] = useForm("xbdqvqby");

  if (state.succeeded) {
    return (
      <section id="get-in-touch" className="py-16 sm:py-20" style={{ backgroundColor: BAND }}>
        <Container>
          <div className="max-w-xl mx-auto rounded-3xl p-8 text-center" style={{ backgroundColor: "white", border: `1px solid ${FENNEC}`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
            <p className="font-serif font-bold text-xl" style={{ color: NAVY }}>Thanks — we'll be in touch.</p>
            <p className="text-sm mt-2" style={{ color: MUTED }}>We read every message and reply where we can.</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="get-in-touch" className="py-16 sm:py-20" style={{ backgroundColor: BAND }}>
      <Container>
        <div className="max-w-xl mx-auto">
          <Eyebrow>Get in touch</Eyebrow>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl mb-3" style={{ color: NAVY, letterSpacing: "-.02em" }}>Tell us what you're interested in.</h2>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: BODY }}>
            Whether it's Pro, an adviser embed, provider comparisons, or just a question — drop us a note and we'll get back
            to you. No sales pressure.
          </p>
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 space-y-4" style={{ border: `1px solid ${FENNEC}`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
            <div>
              <label htmlFor="gi-topic" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>I'm interested in</label>
              <select
                id="gi-topic"
                name="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none"
                style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
              >
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gi-email" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>Email (optional)</label>
              <input
                id="gi-email"
                type="email"
                name="email"
                placeholder="your.email@example.com"
                className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none"
                style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
              />
              <ValidationError field="email" errors={state.errors} className="text-xs mt-1" style={{ color: "#E74C3C" }} />
            </div>
            <div>
              <label htmlFor="gi-message" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>Message</label>
              <textarea
                id="gi-message"
                name="message"
                rows={3}
                placeholder="A line or two is plenty"
                className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none resize-none"
                style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
              />
              <ValidationError field="message" errors={state.errors} className="text-xs mt-1" style={{ color: "#E74C3C" }} />
            </div>
            <button
              type="submit"
              disabled={state.submitting}
              className="w-full py-3 px-4 font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-display"
              style={{ backgroundColor: YELLOW, color: NAVY }}
            >
              {state.submitting ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-20 sm:py-24 text-center" style={{ background: "linear-gradient(158deg,#0c3c58 0%,#09324A 60%,#072839 100%)" }}>
      <Container>
        <h2 className="font-serif font-bold text-3xl sm:text-5xl mb-4" style={{ color: "#F3F2EA", letterSpacing: "-.02em" }}>Your route is a minute away.</h2>
        <p className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8" style={{ color: "rgba(243,242,234,.75)" }}>
          No exact numbers needed to start. See where you stand today, then decide what to do next — in your own time.
        </p>
        <PrimaryCTA href="#check">Start my check →</PrimaryCTA>
      </Container>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="pt-14 pb-10" style={{ borderTop: `1px solid ${FENNEC}` }}>
      <Container>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <span className="font-serif font-bold text-xl" style={{ color: NAVY }}>Route to Retire</span>
          <span className="text-sm" style={{ color: MUTED }}>Pension planning, made plain.</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium mb-6" style={{ color: TEAL }}>
          <Link to="/methodology">Assumptions</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/disclaimer">Terms</Link>
          <a href="#providers">Affiliate disclosure</a>
          <a href="#advisers">For advisers</a>
          <a href="#get-in-touch">Contact</a>
        </nav>
        <p className="text-xs leading-relaxed max-w-2xl" style={{ color: MUTED }}>
          Route to Retire provides educational tools and projections based on the assumptions you enter. It is not financial
          advice. Pension and investment decisions can affect your future income and tax position.
        </p>
      </Container>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [topic, setTopic] = useState("general");

  return (
    <div className="overflow-x-hidden" style={{ backgroundColor: CREAM }}>
      <Header />
      <Hero />
      <CheckSection />
      <HowItWorks />
      <WhatYouGet />
      <Trust />
      <ProUpsell setTopic={setTopic} />
      <ProviderMoment setTopic={setTopic} />
      <AdviserSection setTopic={setTopic} />
      <GetInTouch topic={topic} setTopic={setTopic} />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
