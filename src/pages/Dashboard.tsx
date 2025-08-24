import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm gw-muted">Today’s Readiness</div>
          <div className="mt-2 text-3xl font-semibold text-[color:var(--gw-leaf)]">Good</div>
          <p className="mt-2 text-sm gw-muted">Light walk + hydration focus suggested.</p>
        </div>
        <div className="card p-5">
          <div className="text-sm gw-muted">Hydration</div>
          <div className="mt-2 text-3xl font-semibold">64%</div>
          <p className="mt-2 text-sm gw-muted">2 glasses to goal.</p>
        </div>
        <div className="card p-5">
          <div className="text-sm gw-muted">Plan</div>
          <p className="mt-2 text-sm gw-muted">Your plan is up to date.</p>
          <Link to="/mho/test" className="mt-3 btn btn-primary w-fit">Build Plan</Link>
        </div>
      </div>
    </div>
  );
}
