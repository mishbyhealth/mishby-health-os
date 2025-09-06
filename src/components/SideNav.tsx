import { NavLink, Link } from "react-router-dom";
import ThemeSwitch from "./ThemeSwitch";

export default function SideNav() {
  return (
    <aside className="sidenav">
      <div className="sidenav-inner">
        {/* Brand (logo PNG if available; fallback to colored chip) */}
        <Link to="/" className="sidenav-brand" aria-label="GloWell Home">
          {/* Try /logo.png; if it fails, hide img and show brand-mark */}
          <img
            src="/logo.png"
            alt=""
            className="brand-img"
            onError={(e) => { (e.currentTarget.style.display = "none"); }}
          />
          <span className="brand-mark" aria-hidden="true" /> {/* fallback chip */}
          <span className="brand-text">GloWell</span>
        </Link>

        {/* Nav */}
        <nav className="sidenav-nav">
          <NavChip to="/">Home</NavChip>
          <NavChip to="/dashboard">Dashboard</NavChip>
          <NavChip to="/health-form">Health Form</NavChip>
          <NavChip to="/health-plan">Health Plan</NavChip>
          <NavChip to="/plans">Plans</NavChip>
          <NavChip to="/settings">Settings</NavChip>
          <NavChip to="/subscription">Subscription</NavChip>
          <NavChip to="/donate">Donate</NavChip>
          <NavChip to="/about">About</NavChip>            {/* NEW */}
          <NavChip to="/terms">Terms & Conditions</NavChip> {/* NEW */}
          <NavChip to="/_ping">_ping</NavChip>
        </nav>

        <div className="sidenav-controls">
          <ThemeSwitch />
        </div>
      </div>
    </aside>
  );
}

function NavChip({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => "side-chip" + (isActive ? " is-active" : "")}
      end
    >
      {children}
    </NavLink>
  );
}
