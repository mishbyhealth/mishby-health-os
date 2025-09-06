// src/layouts/MainLayout.tsx
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import ThemeSwitch from "../components/ThemeSwitch";

function ChipLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => "nav-chip" + (isActive ? " is-active" : "")}
      end
    >
      {children}
    </NavLink>
  );
}

export default function MainLayout() {
  const nav = useNavigate();
  const loc = useLocation();

  function openDemo() {
    nav("/health-plan#demo");
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="topbar">
        <div className="container topbar-inner">
          {/* Brand (left) */}
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-text">GloWell</span>
          </div>

          {/* Nav chips (center, scrolls if overflow) */}
          <nav className="nav" aria-label="Primary">
            <ChipLink to="/">Home</ChipLink>
            <ChipLink to="/dashboard">Dashboard</ChipLink>
            <ChipLink to="/health-form">Health Form</ChipLink>
            <ChipLink to="/health-plan">Health Plan</ChipLink>
            <ChipLink to="/plans">Plans</ChipLink>
            <ChipLink to="/settings">Settings</ChipLink>
            <ChipLink to="/subscription">Subscription</ChipLink>
            <ChipLink to="/_ping">_ping</ChipLink>
          </nav>

          {/* Actions (right) */}
          <div className="actions">
            <button className="gw-btn" onClick={openDemo}>Open Demo</button>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="container py-4">
        <Outlet />
      </main>

      {/* Footer + lock banner */}
      <footer className="container footer">
        <div>© 2025 GloWell — Live Naturally</div>
        <div className="gw-muted text-right">Path: {loc.pathname}</div>
      </footer>

      <div className="gw-lock-banner">
        <span style={{ marginRight: 6 }}>🔒</span> Read-only mode active
      </div>
    </div>
  );
}
