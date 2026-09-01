import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { PARETO } from "../../lib/partners/pareto.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function Pareto() {
  usePageTitle(
    `${PARETO.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${PARETO.firmName}, powered by Route to Retire.`,
  );
  return <PartnerCalculatorPage config={PARETO} />;
}
