import PartnerCalculatorPage from "../../components/partners/PartnerCalculatorPage.jsx";
import { HOWARD_WRIGHT } from "../../lib/partners/howardWright.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function HowardWright() {
  usePageTitle(
    `${HOWARD_WRIGHT.firmName} - Retirement Readiness Check`,
    `A retirement calculator prototype built for ${HOWARD_WRIGHT.firmName}, powered by Route to Retire.`,
  );
  return <PartnerCalculatorPage config={HOWARD_WRIGHT} />;
}
