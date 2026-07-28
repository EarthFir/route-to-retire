import RetirementCalculator from "./components/RetirementCalculator";
import Methodology from "./pages/Methodology.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Privacy from "./pages/Privacy.jsx";
import { useRoute } from "./lib/router.js";

function App() {
  const path = useRoute();

  switch (path) {
    case "/methodology":
      return <Methodology />;
    case "/disclaimer":
      return <Disclaimer />;
    case "/privacy":
      return <Privacy />;
    default:
      return <RetirementCalculator />;
  }
}

export default App;
