import { Routes, Route } from "react-router-dom";
import Shell from "./layouts/Shell";

import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import HealthForm from "./pages/HealthForm";
import HealthPlan from "./pages/HealthPlan";
import Plans from "./pages/Plans";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import DonatePage from "./pages/Donate";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Ping from "./pages/Ping";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Welcome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/health-form" element={<HealthForm />} />
        <Route path="/health-plan" element={<HealthPlan />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/_ping" element={<Ping />} />
      </Route>
    </Routes>
  );
}
