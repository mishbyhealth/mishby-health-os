import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/health-plan", label: "Plans" },
  { to: "/profile", label: "Profile" },
  { to: "/learn", label: "Learn" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 glass">
      {/* Taller bar to fit larger logo */}
      <div className="gw-container h-[6.75rem] md:h-[7.75rem] flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3" aria-label="GloWell Home">
          <img
            src="/logo.png"
            alt="GloWell"
            className="h-[6rem] md:h-[7rem] w-auto object-contain"
            draggable={false}
          />
          <span className="sr-only">GloWell</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/mho/test" className="btn btn-primary">
            Build Plan
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden btn btn-ghost"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed top-0 right-0 h-full w-[80%] max-w-xs bg-white shadow-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="GloWell"
                  className="h-[6rem] w-auto object-contain"
                />
                <span className="sr-only">GloWell</span>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 border-t pt-3 flex flex-col">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "nav-link-active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link
                to="/mho/test"
                onClick={() => setOpen(false)}
                className="mt-2 btn btn-primary"
              >
                Build Plan
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
