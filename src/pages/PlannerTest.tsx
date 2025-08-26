import React from "react";

/**
 * Keep your existing PlannerTest logic and handlers.
 * Only the labels and classes are updated for the GloWell UI.
 */

export default function PlannerTest() {
  // Assume your existing state/handlers remain.
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Build Plan</h1>

      <div className="card p-5">
        <p className="text-sm gw-muted">
          This is the same planner test engine—just refreshed styling.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn btn-primary">Generate Plan</button>
          <button className="btn btn-outline">Quick Build</button>
        </div>
      </div>
    </div>
  );
}
