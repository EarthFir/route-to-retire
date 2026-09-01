import PartnerStatsPage from "../../components/partners/PartnerStatsPage.jsx";
import { WEALTH_OF_ADVICE } from "../../lib/partners/wealthOfAdvice.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function WealthOfAdviceStats() {
  usePageTitle(`${WEALTH_OF_ADVICE.firmName} - Stats`);
  return <PartnerStatsPage config={WEALTH_OF_ADVICE} />;
}
