// File: src/components/SideNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";

function Item({ to, children }:{ to:string; children:React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md mb-2 side-item ${isActive ? "side-item-active" : ""}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function SideNav() {
  return (
    <aside className="p-3" style={{ width: 220 }}>
      <div className="flex items-center gap-2 mb-4">
        <img src="/favicon.svg" alt="GloWell" className="h-6 w-6" />
        <span className="font-semibold">GloWell</span>
      </div>

      <Item to="/">Home</Item>
      <Item to="/dashboard">Dashboard</Item>
      <Item to="/health-form">Health Form</Item>
      <Item to="/health-form-v2">Form V2</Item>
      <Item to="/tracker">Today Tracker</Item>
      <Item to="/health-plan">Health Plan</Item>
      <Item to="/plans">Plans</Item>
      <Item to="/settings">Settings</Item>
      <Item to="/subscription">Subscription</Item>
      <Item to="/donate">Donate</Item>
      <Item to="/about">About</Item>
      <Item to="/terms">Terms & Conditions</Item>
      <Item to="/_ping">_ping</Item>

      <div className="text-xs mt-4">
        Theme: <span className="gw-muted">{document.documentElement.dataset.theme || "—"}</span>
      </div>
    </aside>
  );
}
