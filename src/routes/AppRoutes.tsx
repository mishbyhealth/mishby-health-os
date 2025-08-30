// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages (अपने प्रोजेक्ट में जो नाम/पथ हैं वही रखें)
import Dashboard from "@/pages/Dashboard";
import HealthForm from "@/pages/HealthForm";          // यदि अलग नाम/फ़ोल्डर है तो वही import करें
import HealthPlan from "@/pages/HealthPlan";
import PlansHistory from "@/pages/PlansHistory";      // /plans-v2/history page component
import DonatePage from "@/pages/Donate";
import AboutPage from "@/pages/About";

// Layout (Header + SideNav + <Outlet/>)
import MainLayout from "@/layouts/MainLayout";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root → /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* App Shell */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/health-form" element={<HealthForm />} />
        <Route path="/health-plan" element={<HealthPlan />} />
        <Route path="/plans-v2/history" element={<PlansHistory />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<div style={{ padding: 16 }}>Not found</div>} />
    </Routes>
  );
}
