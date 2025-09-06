import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  function openDemo() {
    nav("/health-plan#demo");
  }
  function openDashboard() {
    nav("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section className="gw-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">GloWell — Live Naturally</h1>
            <p className="mt-1 gw-muted text-sm">
              A gentle, non-clinical wellness companion. Fill a simple health form,
              get a tidy daily plan, and export/share as needed — all private, on your device.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="gw-btn" onClick={openDemo}>Try Public Demo</button>
            <button className="gw-btn" onClick={openDashboard}>Open Dashboard</button>
          </div>
        </div>
      </section>

      <section className="gw-card">
        <h2 className="font-medium">How it works</h2>
        <ol className="mt-2 list-decimal pl-5 text-sm gw-muted space-y-1">
          <li>Open <strong>Health Form</strong> and enter basic info and preferences.</li>
          <li>We generate a simple daily plan: hydration, meals, movement, and tips.</li>
          <li>View the plan on <strong>Health Plan</strong> and export JSON/CSV/bundle.</li>
          <li>See previous snapshots in <strong>Plans</strong> and print/share if you like.</li>
        </ol>
      </section>

      <section className="gw-card">
        <h2 className="font-medium">Privacy-first</h2>
        <p className="mt-2 text-sm gw-muted">
          Your data stays on your device (localStorage). No server account is required.
          Use the export buttons to back up or share.
        </p>
      </section>
    </div>
  );
}
