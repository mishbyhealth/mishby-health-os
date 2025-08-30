// File: src/components/SideNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function SideNav() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    "block px-4 py-2 rounded-lg mb-1 transition-colors " +
    (isActive ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-emerald-100");

  return (
    <aside className="w-60 shrink-0 bg-white border-r min-h-screen p-4">
      <h1 className="text-lg font-bold text-emerald-700 mb-3">GloWell</h1>
      <nav>
        <NavLink to="/dashboard" className={cls}>Dashboard</NavLink>
        <NavLink to="/health-form" className={cls}>Health Form</NavLink>
        <NavLink to="/health-plan" className={cls}>Health Plan</NavLink>
        <NavLink to="/plans-v2/history" className={cls}>Plans History</NavLink>
        <NavLink to="/donate" className={cls}>Donate</NavLink>
        <NavLink to="/about" className={cls}>About</NavLink>
      </nav>
    </aside>
  );
}
