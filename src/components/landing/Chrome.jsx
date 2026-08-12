import { useState } from "react";
import { Link } from "../../lib/Link.jsx";
import logoNavy from "../../assets/rr-navy.png";

// ─── Shared site chrome ───────────────────────────────────────────────────────
// Header, footer and small building blocks reused across every marketing page
// (Home, Pro, Resources) plus the calculator page's header, so the site reads
// as one product rather than a homepage bolted onto separate pages.

export const NAVY = "#09324A";
export const TEAL = "#1B6F81";
export const YELLOW = "#FFFB08";
export const FENNEC = "#DAD7C8";
export const CREAM = "#F3F2EA";
export const MINT_TINT = "#E7F1EF";
export const BAND = "#E7E6DC";
export const BODY = "#4a5a5f";
export const MUTED = "#8a9599";

export function Container({ children, className = "" }) {
  return <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function Eyebrow({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{ width: 26, height: 2, backgroundColor: TEAL }} />
      <span className="font-display font-semibold text-[12px] uppercase" style={{ letterSpacing: ".14em", color: TEAL }}>
        {children}
      </span>
    </div>
  );
}

export function IconCircle({ children }) {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0" style={{ backgroundColor: MINT_TINT, color: NAVY }}>
      {children}
    </div>
  );
}

export function PrimaryCTA({ href, to, onClick, children }) {
  const className = "inline-flex items-center justify-center gap-2 font-semibold text-[15px] sm:text-base rounded-full px-7 py-3.5 transition hover:opacity-90 font-display";
  const style = { backgroundColor: YELLOW, color: NAVY, boxShadow: "0 10px 26px -10px rgba(255,251,8,.55)" };
  if (to) return <Link to={to} onClick={onClick} className={className} style={style}>{children}</Link>;
  return <a href={href} onClick={onClick} className={className} style={style}>{children}</a>;
}

export function SecondaryCTA({ href, to, onClick, dark, children }) {
  const className = "inline-flex items-center justify-center gap-2 font-semibold text-[15px] sm:text-base rounded-full px-6 py-3 transition hover:opacity-70 font-display";
  const style = dark ? { color: "#F3F2EA", border: "1.5px solid rgba(243,242,234,.35)" } : { color: NAVY, border: "1.5px solid rgba(9,50,74,.2)" };
  if (to) return <Link to={to} onClick={onClick} className={className} style={style}>{children}</Link>;
  return <a href={href} onClick={onClick} className={className} style={style}>{children}</a>;
}

export function Logo({ size = 34 }) {
  return <img src={logoNavy} alt="" width={size} height={size} style={{ width: size, height: size, display: "block" }} />;
}

// ─── Header ─────────────────────────────────────────────────────────────────────
// Nav items that point at homepage sections use absolute "/#id" anchors (not the
// SPA <Link>) so they work correctly from every page: same-document hash-scroll
// when already on "/", full navigation + scroll-on-mount (see App.jsx) otherwise.

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-40"
      style={{ backgroundColor: "rgba(243,242,234,.92)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderBottom: "1px solid rgba(9,50,74,.08)" }}
    >
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center gap-2.5 font-serif font-bold text-xl" style={{ color: NAVY, letterSpacing: "-.01em" }}>
          <Logo size={32} />
          Route to Retire
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium" style={{ color: NAVY }}>
          <Link to="/check">Check</Link>
          <a href="/#how-it-works">How it works</a>
          <Link to="/resources">Resources</Link>
          <Link to="/pro">Pro</Link>
          <a href="/#trust">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/check"
            className="hidden sm:inline-flex font-semibold text-sm rounded-full px-6 py-2.5 hover:opacity-90 transition font-display"
            style={{ backgroundColor: YELLOW, color: NAVY }}
          >
            Start my check
          </Link>
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
            <Link to="/check" onClick={() => setOpen(false)} className="py-2">Check</Link>
            <a href="/#how-it-works" onClick={() => setOpen(false)} className="py-2">How it works</a>
            <Link to="/resources" onClick={() => setOpen(false)} className="py-2">Resources</Link>
            <Link to="/pro" onClick={() => setOpen(false)} className="py-2">Pro</Link>
            <a href="/#trust" onClick={() => setOpen(false)} className="py-2">About</a>
            <Link
              to="/check"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex justify-center font-semibold text-sm rounded-full px-6 py-2.5 font-display"
              style={{ backgroundColor: YELLOW, color: NAVY }}
            >
              Start my check
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────────

export function LandingFooter() {
  return (
    <footer className="pt-14 pb-10" style={{ borderTop: `1px solid ${FENNEC}` }}>
      <Container>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <Link to="/" className="flex items-center gap-2.5 font-serif font-bold text-xl" style={{ color: NAVY }}>
            <Logo size={26} />
            Route to Retire
          </Link>
          <span className="text-sm" style={{ color: MUTED }}>Pension planning, made plain.</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium mb-6" style={{ color: TEAL }}>
          <Link to="/methodology">Assumptions</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/disclaimer">Terms</Link>
          <a href="/#providers">Affiliate disclosure</a>
          <a href="/#advisers">For advisers</a>
          <a href="/#get-in-touch">Contact</a>
        </nav>
        <p className="text-xs leading-relaxed max-w-2xl" style={{ color: MUTED }}>
          Route to Retire provides educational tools and projections based on the assumptions you enter. It is not financial
          advice. Pension and investment decisions can affect your future income and tax position.
        </p>
      </Container>
    </footer>
  );
}
