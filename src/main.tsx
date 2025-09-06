// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Owner/full-form boot helpers
import { bootOwnerFromURL, bootFullFormFromStorage } from "./utils/owner";

(function boot() {
  // ── THEME ─────────────────────────────────────────────────────
  // Make Lavender the default. If a saved theme exists and is valid, use it.
  // Otherwise, set + use 'lavender' on first paint.
  const allowed = ["classic", "mint", "sky", "lavender", "sunset", "forest", "slate"] as const;

  try {
    const saved = localStorage.getItem("glowell:theme");
    const isAllowed = !!saved && (allowed as readonly string[]).includes(saved);
    const theme = isAllowed ? (saved as string) : "lavender";

    // if nothing was saved, remember the default so subsequent loads are stable
    if (!saved) localStorage.setItem("glowell:theme", theme);

    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    // if localStorage is blocked, still paint in lavender
    document.documentElement.setAttribute("data-theme", "lavender");
  }

  // ── LOCK STATE ────────────────────────────────────────────────
  try {
    const locked = localStorage.getItem("glowell:locked") === "1";
    document.documentElement.setAttribute("data-locked", locked ? "1" : "0");
  } catch {
    document.documentElement.setAttribute("data-locked", "0");
  }

  // ── OWNER + FULL FORM BOOT ───────────────────────────────────
  // ?owner=1 persists owner mode; full-form flag sets <html data-fullform="0|1">
  bootOwnerFromURL();
  bootFullFormFromStorage();
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
