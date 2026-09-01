import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { PARETO } from "../../lib/partners/pareto.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function ParetoStats() {
  usePageTitle(`${PARETO.firmName} - Stats`);
  return <PartnerStatsPage config={PARETO} />;
}
