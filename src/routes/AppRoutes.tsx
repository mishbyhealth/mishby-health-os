// src/routes/AppRoutes.tsx
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout";
import HomePage from "@/pages/HomePage";
import HealthPlanFlow from "@/pages/HealthPlanFlow";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import PlanView from "@/pages/PlanView"; // ✅ added

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/health-plan", element: <HealthPlanFlow /> },
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/profile", element: <Profile /> },
      { path: "/plan", element: <PlanView /> }, // ✅ added
    ],
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
