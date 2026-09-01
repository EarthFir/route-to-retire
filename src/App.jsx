import Home from "./pages/Home.jsx";
import Check from "./pages/Check.jsx";
import Pro from "./pages/Pro.jsx";
import Resources from "./pages/Resources.jsx";
import Methodology from "./pages/Methodology.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Partners from "./pages/Partners.jsx";
import PartnerPreview from "./pages/partners/PartnerPreview.jsx";
import HarbourVale from "./pages/partners/HarbourVale.jsx";
import HarbourValeStats from "./pages/partners/HarbourValeStats.jsx";
import SimpsonFS from "./pages/partners/SimpsonFS.jsx";
import SimpsonFSStats from "./pages/partners/SimpsonFSStats.jsx";
import InnesReid from "./pages/partners/InnesReid.jsx";
import InnesReidStats from "./pages/partners/InnesReidStats.jsx";
import Acumen from "./pages/partners/Acumen.jsx";
import AcumenStats from "./pages/partners/AcumenStats.jsx";
import ChurchillWm from "./pages/partners/ChurchillWm.jsx";
import ChurchillWmStats from "./pages/partners/ChurchillWmStats.jsx";
import Hartsfield from "./pages/partners/Hartsfield.jsx";
import HartsfieldStats from "./pages/partners/HartsfieldStats.jsx";
import HowardWright from "./pages/partners/HowardWright.jsx";
import HowardWrightStats from "./pages/partners/HowardWrightStats.jsx";
import InformedFinancialPlanning from "./pages/partners/InformedFinancialPlanning.jsx";
import InformedFinancialPlanningStats from "./pages/partners/InformedFinancialPlanningStats.jsx";
import Kellands from "./pages/partners/Kellands.jsx";
import KellandsStats from "./pages/partners/KellandsStats.jsx";
import Pareto from "./pages/partners/Pareto.jsx";
import ParetoStats from "./pages/partners/ParetoStats.jsx";
import WealthOfAdvice from "./pages/partners/WealthOfAdvice.jsx";
import WealthOfAdviceStats from "./pages/partners/WealthOfAdviceStats.jsx";
import PartnerMethodology from "./pages/partners/PartnerMethodology.jsx";
import PartnerDisclaimer from "./pages/partners/PartnerDisclaimer.jsx";
import PartnerPrivacy from "./pages/partners/PartnerPrivacy.jsx";
import { useRoute } from "./lib/router.js";

function App() {
  const path = useRoute();

  switch (path) {
    case "/your-route":
      return <Check />;
    case "/pro":
      return <Pro />;
    case "/resources":
      return <Resources />;
    case "/methodology":
      return <Methodology />;
    case "/disclaimer":
      return <Disclaimer />;
    case "/privacy":
      return <Privacy />;
    case "/terms":
      return <Terms />;
    case "/partners":
      return <Partners />;
    case "/partners/preview":
      return <PartnerPreview />;
    case "/partners/methodology":
      return <PartnerMethodology />;
    case "/partners/disclaimer":
      return <PartnerDisclaimer />;
    case "/partners/privacy":
      return <PartnerPrivacy />;
    case "/partners/harbour-vale":
      return <HarbourVale />;
    case "/partners/harbour-vale/stats":
      return <HarbourValeStats />;
    case "/partners/simpsonfs":
      return <SimpsonFS />;
    case "/partners/simpsonfs/stats":
      return <SimpsonFSStats />;
    case "/partners/innes-reid":
      return <InnesReid />;
    case "/partners/innes-reid/stats":
      return <InnesReidStats />;
    case "/partners/acumen":
      return <Acumen />;
    case "/partners/acumen/stats":
      return <AcumenStats />;
    case "/partners/churchill-wm":
      return <ChurchillWm />;
    case "/partners/churchill-wm/stats":
      return <ChurchillWmStats />;
    case "/partners/hartsfield":
      return <Hartsfield />;
    case "/partners/hartsfield/stats":
      return <HartsfieldStats />;
    case "/partners/howard-wright":
      return <HowardWright />;
    case "/partners/howard-wright/stats":
      return <HowardWrightStats />;
    case "/partners/informed-fp":
      return <InformedFinancialPlanning />;
    case "/partners/informed-fp/stats":
      return <InformedFinancialPlanningStats />;
    case "/partners/kellands":
      return <Kellands />;
    case "/partners/kellands/stats":
      return <KellandsStats />;
    case "/partners/pareto":
      return <Pareto />;
    case "/partners/pareto/stats":
      return <ParetoStats />;
    case "/partners/wealth-of-advice":
      return <WealthOfAdvice />;
    case "/partners/wealth-of-advice/stats":
      return <WealthOfAdviceStats />;
    default:
      return <Home />;
  }
}

export default App;
