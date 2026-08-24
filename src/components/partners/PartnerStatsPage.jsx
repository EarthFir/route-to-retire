import { useEffect, useState } from "react";
import { Link } from "../../lib/Link.jsx";

// ─── Private partner stats dashboard ───────────────────────────────────────────
// Read-only view of real engagement numbers for one partner: visits, CTA
// clicks, enquiries submitted, PDF exports, and a derived conversion rate,
// each with an all-time and this-month figure. Backed by api/partner-stats.js,
// which requires the same ?key= this page was opened with — so the URL
// itself (config.slug + config.statsKey) is the thing to share, with the
// partner and with yourself, rather than a login.
//
// Deliberately plain and internal-facing: no partner theming, no marketing
// copy, just the numbers a firm (or Route to Retire) would check in on.

function readKeyFromUrl() {
  return new URLSearchParams(window.location.search).get("key") || "";
}

function useStats(partnerSlug, key) {
  const [state, setState] = useState({ status: key ? "loading" : "missing-key" });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/partner-stats?partner=${encodeURIComponent(partnerSlug)}&key=${encodeURIComponent(key)}`)
      .then((res) => {
        if (res.status === 401) return Promise.reject(new Error("unauthorized"));
        return res.ok ? res.json() : Promise.reject(new Error("bad response"));
      })
      .then((data) => {
        if (cancelled) return;
        setState(data.configured ? { status: "ready", data } : { status: "unconfigured" });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: err.message === "unauthorized" ? "unauthorized" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [partnerSlug, key]);

  return state;
}

function formatCount(n) {
  return n.toLocaleString("en-GB");
}

function formatConversion(enquiries, visits) {
  if (!visits) return "—";
  return `${((enquiries / visits) * 100).toFixed(1)}%`;
}

function Tile({ label, allTime, thisMonth }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: "rgba(255,255,255,.06)" }}>
      <div className="font-serif font-bold text-lg mb-3" style={{ color: "#F3F2EA" }}>{label}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: "rgba(243,242,234,.55)" }}>All time</span>
        <span className="text-base font-semibold tabular-nums font-display" style={{ color: "#F3F2EA" }}>{allTime}</span>
      </div>
      <div className="flex items-center justify-between gap-3 mt-1.5 pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,.14)" }}>
        <span className="text-xs" style={{ color: "rgba(243,242,234,.55)" }}>This month</span>
        <span className="text-base font-semibold tabular-nums font-display" style={{ color: "#F3F2EA" }}>{thisMonth}</span>
      </div>
    </div>
  );
}

function Message({ children }) {
  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <p className="text-sm leading-relaxed" style={{ color: "rgba(243,242,234,.75)" }}>{children}</p>
    </div>
  );
}

export default function PartnerStatsPage({ config }) {
  const [key] = useState(readKeyFromUrl);
  const state = useStats(config.slug, key);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1E2528" }}>
      <header className="max-w-4xl mx-auto px-4 pt-10 pb-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-display font-semibold text-[11px] uppercase tracking-widest" style={{ color: "#9FC6B8" }}>
            Private stats
          </div>
          <h1 className="font-serif font-bold text-2xl mt-1" style={{ color: "#F3F2EA" }}>{config.firmName}</h1>
        </div>
        <Link to="/" className="text-xs font-medium shrink-0" style={{ color: "rgba(243,242,234,.5)" }}>
          Route to Retire
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        {state.status === "missing-key" && (
          <Message>This page needs the full link with a key to show any numbers — check the one shared with you rather than a bookmark of just the page path.</Message>
        )}
        {state.status === "loading" && <Message>Loading…</Message>}
        {state.status === "unauthorized" && (
          <Message>That key isn't valid for {config.firmName}. Double-check the link, or ask Route to Retire to resend it.</Message>
        )}
        {state.status === "unconfigured" && <Message>Tracking isn't connected yet — nothing to show here so far.</Message>}
        {state.status === "error" && <Message>Couldn't load stats right now. Try refreshing in a moment.</Message>}

        {state.status === "ready" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Tile label="Visits" allTime={formatCount(state.data.visit.allTime)} thisMonth={formatCount(state.data.visit.thisMonth)} />
            <Tile label="&ldquo;Discuss&rdquo; CTA clicks" allTime={formatCount(state.data.ctaClick.allTime)} thisMonth={formatCount(state.data.ctaClick.thisMonth)} />
            <Tile label="Enquiries submitted" allTime={formatCount(state.data.enquirySubmitted.allTime)} thisMonth={formatCount(state.data.enquirySubmitted.thisMonth)} />
            <Tile label="PDF summaries exported" allTime={formatCount(state.data.pdfExports.allTime)} thisMonth={formatCount(state.data.pdfExports.thisMonth)} />
            <Tile
              label="Visit → enquiry conversion"
              allTime={formatConversion(state.data.enquirySubmitted.allTime, state.data.visit.allTime)}
              thisMonth={formatConversion(state.data.enquirySubmitted.thisMonth, state.data.visit.thisMonth)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
