// src/pages/HealthPlan.tsx
import { Link } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import MultiStepHealthForm from "@/features/health-plan/MultiStepHealthForm";


export default function HealthPlan() {
  return (
    <MainLayout>
      <div className="p-8 min-h-[60vh] space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-emerald-50">
          <span>🧭</span>
          <span>/health-plan route is working</span>
        </div>

        <h1 className="text-3xl font-semibold">Health Plan</h1>
        <p className="opacity-80">
          Use the buttons below to open the multi-step form and then view results.
        </p>

        <div className="flex gap-3">
          <Link
            to="/health-plan/form"
            className="rounded-xl px-4 py-2 bg-emerald-600 text-white hover:opacity-90 shadow"
          >
            Open Health Form
          </Link>

          <Link
            to="/health-plan/view"
            className="rounded-xl px-4 py-2 border hover:bg-gray-50"
          >
            View Plan (placeholder)
          </Link>
        </div>

        <div className="rounded-2xl border p-6 bg-white">
          <ul className="list-disc pl-6 space-y-1">
            <li>Form file: <code>src/pages/HealthForm.tsx</code></li>
            <li>Plan file: <code>src/pages/PlanView.tsx</code></li>
            <li>Routes added in: <code>src/routes/AppRoutes.tsx</code></li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
