import { useEffect, useRef, useState } from "react";
import {
  NAVY, TEAL, FENNEC, BAND, BODY, MUTED,
  Container, Eyebrow, Header, LandingFooter,
} from "../../components/landing/Chrome.jsx";
import RetirementCalculator from "../../components/RetirementCalculator.jsx";
import { calculatorThemeVars } from "../../lib/partners/theme.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

// ─── Self-serve branded calculator preview ─────────────────────────────────────
// The destination for every "See your branded calculator" CTA on /partners.
// Lets a visiting adviser type their brand colours and drop in a logo, and see
// their own branded calculator render live — no account, no backend storage.
// Submitting the form at the bottom sends everything (including the logo file)
// to the same Formspree inbox as the homepage "Get in touch" form, since this
// is a genuine sales enquiry, not a marketing-list signup. There is no
// automated provisioning behind this yet — see docs/roadmap.md and
// docs/client-onboarding.md — a person still builds the real page by hand
// after this comes through.

const PREVIEW_SCENARIO = {
  currentAge: 45,
  retirementAge: 65,
  currentSavings: 150000,
  monthlySavingsCurrent: 500,
  desiredIncome: 30000,
};

const DEFAULT_COLORS = {
  primary: "#09324A",
  secondary: "#1B6F81",
  accent: "#FFFB08",
};

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xbdqvqby";

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: NAVY }}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border cursor-pointer shrink-0"
          style={{ borderColor: FENNEC, padding: 2, backgroundColor: "white" }}
          aria-label={`${label} colour picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none uppercase"
          style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
          maxLength={7}
        />
      </div>
    </div>
  );
}

function MiniPreviewCard({ firmName, tagline, logoUrl, colors }) {
  return (
    <div className="rounded-3xl p-5" style={{ backgroundColor: "white", border: `1px solid ${FENNEC}`, boxShadow: "0 20px 44px -28px rgba(9,50,74,.35)" }}>
      <div className="flex items-center gap-1.5 mb-4">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FENNEC }} />
        <span className="ml-3 text-xs font-medium truncate" style={{ color: MUTED }}>
          calculator.{(firmName || "yourfirm").toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourfirm"}.co.uk
        </span>
      </div>
      <div className="rounded-2xl p-5 flex items-center justify-between gap-3 mb-3" style={{ backgroundColor: BAND }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-8 w-auto max-w-[120px] object-contain shrink-0" />
          ) : (
            <div className="font-serif font-bold text-lg truncate" style={{ color: colors.primary }}>
              {firmName || "Your Firm Name"}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-2xl p-5" style={{ background: `linear-gradient(158deg, ${colors.primary}, #061f2e)` }}>
        <div className="flex items-center justify-between mb-4 gap-2">
          <span className="font-display font-semibold text-[11px] uppercase tracking-widest" style={{ color: colors.secondary }}>
            {tagline || "Your tagline here"}
          </span>
        </div>
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-sm" style={{ color: "rgba(243,242,234,.82)" }}>Projected pot</span>
          <span className="font-serif font-bold text-2xl" style={{ color: colors.accent }}>£287k</span>
        </div>
        <div className="h-1.5 rounded-full relative" style={{ backgroundColor: "rgba(243,242,234,.15)" }}>
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "62%", backgroundColor: colors.accent }} />
        </div>
      </div>
    </div>
  );
}

function LivePreviewHeader({ firmName, logoUrl, colors }) {
  return (
    <div className="bg-white" style={{ borderBottom: `1px solid ${colors.primary}22` }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-8 sm:h-9 w-auto max-w-[180px] object-contain" />
        ) : (
          <div className="font-serif font-bold text-lg sm:text-xl" style={{ color: colors.primary }}>
            {firmName || "Your Firm Name"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PartnerPreview() {
  usePageTitle(
    "See Your Branded Calculator",
    "Enter your firm's colours and logo and see a live preview of your branded Route to Retire calculator.",
  );

  const [firmName, setFirmName] = useState("");
  const [tagline, setTagline] = useState("");
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoUrl("");
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    setLogoFile(file || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firmName.trim() || !contactEmail.trim()) {
      setError("Firm name and email are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("_subject", "New branded calculator request");
      formData.append("topic", "adviser");
      formData.append("firmName", firmName);
      formData.append("tagline", tagline);
      formData.append("primaryColor", colors.primary);
      formData.append("secondaryColor", colors.secondary);
      formData.append("accentColor", colors.accent);
      formData.append("name", contactName);
      formData.append("email", contactEmail);
      if (logoFile) formData.append("logo", logoFile);

      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Something went wrong sending your details. Please try again.");
      setSucceeded(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-x-hidden">
      <Header />

      <section className="pt-14 pb-10 sm:pt-16">
        <Container>
          <Eyebrow>Preview</Eyebrow>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl mb-3 max-w-2xl" style={{ color: NAVY, letterSpacing: "-.02em" }}>
            See your branded calculator.
          </h1>
          <p className="text-[15px] leading-relaxed max-w-xl" style={{ color: BODY }}>
            Add your colours and logo below and the calculator underneath updates live, so you can see roughly what your
            firm's page would look like. This is a preview only — nothing here is saved or published. Submit your
            details at the bottom and we'll build the real thing.
          </p>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_.85fr] gap-10 items-start mb-14">
              <div className="space-y-4 bg-white rounded-3xl p-6 sm:p-8" style={{ border: `1px solid ${FENNEC}`, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pv-firm" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>Firm name</label>
                    <input
                      id="pv-firm" type="text" value={firmName} onChange={(e) => setFirmName(e.target.value)}
                      placeholder="Acme Financial Planning" required
                      className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none"
                      style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
                    />
                  </div>
                  <div>
                    <label htmlFor="pv-tagline" className="block text-sm font-medium mb-1" style={{ color: NAVY }}>Tagline <span style={{ color: MUTED }}>(optional)</span></label>
                    <input
                      id="pv-tagline" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                      placeholder="Independent advice, built around you"
                      className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none"
                      style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ColorField label="Primary" value={colors.primary} onChange={(v) => setColors((c) => ({ ...c, primary: v }))} />
                  <ColorField label="Secondary" value={colors.secondary} onChange={(v) => setColors((c) => ({ ...c, secondary: v }))} />
                  <ColorField label="Accent" value={colors.accent} onChange={(v) => setColors((c) => ({ ...c, accent: v }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: NAVY }}>Logo <span style={{ color: MUTED }}>(optional — SVG or PNG, transparent background works best)</span></label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-semibold rounded-2xl px-4 py-2.5 border"
                      style={{ color: NAVY, borderColor: FENNEC }}
                    >
                      {logoFile ? "Change logo" : "Upload logo"}
                    </button>
                    {logoFile && <span className="text-xs truncate" style={{ color: MUTED }}>{logoFile.name}</span>}
                    <input ref={fileInputRef} type="file" accept="image/svg+xml,image/png,image/jpeg" onChange={handleLogoChange} className="hidden" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" style={{ borderTop: `1px solid ${FENNEC}` }}>
                  <div>
                    <label htmlFor="pv-name" className="block text-sm font-medium mb-1 mt-3" style={{ color: NAVY }}>Your name</label>
                    <input
                      id="pv-name" type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name"
                      className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none"
                      style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
                    />
                  </div>
                  <div>
                    <label htmlFor="pv-email" className="block text-sm font-medium mb-1 mt-3" style={{ color: NAVY }}>Email</label>
                    <input
                      id="pv-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required autoComplete="email"
                      placeholder="you@yourfirm.co.uk"
                      className="w-full py-2.5 px-3 font-medium bg-white rounded-2xl outline-none"
                      style={{ color: NAVY, border: `1px solid ${FENNEC}` }}
                    />
                  </div>
                </div>

                {error && <p className="text-xs" style={{ color: "#E74C3C" }}>{error}</p>}

                {succeeded ? (
                  <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: BAND }}>
                    <p className="font-serif font-bold" style={{ color: NAVY }}>Thanks — we've got it.</p>
                    <p className="text-sm mt-1" style={{ color: MUTED }}>We'll be in touch about getting your branded calculator live.</p>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-display"
                    style={{ backgroundColor: "#FFFB08", color: NAVY }}
                  >
                    {submitting ? "Sending…" : "Send my details"}
                  </button>
                )}
              </div>

              <div className="lg:sticky lg:top-24">
                <MiniPreviewCard firmName={firmName} tagline={tagline} logoUrl={logoUrl} colors={colors} />
              </div>
            </div>
          </form>

          <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${FENNEC}` }}>
            <LivePreviewHeader firmName={firmName} logoUrl={logoUrl} colors={colors} />
            <div className="px-4 pt-6 pb-8" style={{ backgroundColor: "#F3F2EA", ...calculatorThemeVars(colors) }}>
              <p className="text-center text-xs mb-4" style={{ color: MUTED }}>
                Live preview with example numbers — your version would carry your own default scenario.
              </p>
              <RetirementCalculator embedded initialInputs={PREVIEW_SCENARIO} />
            </div>
          </div>
        </Container>
      </section>

      <LandingFooter />
    </div>
  );
}
