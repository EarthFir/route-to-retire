import RetirementCalculator from "../components/RetirementCalculator.jsx";
import { Header } from "../components/landing/Chrome.jsx";

// ─── Full calculator page ────────────────────────────────────────────────────
// The real, detailed calculator (all inputs, chart, scenarios, assumptions)
// lives here so it has a stable, linkable URL. Keeps the site's sticky nav on
// top; the calculator supplies its own title, feedback form and footer below.

export default function Check() {
  return (
    <div className="overflow-x-clip">
      <Header />
      <RetirementCalculator />
    </div>
  );
}
