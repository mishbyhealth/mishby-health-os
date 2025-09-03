// src/routes/AppRoutes.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";

// Lazy pages (flat /pages directory)
const HomePage = lazy(() => import("@/pages/HomePage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const HealthForm = lazy(() => import("@/pages/HealthForm"));
const HealthPlan = lazy(() => import("@/pages/HealthPlan"));
const PlansHistory = lazy(() => import("@/pages/PlansHistory"));
const PlanDetail = lazy(() => import("@/pages/PlanDetail"));
const Settings = lazy(() => import("@/pages/Settings"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <MainLayout>
                <Profile />
              </MainLayout>
            }
          />
          <Route
            path="/health-form"
            element={
              <MainLayout>
                <HealthForm />
              </MainLayout>
            }
          />
          <Route
            path="/health-plan"
            element={
              <MainLayout>
                <HealthPlan />
              </MainLayout>
            }
          />
          <Route
            path="/plans"
            element={
              <MainLayout>
                <PlansHistory />
              </MainLayout>
            }
          />
          <Route
            path="/plans/:id"
            element={
              <MainLayout>
                <PlanDetail />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <Settings />
              </MainLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
