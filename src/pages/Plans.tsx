// src/pages/Plans.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// Compact plan card already present in repo
import PlanCard from "@/components/plan/PlanCard";

// Tiny additive link we added in v17.7
import OpenFullPlanLink from "@/components/OpenFullPlanLink";

/**
 * Plans
 * - Shows the compact, last-saved plan summary (if any).
 * - Preserves storage keys and behavior:
 *    • Reads from localStorage key: "glowell:lastPlan"
 *    • Does NOT change routes or generation flow
 * - Adds a small "Open full plan" button to navigate to /health-plan (Blueprint #3).
 *
 * Technical terms (Hindi with meaning):
 * - localStorage: ब्राउज़र की छोटी स्टोरेज जहाँ हम key-value रखते हैं
 * - Summary Card (PlanCard): छोटा कार्ड जो प्लान का सार दिखाता है
 */

type LastPlan = {
  id?: string;
  title?: string;
  summary?: string;
  // allow extra fields (don’t enforce shape strictly)
  [k: string]: any;
};

const LAST_PLAN_KEY = "glowell:lastPlan"; // (must remain stable)

export default function Plans() {
  const [lastPlan, setLastPlan] = useState<LastPlan | null>(null);

  // Read once on mount; keep minimal + safe
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_PLAN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setLastPlan(parsed || null);
      }
    } catch {
      // ignore bad JSON
      setLastPlan(null);
    }
  }, []);

  // Derive a small header title for the card
  const headerTitle = useMemo(() => {
    if (!lastPlan) return "Your Plan";
    if (lastPlan.title && typeof lastPlan.title === "string") return lastPlan.title;
    return "Your Plan";
  }, [lastPlan]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Plans</h1>

        {/* NEW: Tiny, additive shortcut to /health-plan */}
        <OpenFullPlanLink />
      </div>

      {/* Body */}
      {!lastPlan ? (
        <div className="rounded-lg border p-4 sm:p-6 bg-white">
          <p className="text-gray-700">
            No saved plan found yet.
          </p>
          <div className="mt-3">
            <Link
              to="/health-plan"
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 hover:bg-gray-50"
            >
              <span aria-hidden="true">📝</span>
              <span className="font-medium">Create or open full plan</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Tip: When you generate a plan on the Health Plan page, a compact copy is saved
            here for quick viewing.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Compact summary card (existing component) */}
          <div className="rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h2 className="text-base sm:text-lg font-medium">{headerTitle}</h2>
              {/* Secondary link as well (non-blocking): */}
              <OpenFullPlanLink variant="link" className="text-sm" />
            </div>
            <div className="p-4">
              {/* PlanCard should be tolerant of extra fields */}
              <PlanCard plan={lastPlan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
