import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="grid gap-6">
      <section className="card card-hover p-6 lg:p-10">
        <div className="max-w-2xl">
          <div className="pill mb-4">Welcome to GloWell</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--mishby-navy)]">
            GloWell — Live Naturally.
          </h1>
          <p className="mt-3 text-sm sm:text-base gw-muted">
            A calm, premium health experience designed to help you build
            sustainable habits, personalized plans, and lifelong wellness.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/mho/test" className="btn btn-primary btn-lg">
              Build Plan
            </Link>
            <Link to="/learn" className="btn btn-outline btn-lg">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card card-hover p-5">
          <h3 className="font-semibold">Personalized Plans</h3>
          <p className="mt-2 text-sm gw-muted">
            Generate a plan that adapts to your routines, goals, and preferences.
          </p>
        </div>
        <div className="card card-hover p-5">
          <h3 className="font-semibold">Daily Tracking</h3>
          <p className="mt-2 text-sm gw-muted">
            Keep gentle tabs on water, meals, activity, and sleep.
          </p>
        </div>
        <div className="card card-hover p-5">
          <h3 className="font-semibold">Guided Learning</h3>
          <p className="mt-2 text-sm gw-muted">
            Bite-size insights to build healthy habits that last.
          </p>
        </div>
      </section>
    </div>
  );
}
