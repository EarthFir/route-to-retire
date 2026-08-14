import { useState, useEffect } from "react";
import { useForm, ValidationError } from "@formspree/react";
import heroFamily from "../assets/hero-family.jpg";
import {
  NAVY, TEAL, YELLOW, FENNEC, MINT_TINT, BAND, BODY, MUTED,
  Container, Eyebrow, IconCircle, PrimaryCTA, SecondaryCTA, Header, LandingFooter,
} from "../components/landing/Chrome.jsx";

// ─── Route to Retire — Landing Page ───────────────────────────────────────────
// Marketing homepage. The real calculator lives at /check; this page carries a
// self-contained "teaser" widget (illustrative maths against a fixed £500k
// goal, not the full model) that hands off to /check to continue for real.
// Pro / adviser / provider CTAs are marketing placeholders that funnel into a
// single shared interest-capture form (reusing the same Formspree endpoint as
// the in-app feedback form) rather than standing up separate half-built
// backends.

function fmtGBP0(n) {
  return "£" + Math.round(n).toLocaleString("en-GB");
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
            <div className="relative rounded-[28px] overflow-hidden h-[300px] sm:h-[380px]">
              <img src={heroFamily} alt="A family reviewing their retirement plan together at home" className="w-full h-full object-cover block" />
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

        <div className="flex justify-center pt-14 sm:pt-16">
          <a href="#check" className="flex items-center gap-2.5 font-display font-semibold text-[12.5px] uppercase" style={{ letterSpacing: ".14em", color: TEAL }}>
            Continue the check below <span className="text-base">↓</span>
          </a>
        </div>
      </Container>
    </section>
  );
}

// ─── Check teaser widget ──────────────────────────────────────────────────────
// A self-contained, illustrative slider widget (fixed 42-year-old saver, fixed
// £500k goal, 5% growth) — not the real model. Both buttons hand off to the
// full calculator at /check to continue for real.

function SliderRow({ label, display, value, min, max, step, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="text-[15px]" style={{ color: "rgba(243,242,234,.82)" }}>{label}</span>
        <span className="font-serif font-bold text-2xl" style={{ color: "#FFFB08" }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        data-dark
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, #FFFB08 ${pct}%, rgba(243,242,234,.15) ${pct}%)` }}
      />
    </div>
  );
}

const TEASER_CURRENT_AGE = 42;
const TEASER_RETURN = 0.05;
const TEASER_GOAL = 500000;

function CheckPreviewWidget() {
  const [retireAge, setRetireAge] = useState(65);
  const [contribution, setContribution] = useState(300);
  const [savings, setSavings] = useState(52000);

  const n = Math.max(1, retireAge - TEASER_CURRENT_AGE);
  const growth = Math.pow(1 + TEASER_RETURN, n);
  const pot = savings * growth + contribution * 12 * ((growth - 1) / TEASER_RETURN);
  const goalPct = Math.min(100, Math.round((pot / TEASER_GOAL) * 100));
  const onTrack = pot >= TEASER_GOAL * 0.97;
  const status = onTrack
    ? { label: "On track", color: YELLOW, bg: "rgba(255,251,8,.12)", border: "rgba(255,251,8,.35)" }
    : { label: "Getting closer", color: "#AED0C9", bg: "rgba(174,208,201,.12)", border: "rgba(174,208,201,.3)" };

  const W = 360, H = 168, padT = 10, padB = 8;
  const maxVal = Math.max(pot, TEASER_GOAL) * 1.08;
  const yOf = (v) => padT + (H - padT - padB) * (1 - v / maxVal);
  const pts = [];
  for (let y = 0; y <= n; y++) {
    const g = Math.pow(1 + TEASER_RETURN, y);
    const v = savings * g + contribution * 12 * ((g - 1) / TEASER_RETURN);
    pts.push([(y / n) * W, yOf(v)]);
  }
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const goalY = yOf(TEASER_GOAL);
  const last = pts[pts.length - 1];

  return (
    <div className="rounded-[28px] p-6 sm:p-9" style={{ background: "linear-gradient(160deg,#0c3c58 0%,#09324A 46%,#061f2e 100%)", boxShadow: "0 42px 90px -46px rgba(6,31,46,.9)" }}>
      <div className="flex items-start justify-between gap-4 mb-7">
        <h3 className="font-serif font-bold text-2xl sm:text-[28px] leading-tight max-w-[24ch]" style={{ color: "#F3F2EA" }}>
          How much do you need in your pot — and are you on track to reach it?
        </h3>
        <span className="text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap font-display shrink-0" style={{ color: "rgba(243,242,234,.7)", border: "1px solid rgba(174,208,201,.3)" }}>Step 1 of 4</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(174,208,201,.08)", border: "1px solid rgba(174,208,201,.16)" }}>
              <div className="font-display text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "#AED0C9" }}>You may need</div>
              <div className="font-serif font-bold text-xl sm:text-2xl whitespace-nowrap" style={{ color: "#F3F2EA" }}>{fmtGBP0(TEASER_GOAL)}</div>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(174,208,201,.08)", border: "1px solid rgba(174,208,201,.16)" }}>
              <div className="font-display text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "#AED0C9" }}>On track for</div>
              <div className="font-serif font-bold text-xl sm:text-2xl whitespace-nowrap" style={{ color: "#FFFB08" }}>{fmtGBP0(pot)}</div>
            </div>
          </div>

          <SliderRow label="Target retirement age" display={retireAge} value={retireAge} min={55} max={72} step={1} onChange={setRetireAge} />
          <SliderRow label="Monthly contribution" display={fmtGBP0(contribution)} value={contribution} min={0} max={1500} step={25} onChange={setContribution} />
          <SliderRow label="Current savings" display={fmtGBP0(savings)} value={savings} min={0} max={300000} step={1000} onChange={setSavings} />
        </div>

        <div className="rounded-2xl p-5 flex flex-col" style={{ backgroundColor: "rgba(174,208,201,.08)", border: "1px solid rgba(174,208,201,.16)" }}>
          <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
            <span className="font-display text-[11px] uppercase tracking-widest" style={{ color: "#AED0C9" }}>Projected growth</span>
            <span className="inline-flex items-center gap-1.5 font-display font-semibold text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: status.color, backgroundColor: status.bg, border: `1px solid ${status.border}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />{status.label}
            </span>
          </div>
          <div className="text-[13px] mb-3" style={{ color: "rgba(243,242,234,.55)" }}>{goalPct}% of your {fmtGBP0(TEASER_GOAL)} goal · assumes ~5% a year</div>
          <div className="flex-1 min-h-[150px]">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full block overflow-visible">
              <defs>
                <linearGradient id="cpFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFB08" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#FFFB08" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1={goalY} x2={W} y2={goalY} stroke="#AED0C9" strokeWidth="1.25" strokeDasharray="5 5" opacity="0.75" />
              <text x="4" y={goalY - 7} fill="#AED0C9" fontSize="11" fontFamily="Manrope, sans-serif">Goal {fmtGBP0(TEASER_GOAL)}</text>
              <path d={area} fill="url(#cpFill)" />
              <path d={line} fill="none" stroke="#FFFB08" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={last[0]} cy={last[1]} r="5" fill="#FFFB08" stroke="#09324A" strokeWidth="3" />
            </svg>
          </div>
          <div className="flex items-center justify-between mt-2 font-display text-[11px]" style={{ color: "rgba(243,242,234,.6)" }}>
            <span>Today</span>
            <span>Age {retireAge}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 text-[13px]" style={{ color: "rgba(243,242,234,.6)" }}>
        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#AED0C9" }} />No exact numbers needed to start</span>
        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#AED0C9" }} />Takes around one minute</span>
        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#AED0C9" }} />You can refine the details later</span>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-7">
        <PrimaryCTA to="/check">Continue to check my route →</PrimaryCTA>
      </div>
    </div>
  );
}

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
            Move a slider and watch your projected pot and growth curve update against your goal. Nothing is saved and
            there's no sign-up.
          </p>
        </div>
        <CheckPreviewWidget />
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

function ProUpsell() {
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
                <PrimaryCTA to="/pro">Unlock Pro →</PrimaryCTA>
                <SecondaryCTA to="/check" dark>Continue with the free check</SecondaryCTA>
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
              <SecondaryCTA to="/check">See example journey</SecondaryCTA>
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
        <PrimaryCTA to="/check">Start my check →</PrimaryCTA>
      </Container>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [topic, setTopic] = useState("general");

  // Cross-page anchors (header/footer links like "/#trust") land here after a
  // full navigation; same-document hash clicks are handled natively by the
  // browser. This only needs to run once, on mount.
  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      el?.scrollIntoView();
    }
  }, []);

  return (
    <div className="overflow-x-hidden">
      <Header />
      <Hero />
      <CheckSection />
      <HowItWorks />
      <WhatYouGet />
      <Trust />
      <ProUpsell />
      <ProviderMoment setTopic={setTopic} />
      <AdviserSection setTopic={setTopic} />
      <GetInTouch topic={topic} setTopic={setTopic} />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
