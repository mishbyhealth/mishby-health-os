import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import HealthFormV2 from "./HealthFormV2";

/**
 * GloWell — PrettyHealthFormV2 (pages wrapper for NEW blueprint)
 * Reverted: no Shell wrapper here (Shell in your app uses <Outlet/>).
 * Adds a small "Form | History" tabs bar + Review button.
 * Storage keys unchanged; HealthFormV2 handles the form as before.
 */

function TabLink({
  to,
  label,
  end = false,
}: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "px-3 py-2 text-sm rounded-md border",
          isActive ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-800",
        ].join(" ")
      }
      style={{ textDecoration: "none" }}
    >
      {label}
    </NavLink>
  );
}

export default function PrettyHealthFormV2() {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6">
      {/* Tabs bar */}
      <div className="mb-4 flex items-center gap-2">
        <TabLink to="/form" label="Form" end />
        <TabLink to="/form/history" label="History" />
        <div className="ml-auto">
          <button
            type="button"
            className="px-3 py-2 text-sm rounded-md border"
            onClick={() => navigate("/review")}
            title="Go to Review"
          >
            Review
          </button>
        </div>
      </div>

      {/* Form container (unchanged) */}
      <div className="border-l-4 rounded-md shadow-sm border-green-600 bg-white">
        <HealthFormV2 />
      </div>
    </div>
  );
}
