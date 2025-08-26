import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div style={{ maxWidth: 980, margin: "32px auto", padding: "0 16px" }}>
      {/* Simple header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0d9488" }} />
          <strong style={{ fontSize: 18 }}>GloWell</strong>
        </div>
        <nav style={{ display: "flex", gap: 14 }}>
          <Link to="/" style={{ textDecoration: "none" }}>Home</Link>
          <Link to="/health-plan" style={{ textDecoration: "none" }}>Build Plan</Link>
          <Link to="/dashboard" style={{ textDecoration: "none" }}>Dashboard</Link>
        </nav>
      </header>

      {/* Hero */}
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>GloWell — Live Naturally.</h1>
      <p style={{ margin: 0, opacity: 0.85 }}>
        A calm, premium health experience designed to help you build sustainable habits,
        personalized plans, and lifelong wellness.
      </p>

      {/* CTA buttons */}
      <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
        <Link
          to="/health-plan"
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "#0d9488",
            color: "white",
            border: "1px solid #0d9488",
            textDecoration: "none",
          }}
        >
          Build Plan
        </Link>
        <a
          href="#learn"
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "white",
            color: "#111",
            border: "1px solid #ddd",
            textDecoration: "none",
          }}
        >
          Learn More
        </a>
      </div>

      {/* Features */}
      <section id="learn" style={{ marginTop: 28 }}>
        <h3>Personalized Plans</h3>
        <p>Generate a plan that adapts to your routines, goals, and preferences.</p>

        <h3>Daily Tracking</h3>
        <p>Keep gentle tabs on water, meals, activity, and sleep.</p>

        <h3>Guided Learning</h3>
        <p>Bite-size insights to build healthy habits that last.</p>
      </section>
    </div>
  );
}
