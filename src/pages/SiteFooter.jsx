import { Link } from "../lib/Link.jsx";

// ─── Site Footer ──────────────────────────────────────────────────────────────
// Concise disclaimer plus links to the informational pages. Shared by the
// calculator and every content page so the disclaimer is present app-wide.

export default function SiteFooter() {
  return (
    <footer className="mt-8 pt-6 pb-8 max-w-2xl mx-auto text-center space-y-3" style={{ borderTop: '1px solid #DAD7C8' }}>
      <p className="text-xs leading-relaxed" style={{ color: '#8a9599' }}>
        For illustrative purposes only. Route to Retire does not provide financial advice,
        tax advice or personal recommendations.
      </p>
      <nav className="flex items-center justify-center gap-4 text-xs font-medium flex-wrap">
        <Link to="/check" style={{ color: '#1B6F81' }}>Calculator</Link>
        <span style={{ color: '#DAD7C8' }}>·</span>
        <Link to="/methodology" style={{ color: '#1B6F81' }}>Methodology</Link>
        <span style={{ color: '#DAD7C8' }}>·</span>
        <Link to="/disclaimer" style={{ color: '#1B6F81' }}>Disclaimer</Link>
        <span style={{ color: '#DAD7C8' }}>·</span>
        <Link to="/privacy" style={{ color: '#1B6F81' }}>Privacy</Link>
      </nav>
    </footer>
  );
}
