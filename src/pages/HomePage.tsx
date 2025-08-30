// File: src/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <img src="/favicon.svg" alt="GloWell" className="h-6 w-6" />
          <span className="text-sm font-medium text-emerald-800">GloWell</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-emerald-900">GloWell — Live Naturally.</h1>
        <p className="text-gray-600 mt-2">
          A calm, premium health experience designed to help you build sustainable habits,
          personalized plans, and lifelong wellness. (Non-clinical guidance)
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/health-plan" className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800">
            Build Plan
          </Link>
          <Link to="/dashboard" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Learn More
          </Link>
          {/* NEW: direct link to V2 form */}
          <Link to="/health-form-v2" className="px-4 py-2 rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-50">
            Form V2 (Preview)
          </Link>
        </div>
      </header>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-emerald-900">Personalized Plans</h3>
          <p className="text-gray-600">Generate a plan that adapts to your routines, goals, and preferences.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-emerald-900">Daily Tracking</h3>
          <p className="text-gray-600">Keep gentle tabs on water, meals, activity, and sleep.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-emerald-900">Guided Learning</h3>
          <p className="text-gray-600">Bite-size insights to build healthy habits that last.</p>
        </div>
      </section>
    </div>
  );
}
