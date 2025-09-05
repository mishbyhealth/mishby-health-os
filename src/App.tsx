import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import Welcome from "@/pages/Welcome";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const HealthForm = lazy(() => import("@/pages/HealthForm"));
const IntakeReview = lazy(() => import("@/pages/IntakeReview"));
const HealthPlan = lazy(() => import("@/pages/HealthPlan"));
const Plans = lazy(() => import("@/pages/Plans"));           // you created this
const Subscription = lazy(() => import("@/pages/Subscription"));
const Ping = lazy(() => import("@/pages/Ping"));
const Settings = lazy(() => import("@/pages/Settings"));

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Suspense fallback={<div className="p-6">Loading…</div>}>
          <ErrorBoundary name="Routes">
            <Routes>
              <Route path="/" element={<Welcome />} />

              <Route
                path="/dashboard"
                element={
                  <ErrorBoundary name="Dashboard">
                    <Dashboard />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/health-form"
                element={
                  <ErrorBoundary name="HealthForm">
                    <HealthForm />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/intake-review"
                element={
                  <ErrorBoundary name="IntakeReview">
                    <IntakeReview />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/health-plan"
                element={
                  <ErrorBoundary name="HealthPlan">
                    <HealthPlan />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/plans"
                element={
                  <ErrorBoundary name="Plans">
                    <Plans />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ErrorBoundary name="Subscription">
                    <Subscription />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/_ping"
                element={
                  <ErrorBoundary name="Ping">
                    <Ping />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/settings"
                element={
                  <ErrorBoundary name="Settings">
                    <Settings />
                  </ErrorBoundary>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </MainLayout>
    </BrowserRouter>
  );
}
