import React from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Marketing Home (now at /landing)
 * - Clean, stable buttons to real routes:
 *   • Build Plan        -> /health-plan
 *   • Learn More        -> /about
 *   • Form V2 (Preview) -> /form
 * NOTE:
 * - Default entry (/) already redirects to /form so users land in the app shell.
 * - This page remains reachable at /landing.
 */

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="bg-white/90 rounded-2xl shadow-sm p-6 md:p-8">
        {/* Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md border">
            <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
            GloWell
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-semibold text-green-800 mb-3">
          GloWell — Live Naturally.
        </h1>

        <p className="text-gray-700 mb-6">
          A calm, premium health experience designed to help you build sustainable
          habits, personalized plans, and lifelong wellness. (Non-clinical guidance)
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate("/health-plan")}
            className="px-4 py-2 rounded-md bg-green-700 text-white hover:bg-green-800"
            title="Start building your plan"
          >
            Build Plan
          </button>

          <Link
            to="/about"
            className="px-4 py-2 rounded-md border hover:bg-gray-50"
            title="Know more about GloWell"
          >
            Learn More
          </Link>

          <Link
            to="/form"
            className="px-4 py-2 rounded-md border border-green-600 text-green-700 hover:bg-green-50"
            title="Open the new Health Form (V2)"
          >
            Form V2 (Preview)
          </Link>
        </div>

        {/* Feature bullets */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-green-800">Personalized Plans</h2>
            <p className="text-gray-700">
              Generate a plan that adapts to your routines, goals, and preferences.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-green-800">Daily Tracking</h2>
            <p className="text-gray-700">
              Keep gentle tabs on water, meals, activity, sleep, and more.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-green-800">Guided Learning</h2>
            <p className="text-gray-700">
              Bite-size insights to build healthy habits that last.
            </p>
          </div>
        </div>

        {/* Small helper for /landing visitors */}
        <div className="mt-8 text-sm text-gray-600">
          Prefer the in-app view?{" "}
          <Link to="/form" className="underline text-green-700">
            Go to Form
          </Link>
        </div>
      </div>
    </div>
  );
}
