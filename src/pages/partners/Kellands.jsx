import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { KELLANDS } from "../../lib/partners/kellands.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function Kellands() {
  usePageTitle(
    `${KELLANDS.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${KELLANDS.firmName}, powered by Route to Retire.`,
  );
  return <PartnerCalculatorPage config={KELLANDS} />;
}
