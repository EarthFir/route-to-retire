import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { INFORMED_FINANCIAL_PLANNING } from "../../lib/partners/informedFinancialPlanning.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function InformedFinancialPlanning() {
  usePageTitle(
    `${INFORMED_FINANCIAL_PLANNING.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${INFORMED_FINANCIAL_PLANNING.firmName}, powered by Route to Retire.`,
  );
  return <PartnerCalculatorPage config={INFORMED_FINANCIAL_PLANNING} />;
}
