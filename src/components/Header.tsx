// src/components/Header.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

const links = [
  { label: "New Plan",     to: "/health-form",       match: "/health-form" },
  { label: "Current Plan", to: "/health-plan",       match: "/health-plan" },
  { label: "History",      to: "/plans-v2/history",  match: "/plans-v2" },
  { label: "Donate",       to: "/donate",            match: "/donate" },
  { label: "About",        to: "/about",             match: "/about" },
];

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-600" aria-hidden />
          <div className="text-lg font-semibold text-emerald-900">GloWell</div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              // NavLink खुद isActive देता है; नीचे हम pathname के "startsWith" से भी guard कर रहे हैं
              className={({ isActive }) =>
                cx(
                  "px-3 py-1.5 rounded-lg border text-sm transition",
                  (isActive || pathname.startsWith(l.match))
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-800 border-gray-300 hover:bg-gray-50"
                )
              }
              end={l.to === "/health-plan" || l.to === "/donate" || l.to === "/about"} 
              // end=true ⇒ exact match; history/health-form के लिए partial match चाहिए इसलिए default false
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
