import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { WEALTH_OF_ADVICE } from "../../lib/partners/wealthOfAdvice.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function WealthOfAdvice() {
  usePageTitle(
    `${WEALTH_OF_ADVICE.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${WEALTH_OF_ADVICE.firmName}, powered by Route to Retire.`,
  );
  return <PartnerCalculatorPage config={WEALTH_OF_ADVICE} />;
}
