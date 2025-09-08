import { Outlet, useNavigate, useLocation } from "react-router-dom";
import SideNav from "../components/SideNav";
import ThemeSwitch from "../components/ThemeSwitch";

export default function Shell() {
  const nav = useNavigate();
  const loc = useLocation();

  function openDemo() { nav("/health-plan#demo"); }

  return (
    <div className="app-shell">
      <SideNav />
      <div className="app-main">
        {/* Top bar spans full, inner uses gw-page (same clamp as pages) */}
        <header className="topbar">
          <div className="gw-page topbar-inner" style={{ paddingBlock: 8 }}>
            <div className="topbar-title">
              <button className="gw-btn" onClick={openDemo}>Open Demo</button>
            </div>
            <div className="actions">
              <button className="gw-btn" onClick={() => nav("/donate")}>Donate</button>
              <ThemeSwitch />
            </div>
          </div>
        </header>

        {/* Let pages own width via their own .gw-page wrappers */}
        <main role="main" className="py-4">
          <Outlet />
        </main>

        {/* Footer inner also uses the same clamp */}
        <footer className="gw-page footer" style={{ paddingBlock: 8 }}>
          <div>© 2025 GloWell — Live Naturally</div>
          <div className="gw-muted text-right">Path: {loc.pathname}</div>
        </footer>

        {/* Maintenance banner (owner-only lock); visibility controlled elsewhere */}
        <div className="gw-lock-banner">
          <span style={{ marginRight: 6 }}>🔒</span> Read-only mode active
        </div>
      </div>
    </div>
  );
}
