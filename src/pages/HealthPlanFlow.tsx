/* src/pages/HealthPlanFlow.tsx */
import React, { useState } from "react";
import MultiStepHealthForm from "@/features/health-plan/MultiStepHealthForm";
import PlanView from "./PlanView";
import { generateSafePlan } from "../../mho/engine/safeGenerate";

export default function HealthPlanFlow() {
  const [plan, setPlan] = useState<any | null>(null);

  async function handleSubmit(formData: any) {
    const p = await generateSafePlan(formData);
    setPlan(p);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {!plan ? (
        <MultiStepHealthForm onSubmit={handleSubmit} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Plan Result</h1>
            <button
              className="px-3 py-1 border rounded"
              onClick={() => setPlan(null)}
              title="Start over"
            >
              New Form
            </button>
          </div>
          <PlanView plan={plan} />
        </>
      )}
    </div>
  );
}
