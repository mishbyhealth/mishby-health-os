// src/components/OpenFullPlanLink.tsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * OpenFullPlanLink
 * - Tiny, reusable link/button that navigates to /health-plan.
 * - Safe + additive: does not change existing pages until you include it.
 *
 * Usage (next step):
 *   // Inside Plans.tsx header or footer:
 *   <OpenFullPlanLink className="mt-3" />
 */

type OpenFullPlanLinkProps = {
  className?: string;
  variant?: "link" | "button"; // default: "button"
  size?: "sm" | "md";           // default: "sm"
  label?: string;               // default: "Open full plan"
};

export default function OpenFullPlanLink({
  className = "",
  variant = "button",
  size = "sm",
  label = "Open full plan",
}: OpenFullPlanLinkProps) {
  const base =
    "inline-flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  const btnPad = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-base";

  if (variant === "link") {
    return (
      <Link
        to="/health-plan"
        className={`text-blue-600 hover:text-blue-700 underline ${className}`}
        aria-label="Open full plan"
        title="Open full plan"
      >
        {label}
      </Link>
    );
  }

  // button variant (default)
  return (
    <Link
      to="/health-plan"
      className={`${base} ${btnPad} rounded-full border border-gray-300 hover:bg-gray-50 ${className}`}
      aria-label="Open full plan"
      title="Open full plan"
    >
      {/* icon */}
      <span aria-hidden="true" className="text-sm">📝</span>
      <span className="font-medium">{label}</span>
      {/* subtle arrow */}
      <span aria-hidden="true" className="text-sm">→</span>
    </Link>
  );
}
