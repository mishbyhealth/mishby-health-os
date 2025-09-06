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
        <header className="topbar">
          <div className="container topbar-inner">
            <div className="topbar-title">
              <button className="gw-btn" onClick={openDemo}>Open Demo</button>
            </div>
            <div className="actions">
              <button className="gw-btn" onClick={()=>nav("/donate")}>Donate</button>
              <ThemeSwitch />
            </div>
          </div>
        </header>

        <main className="container py-4">
          <Outlet />
        </main>

        <footer className="container footer">
          <div>© 2025 GloWell — Live Naturally</div>
          <div className="gw-muted text-right">Path: {loc.pathname}</div>
        </footer>

        <div className="gw-lock-banner">
          <span style={{ marginRight: 6 }}>🔒</span> Read-only mode active
        </div>
      </div>
    </div>
  );
}
