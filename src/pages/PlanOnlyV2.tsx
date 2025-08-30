// File: src/pages/PlanOnlyV2.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PlanViewV2 from "@/pages/PlanViewV2";

const LS_PLAN_KEY = "glowell:plan_v2";

export default function PlanOnlyV2() {
  const nav = useNavigate();
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PLAN_KEY);
      setPlan(raw ? JSON.parse(raw) : null);
    } catch {
      setPlan(null);
    }
  }, []);

  if (!plan) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-2">Health Plan</h1>
        <div className="p-4 border rounded bg-white">
          No current plan found. Create one from{" "}
          <Link to="/health-form" className="text-emerald-700 underline">
            Health Form
          </Link>.
        </div>
      </div>
    );
  }

  return <PlanViewV2 plan={plan} />;
}
