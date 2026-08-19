import RetirementCalculator from "../components/RetirementCalculator.jsx";
import { Header } from "../components/landing/Chrome.jsx";
import { usePageTitle } from "../lib/usePageTitle.js";

// ─── Full calculator page ────────────────────────────────────────────────────
// The real, detailed calculator (all inputs, chart, scenarios, assumptions)
// lives here so it has a stable, linkable URL. Keeps the site's sticky nav on
// top; the calculator supplies its own title and footer below.

export default function Check() {
  usePageTitle(
    "The One-Minute Retirement Check - Route to Retire",
    "Run the full Route to Retire calculator to see whether your pension is on track and what you could do next.",
  );

  return (
    <div className="overflow-x-clip">
      <Header />
      <RetirementCalculator />
    </div>
  );
}
