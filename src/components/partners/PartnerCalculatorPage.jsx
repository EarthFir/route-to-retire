import { useEffect, useState } from "react";
import RetirementCalculator from "../RetirementCalculator.jsx";
import { calculatorThemeVars } from "../../lib/partners/theme.js";
import { submitLead } from "../../lib/partners/leadCapture.js";
import { trackEngagement, trackVisit } from "../../lib/partners/engagement.js";
import { Link } from "../../lib/Link.jsx";
import PricingCTA from "./PricingCTA.jsx";

// ─── Partner-branded calculator page (generic) ────────────────────────────────
// Renders the real calculator inside a themed wrapper (see theme.js) plus a
// branded header/hero, a lead capture CTA, and an "for advisers" explainer —
// all driven entirely by the partner `config` object passed in, so a second
// partner is a new config file, not a copy of this page. Currently used only
// by the fictional Harbour & Vale demo (src/pages/partners/HarbourVale.jsx).

function PartnerHeader({ config }) {
  return (
    <header className="sticky top-0 z-40 bg-white" style={{ borderBottom: `1px solid ${config.theme.primary}22` }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        {config.logoSrc ? (
          <img src={config.logoSrc} alt={config.logoText} className="h-8 sm:h-9 w-auto" />
        ) : (
          <div className="font-serif font-bold text-lg sm:text-xl" style={{ color: config.theme.primary }}>
            {config.logoText}
          </div>
        )}
        {!config.whiteLabel && (
          <Link
            to="/"
            className="text-xs font-medium shrink-0"
            style={{ color: "#8a9599" }}
          >
            Calculator by Route to Retire
          </Link>
        )}
      </div>
    </header>
  );
}

function formatGBP(value) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

const STATUS_LABEL = { green: "On track", amber: "Close to target", red: "Action needed" };

// Plain-text digest of the calculator's current numbers, built from the same
// `result`/`inputs`/`statePension` shape RetirementCalculator already computes
// (see its onSummaryChange) — sent as a form field alongside the enquiry, not
// as a PDF attachment, so it reaches any partner endpoint (Formspree, CRM,
// Zapier/Make webhook) without relying on that endpoint handling file uploads.
function buildResultsSummary({ inputs, statePension, result }) {
  const lines = [
    `Status: ${STATUS_LABEL[result.status] || result.status}`,
    `Current age ${inputs.currentAge} -> target retirement age ${inputs.retirementAge}`,
    `Target retirement income: ${formatGBP(inputs.desiredIncome)}/yr${statePension.include ? ` (plus ${formatGBP(statePension.income)}/yr State Pension)` : ""}`,
    `Current savings: ${formatGBP(inputs.currentSavings)}, saving ${formatGBP(inputs.monthlySavingsCurrent)}/mo`,
    `Target pot needed by ${inputs.retirementAge}: ${formatGBP(result.targetPot)}`,
    `Projected pot at ${inputs.retirementAge} at current saving: ${formatGBP(result.projectedPotWithSaving)}`,
  ];
  if (result.savingsGap > 0) {
    lines.push(`Estimated monthly shortfall: ${formatGBP(result.savingsGap)}/mo`);
  } else if (result.savingsGap < 0) {
    lines.push(`Estimated monthly surplus: ${formatGBP(Math.abs(result.savingsGap))}/mo`);
  }
  return lines.join("\n");
}

function LeadForm({ config, summary }) {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");
  const { primary, accent } = config.theme;

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.consent.checked) {
      setError("Please confirm you're happy to be contacted before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitLead(config, {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        preferredRetirementAge: form.preferredRetirementAge.value,
        message: form.message.value,
        ...(summary && form.includeSummary.checked ? { resultsSummary: buildResultsSummary(summary) } : {}),
      });
      // Count-only beacon, separate from the lead payload above — fires even
      // when that payload goes straight to the partner's own CRM (see
      // leadCapture.js), so submission counts stay ours regardless of mode.
      trackEngagement(config.slug, "enquiry-submitted");
      setSucceeded(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl p-8 text-center bg-white border" style={{ borderColor: `${primary}33` }}>
        <p className="font-serif font-bold text-xl" style={{ color: primary }}>Thanks — {config.adviserContactLabel}.</p>
        <p className="text-sm mt-2" style={{ color: "#8a9599" }}>
          {config.firmName} will use the details you shared to get in touch about your enquiry.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 space-y-4 border" style={{ borderColor: `${primary}22`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="lead-name" className="block text-sm font-medium mb-1" style={{ color: primary }}>Name</label>
          <input id="lead-name" type="text" name="name" required autoComplete="name"
            className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none border" style={{ color: primary, borderColor: "#DAD7C8" }} />
        </div>
        <div>
          <label htmlFor="lead-email" className="block text-sm font-medium mb-1" style={{ color: primary }}>Email</label>
          <input id="lead-email" type="email" name="email" required autoComplete="email" placeholder="you@example.com"
            className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none border" style={{ color: primary, borderColor: "#DAD7C8" }} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="lead-phone" className="block text-sm font-medium mb-1" style={{ color: primary }}>Phone <span style={{ color: "#8a9599" }}>(optional)</span></label>
          <input id="lead-phone" type="tel" name="phone" autoComplete="tel"
            className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none border" style={{ color: primary, borderColor: "#DAD7C8" }} />
        </div>
        <div>
          <label htmlFor="lead-age" className="block text-sm font-medium mb-1" style={{ color: primary }}>Preferred retirement age <span style={{ color: "#8a9599" }}>(optional)</span></label>
          <input id="lead-age" type="number" name="preferredRetirementAge" min="45" max="85"
            className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none border" style={{ color: primary, borderColor: "#DAD7C8" }} />
        </div>
      </div>
      <div>
        <label htmlFor="lead-message" className="block text-sm font-medium mb-1" style={{ color: primary }}>Message <span style={{ color: "#8a9599" }}>(optional)</span></label>
        <textarea id="lead-message" name="message" rows={3}
          className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none border resize-none" style={{ color: primary, borderColor: "#DAD7C8" }} />
      </div>

      {summary && (
        <label className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer" style={{ color: "#8a9599" }}>
          <input type="checkbox" name="includeSummary" defaultChecked={false} className="mt-0.5 shrink-0" />
          Include a summary of my results (target pot, projected pot, monthly gap) so {config.firmName} has some numbers to start with.
        </label>
      )}

      <label className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer" style={{ color: "#8a9599" }}>
        <input type="checkbox" name="consent" defaultChecked={false} className="mt-0.5 shrink-0" />
        {config.consentLabel}
      </label>

      {error && <p className="text-xs" style={{ color: "#E74C3C" }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 px-4 font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-display"
        style={{ backgroundColor: accent, color: primary }}
      >
        {submitting ? "Sending…" : config.adviserCtaLabel}
      </button>

      <p className="text-[11px] leading-relaxed text-center" style={{ color: "#8a9599" }}>
        {config.whiteLabel
          ? `Your details go straight to ${config.firmName} — nothing here stores or sees this enquiry.`
          : `Your details are sent to ${config.firmName} (or its chosen form provider). Route to Retire does not store or see this enquiry.`}
      </p>
    </form>
  );
}

export default function PartnerCalculatorPage({ config }) {
  const { primary, accent } = config.theme;
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    trackVisit(config.slug);
  }, [config.slug]);

  // Partner pages are hosted on Route to Retire's domain but represent the
  // partner's own brand — they shouldn't compete with the partner's own site
  // (or with routetoretire.co.uk) in search results.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  return (
    <div className="overflow-x-clip" style={{ backgroundColor: "#F3F2EA" }}>
      <PartnerHeader config={config} />

      <section className="text-center px-4 pt-14 pb-8 max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center font-display font-bold text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ backgroundColor: `${accent}26`, color: primary }}>
          Retirement Readiness Check
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: primary, fontFamily: "'Source Serif 4', serif" }}>
          {config.tagline}
        </h1>
        <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: "#8a9599" }}>
          Run the numbers on your own retirement plan below. It only takes a minute, and there's no obligation —
          the results are illustrative estimates, not personal advice.
        </p>
      </section>

      <div className="px-4" style={calculatorThemeVars(config.theme)}>
        <div className="max-w-6xl mx-auto">
          <RetirementCalculator embedded initialInputs={config.defaultScenario} enablePdfDownload partnerSlug={config.slug} partnerBrand={config} onSummaryChange={setSummary} />
        </div>
      </div>

      <section id="enquiry" className="px-4 pt-4 pb-16 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: primary, fontFamily: "'Source Serif 4', serif" }}>
            Want to talk through what this means for you?
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "#8a9599" }}>
            {config.firmName} can help you turn this into a plan. Leave your details below and they'll be in touch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#enquiry-form"
              onClick={() => trackEngagement(config.slug, "cta-click")}
              className="inline-flex items-center justify-center gap-2 font-semibold text-sm sm:text-base rounded-full px-7 py-3.5 hover:opacity-90 transition font-display"
              style={{ backgroundColor: accent, color: primary }}
            >
              {config.adviserCtaLabel}
            </a>
          </div>
        </div>

        <div id="enquiry-form" className="pt-4" style={{ scrollMarginTop: 96 }}>
          <LeadForm config={config} summary={summary} />
        </div>

        <p className="text-xs text-center max-w-lg mx-auto leading-relaxed" style={{ color: "#8a9599" }}>
          This calculator is provided for illustration only and does not constitute financial advice. Figures are
          estimates based on the assumptions shown above and can vary significantly from actual outcomes.
        </p>
      </section>

      {!config.whiteLabel && (
        <>
          <AdviserExplainer config={config} />
          <PricingCTA />
        </>
      )}

      <PartnerFooter config={config} />
    </div>
  );
}

// Fetches the real download count for a partner from api/pdf-downloads.js
// (a beacon RetirementCalculator fires after each successful PDF download).
// Unlike the rest of exampleStats, which are static illustrative numbers,
// this one is genuinely live — see the "PDF exports" entry in
// harbourVale.js's buildExampleStats.
function useLiveDownloadStats(partnerSlug) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pdf-downloads?partner=${encodeURIComponent(partnerSlug)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad response"))))
      .then((data) => {
        if (cancelled) return;
        setState(data.configured ? { status: "ready", allTime: data.allTime, thisMonth: data.thisMonth } : { status: "unconfigured" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [partnerSlug]);

  return state;
}

function StatCard({ label, allTime, thisMonth, note }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: "rgba(255,255,255,.06)" }}>
      <div className="font-serif font-bold text-xl mb-3" style={{ color: "#F3F2EA" }}>{label}</div>
      {note ? (
        <p className="text-xs" style={{ color: "rgba(243,242,234,.55)" }}>{note}</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: "rgba(243,242,234,.55)" }}>All time</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "#F3F2EA" }}>{allTime}</span>
          </div>
          <div className="flex items-center justify-between gap-3 mt-1.5 pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,.14)" }}>
            <span className="text-xs" style={{ color: "rgba(243,242,234,.55)" }}>This month</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "#F3F2EA" }}>{thisMonth}</span>
          </div>
        </>
      )}
    </div>
  );
}

function LiveDownloadStatCard({ label, partnerSlug }) {
  const state = useLiveDownloadStats(partnerSlug);
  if (state.status === "ready") {
    return <StatCard label={label} allTime={state.allTime.toLocaleString("en-GB")} thisMonth={state.thisMonth.toLocaleString("en-GB")} />;
  }
  const note = state.status === "loading" ? "Loading…" : state.status === "unconfigured" ? "Not tracked yet" : "Unavailable right now";
  return <StatCard label={label} note={note} />;
}

// A short, clearly-separated "meta" section explaining the pilot to the
// adviser reviewing it. Deliberately styled as a distinct dark panel —
// neither the light Route to Retire palette nor the partner's own theme —
// so it reads as a separate, internal-facing zone rather than part of the
// branded page a client would see.
function AdviserExplainer({ config }) {
  const points = [
    "Built for adviser newsletters and client campaigns",
    "Send clients to a branded retirement-readiness calculator",
    "Receive warmer enquiries with scenario context",
    "Hosted and maintained by Route to Retire",
  ];
  return (
    <section className="py-14" style={{ backgroundColor: "#1E2528" }}>
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="font-display font-semibold text-[11px] uppercase tracking-widest" style={{ color: "#9FC6B8" }}>
            For advisers
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#F3F2EA", fontFamily: "'Source Serif 4', serif" }}>
            Financial Advisor Overview
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(243,242,234,.65)" }}>
            {config.fictional
              ? "This page is a working example of a Route to Retire partner calculator, branded for a fictional firm."
              : `This is a prototype built by Route to Retire to show ${config.firmName} what a branded calculator could look like — not yet a commissioned build.`}
          </p>
          <p className="text-xs max-w-md mx-auto" style={{ color: "rgba(243,242,234,.5)" }}>
            The figures below are illustrative examples of what this dashboard would show, not real activity.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm rounded-2xl px-4 py-3" style={{ backgroundColor: "rgba(255,255,255,.06)", color: "#F3F2EA" }}>
              <span style={{ color: "#9FC6B8" }}>●</span>
              {point}
            </li>
          ))}
        </ul>

        <div>
          <div className="flex justify-center mb-3">
            <span
              className="inline-flex items-center font-display font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,.1)", color: "rgba(243,242,234,.75)", border: "1px solid rgba(255,255,255,.18)" }}
            >
              Illustrative data
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {config.exampleStats.map((stat) =>
              stat.live ? (
                <LiveDownloadStatCard key={stat.label} label={stat.label} partnerSlug={config.slug} />
              ) : (
                <StatCard key={stat.label} {...stat} />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerFooter({ config }) {
  return (
    <footer className="py-10 text-center space-y-3" style={{ backgroundColor: "#F3F2EA" }}>
      <p className="text-xs" style={{ color: "#8a9599" }}>
        {config.whiteLabel ? (
          "For illustrative purposes only — not financial advice."
        ) : (
          <>
            Calculator hosted and maintained by{" "}
            <Link to="/" style={{ color: "#1B6F81" }}>Route to Retire</Link>.
            For illustrative purposes only — not financial advice.
          </>
        )}
      </p>
      <nav className="flex items-center justify-center gap-4 text-xs font-medium flex-wrap">
        <Link to={config.whiteLabel ? "/partners/methodology" : "/methodology"} style={{ color: "#1B6F81" }}>Methodology</Link>
        <span style={{ color: "#DAD7C8" }}>·</span>
        <Link to={config.whiteLabel ? "/partners/disclaimer" : "/disclaimer"} style={{ color: "#1B6F81" }}>Disclaimer</Link>
        <span style={{ color: "#DAD7C8" }}>·</span>
        <Link to={config.whiteLabel ? "/partners/privacy" : "/privacy"} style={{ color: "#1B6F81" }}>Privacy</Link>
      </nav>
      {!config.whiteLabel && (
        <p className="text-[11px]" style={{ color: "#8a9599" }}>
          {config.fictional
            ? `${config.firmName} is a fictional firm used for demonstration only.`
            : `This is a Route to Retire prototype and is not affiliated with or endorsed by ${config.firmName}.`}
        </p>
      )}
    </footer>
  );
}
