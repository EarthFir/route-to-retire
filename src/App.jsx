import RetirementCalculator from "./components/RetirementCalculator";
import Home from "./pages/Home.jsx";
import Methodology from "./pages/Methodology.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Privacy from "./pages/Privacy.jsx";
import { useRoute } from "./lib/router.js";

function App() {
  const path = useRoute();

  switch (path) {
    case "/calculator":
      return <RetirementCalculator />;
    case "/methodology":
      return <Methodology />;
    case "/disclaimer":
      return <Disclaimer />;
    case "/privacy":
      return <Privacy />;
    default:
      return <Home />;
  }
}

export default App;
