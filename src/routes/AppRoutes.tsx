import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import Dashboard from "../pages/Dashboard";
import HealthPlan from "../pages/HealthPlan";
import Profile from "../pages/Profile";
import About from "../pages/About";

// NOTE: अपनी ऐप स्ट्रक्चर के हिसाब से यह Routes <App> के भीतर render होता है
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/health-plan" element={<HealthPlan />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/about" element={<About />} />
      {/* पुराना/गलत URL हो तो Dashboard पर ले जाएँ */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
