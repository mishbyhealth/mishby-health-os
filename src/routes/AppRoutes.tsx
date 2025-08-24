// src/routes/AppRoutes.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Use RELATIVE imports (no "@") so it works in your setup
import HomePage from "../pages/HomePage";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import HealthPlanFlow from "../pages/HealthPlanFlow";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* ✅ Our new non-clinical flow */}
        <Route path="/health-plan" element={<HealthPlanFlow />} />

        {/* Optional: if someone opens /health-plan/view by mistake, redirect them */}
        <Route path="/health-plan/view" element={<Navigate to="/health-plan" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
