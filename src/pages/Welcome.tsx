// src/pages/Welcome.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="gw-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">GloWell — Live Naturally</h1>
            <p className="mt-2 gw-muted">
              A gentle, non-clinical wellness companion. Fill a simple health form, get a tidy daily
              plan, and export/share as needed — all private, on your device.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="gw-btn" onClick={() => navigate("/health-plan#demo")}>
              Try Public Demo
            </button>
            <button className="gw-btn" onClick={() => navigate("/dashboard")}>
              Open Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="gw-card">
        <h2 className="font-medium mb-3">How it works</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Open <strong>Health Form</strong> and enter basic info and preferences.</li>
          <li>We generate a simple daily plan: hydration, meals, movement, and tips.</li>
          <li>View the plan on <strong>Health Plan</strong> and export JSON/CSV/bundle.</li>
          <li>See previous snapshots in <strong>Plans</strong> and print/share if you like.</li>
        </ol>
      </section>

      {/* Privacy */}
      <section className="gw-card">
        <h2 className="font-medium mb-2">Privacy-first</h2>
        <p className="text-sm gw-muted">
          Your data stays on your device (localStorage). No server account is required. Use the
          export buttons to back up or share.
        </p>
      </section>
    </div>
  );
}
