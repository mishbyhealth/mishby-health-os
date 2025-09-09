// src/components/SideNav.tsx
import { NavLink } from "react-router-dom";

const Link = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <NavLink to={to} className={({ isActive }) => `gw-nav ${isActive ? "is-active" : ""}`}>
    {children}
  </NavLink>
);

export default function SideNav() {
  return (
    <aside className="sidenav">
      <div className="sidenav-inner">
        <div className="brand">Glo<span className="brand-accent">Well</span></div>

        <nav className="nav-col">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/health-form">Health Form</Link>
          <Link to="/health-form-v2">Form V2</Link>
          {/* Tracker visible to ALL users */}
          <Link to="/tracker">Today Tracker</Link>
          <Link to="/health-plan">Health Plan</Link>
          <Link to="/plans">Plans</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/subscription">Subscription</Link>
          <Link to="/donate">Donate</Link>
          <Link to="/about">About</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/_ping">_ping</Link>
        </nav>

        <div className="sidenav-foot">
          <span className="theme-label">Theme: <em>—</em></span>
        </div>
      </div>
    </aside>
  );
}
