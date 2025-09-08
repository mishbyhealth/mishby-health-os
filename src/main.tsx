// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Shell from "@/layouts/Shell";

import Home from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import HealthForm from "@/pages/HealthForm";
import HealthFormV2 from "@/pages/HealthFormV2";
import HealthPlan from "@/pages/HealthPlan";
import Plans from "@/pages/Plans";
import Settings from "@/pages/Settings";
import Subscription from "@/pages/Subscription";
import Donate from "@/pages/Donate";
import About from "@/pages/About";
import Terms from "@/pages/Terms";
import Ping from "@/pages/Ping";
import AccountsPage from "@/pages/Accounts";
import TodayTracker from "@/pages/TodayTracker";

import { AccountProvider } from "@/context/AccountProvider";
import "@/index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <Home /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "health-form", element: <HealthForm /> },
      { path: "health-form-v2", element: <HealthFormV2 /> },
      { path: "tracker", element: <TodayTracker /> },        // NEW
      { path: "health-plan", element: <HealthPlan /> },
      { path: "plans", element: <Plans /> },
      { path: "settings", element: <Settings /> },
      { path: "subscription", element: <Subscription /> },
      { path: "donate", element: <Donate /> },
      { path: "about", element: <About /> },
      { path: "terms", element: <Terms /> },
      { path: "_ping", element: <Ping /> },
      { path: "accounts", element: <AccountsPage /> },       // owner-only page
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AccountProvider>
      <RouterProvider router={router} />
    </AccountProvider>
  </React.StrictMode>
);
