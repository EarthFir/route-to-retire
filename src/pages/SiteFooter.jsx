import { Link } from "../lib/Link.jsx";

// ─── Site Footer ──────────────────────────────────────────────────────────────
// Concise disclaimer plus links to the informational pages. Shared by the
// calculator and every content page so the disclaimer is present app-wide.

export default function SiteFooter() {
  return (
    <footer className="mt-8 pt-6 pb-8 max-w-2xl mx-auto text-center space-y-3" style={{ borderTop: '1px solid #E6E8EC' }}>
      <p className="text-xs leading-relaxed" style={{ color: '#A0A4AB' }}>
        For illustrative purposes only. Route to Retire does not provide financial advice,
        tax advice or personal recommendations.
      </p>
      <nav className="flex items-center justify-center gap-4 text-xs font-medium flex-wrap">
        <Link to="/" style={{ color: '#B8860B' }}>Calculator</Link>
        <span style={{ color: '#D0D5DD' }}>·</span>
        <Link to="/methodology" style={{ color: '#B8860B' }}>Methodology</Link>
        <span style={{ color: '#D0D5DD' }}>·</span>
        <Link to="/disclaimer" style={{ color: '#B8860B' }}>Disclaimer</Link>
        <span style={{ color: '#D0D5DD' }}>·</span>
        <Link to="/privacy" style={{ color: '#B8860B' }}>Privacy</Link>
      </nav>
    </footer>
  );
}
