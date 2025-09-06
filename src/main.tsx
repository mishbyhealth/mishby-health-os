// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Owner/full-form boot helpers
import { bootOwnerFromURL, bootFullFormFromStorage } from "./utils/owner";

(function boot() {
  // keep your theme + lock boot so UI looks right on first paint
  const t = localStorage.getItem("glowell:theme") || "classic";
  document.documentElement.setAttribute("data-theme", t);

  const locked = localStorage.getItem("glowell:locked") === "1";
  document.documentElement.setAttribute("data-locked", locked ? "1" : "0");

  // NEW: owner + full-form flags
  bootOwnerFromURL();        // remembers ?owner=1
  bootFullFormFromStorage(); // sets <html data-fullform="0|1">
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
