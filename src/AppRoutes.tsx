import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout"; // green layout via <Outlet/>

/**
 * AppRoutes — single-router + layout route
 * - "/" (root) now opens in-app Home (green layout)
 * - Marketing home kept at /landing
 * - Old /form-v2* links -> /form
 * - Explicit routes so pages don't fall back to /form
 * - Review shows old UI + Medical History read-only summary
 */

// Marketing Home (for /landing)
const HomePage = lazy(() => import("./pages/HomePage"));

// FormV2 flow
const PrettyHealthFormV2 = lazy(() => import("./pages/PrettyHealthFormV2"));
const IntakeReview = lazy(() => import("./pages/IntakeReview"));
const MedicalHistory = lazy(() => import("./pages/formv2/MedicalHistory"));
const MedicalHistorySummary = lazy(
  () => import("./pages/formv2/blocks/MedicalHistorySummary")
);

// Main app sections
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TodayTracker = lazy(() => import("./pages/TodayTracker"));
const HealthPlan = lazy(() => import("./pages/HealthPlan"));
const Plans = lazy(() => import("./pages/Plans"));
const PlanView = lazy(() => import("./pages/PlanView"));
const PlanViewV2 = lazy(() => import("./pages/PlanViewV2"));
const Settings = lazy(() => import("./pages/Settings"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Donate = lazy(() => import("./pages/Donate"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Profile = lazy(() => import("./pages/Profile"));
const Checkout = lazy(() => import("./pages/Checkout"));

// Helpers / utilities
const PlannerTest = lazy(() =>
  import("./pages/PlannerTest").catch(() => ({ default: () => null }))
);
const Learn = lazy(() =>
  import("./pages/Learn").catch(() => ({ default: () => null }))
);
const Ping = lazy(() =>
  import("./pages/Ping").catch(() => ({ default: () => null }))
);

// Legacy/alt pages
const HomeLegacy = lazy(() =>
  import("./pages/Home").catch(() => ({ default: () => null }))
);
const HealthFormLegacy = lazy(() =>
  import("./pages/HealthForm").catch(() => ({ default: () => null }))
);
const HealthFormV2Legacy = lazy(() =>
  import("./pages/HealthFormV2").catch(() => ({ default: () => null }))
);

function Fallback() {
  return <div style={{ padding: 16 }}>Loading…</div>;
}

// Wrap old Review and append our read-only history summary
function ReviewWithHistory() {
  return (
    <div className="p-0 m-0">
      <IntakeReview />
      <div className="mt-4" />
      <MedicalHistorySummary className="mt-4" />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        {/* Marketing home still reachable at /landing */}
        <Route path="/landing" element={<HomePage />} />

        {/* Old links -> new form */}
        <Route path="/form-v2" element={<Navigate to="/form" replace />} />
        <Route path="/form-v2/*" element={<Navigate to="/form" replace />} />

        {/* ✅ Main app shell with green layout.
            We attach it to "/" so that root shows in-app Home (not Form). */}
        <Route path="/" element={<MainLayout />}>
          {/* Index (exact "/") -> in-app Home page */}
          <Route index element={<HomeLegacy />} />

          {/* Form V2 flow */}
          <Route path="form" element={<PrettyHealthFormV2 />} />
          <Route path="form/history" element={<MedicalHistory />} />
          <Route path="review" element={<ReviewWithHistory />} />

          {/* Main sections */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="today" element={<TodayTracker />} />
          <Route path="today-tracker" element={<TodayTracker />} />
          <Route path="health-plan" element={<HealthPlan />} />
          <Route path="plans" element={<Plans />} />
          <Route path="plan-view" element={<PlanView />} />
          <Route path="plan-view-v2" element={<PlanViewV2 />} />
          <Route path="settings" element={<Settings />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="donate" element={<Donate />} />
          <Route path="about" element={<About />} />
          <Route path="terms" element={<Terms />} />
          <Route path="welcome" element={<Welcome />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="profile" element={<Profile />} />
          <Route path="checkout" element={<Checkout />} />

          {/* Helpers */}
          <Route path="planner-test" element={<PlannerTest />} />
          <Route path="learn" element={<Learn />} />
          <Route path="ping" element={<Ping />} />
          <Route path="_ping" element={<Ping />} /> {/* alias */}

          {/* Legacy (reachable if linked) */}
          <Route path="home" element={<HomeLegacy />} />
          <Route path="health-form" element={<HealthFormLegacy />} />
          <Route path="health-form-v2" element={<HealthFormV2Legacy />} />

          {/* Keep users inside shell for any other unknown app path */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Final catch-all (rare) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
