// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import HealthForm from "./pages/HealthForm";
import HealthPlan from "./pages/HealthPlan";
import PlansHistory from "./pages/PlansHistory";
import PlanDetail from "./pages/PlanDetail"; // if this file doesn't exist, remove this line & its route
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Ping from "./pages/Ping";

export default function App() {
  return (
    <Routes>
      {/* Root app shell */}
      <Route path="/" element={<MainLayout />}>
        {/* Home */}
        <Route index element={<Welcome />} />

        {/* Core (NOTE: relative child paths, no leading slash) */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="health-form" element={<HealthForm />} />
        <Route path="health-plan" element={<HealthPlan />} />
        <Route path="plans" element={<PlansHistory />} />
        <Route path="plans/:id" element={<PlanDetail />} />
        <Route path="settings" element={<Settings />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="_ping" element={<Ping />} />

        {/* Fallback inside the app shell */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
