import React from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "../pages/HomePage";
import Dashboard from "../pages/Dashboard";
import HealthPlan from "../pages/HealthPlan";
import Profile from "../pages/Profile";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/health-plan" element={<HealthPlan />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
