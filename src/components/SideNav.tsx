// src/components/SideNav.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

const items = [
  { label: "Dashboard", to: "/dashboard", match: "/dashboard" },
  { label: "Health Form", to: "/health-form", match: "/health-form" },
  { label: "Health Plan", to: "/health-plan", match: "/health-plan" },
  { label: "Plans History", to: "/plans-v2/history", match: "/plans-v2" },
  { label: "Donate", to: "/donate", match: "/donate" },
  { label: "About", to: "/about", match: "/about" },
];

export default function SideNav() {
  const { pathname } = useLocation();
  return (
    <nav className="p-3 space-y-1">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            cx(
              "block px-3 py-2 rounded-lg text-sm",
              (isActive || pathname.startsWith(it.match))
                ? "bg-emerald-600 text-white"
                : "text-emerald-900 hover:bg-emerald-50"
            )
          }
          end={["/dashboard","/donate","/about","/health-plan"].includes(it.to)}
        >
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
