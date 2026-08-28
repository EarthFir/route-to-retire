import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { INFORMED_FINANCIAL_PLANNING } from "../../lib/partners/informedFinancialPlanning.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function InformedFinancialPlanningStats() {
  usePageTitle(`${INFORMED_FINANCIAL_PLANNING.firmName} - Stats`);
  return <PartnerStatsPage config={INFORMED_FINANCIAL_PLANNING} />;
}
