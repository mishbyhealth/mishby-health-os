import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import logo from "@/assets/Logo.png";

export default function MainLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header className="sticky-nav">
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <img src={logo} alt="GloWell" style={{ height: "40px", width: "auto" }} />
            <strong style={{ fontSize: 24, color: "var(--ink)" }}>GloWell</strong>
          </Link>

          <nav style={{ display: "flex", gap: 8 }}>
            <NavLink to="/" className={({isActive}) => `nav-link${isActive?' active':''}`}>Home</NavLink>
            <NavLink to="/health-plan" className={({isActive}) => `nav-link${isActive?' active':''}`}>Build Plan</NavLink>
            <NavLink to="/dashboard" className={({isActive}) => `nav-link${isActive?' active':''}`}>Dashboard</NavLink>
            <NavLink to="/profile" className={({isActive}) => `nav-link${isActive?' active':''}`}>Profile</NavLink>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 16px 40px" }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "12px 16px", color: "var(--muted)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", fontSize: 12 }}>
          © {new Date().getFullYear()} GloWell • Non-clinical wellness guidance.
        </div>
      </footer>
    </div>
  );
}
