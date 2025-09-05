// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { applyTheme, loadTheme, loadLock, saveLock } from "./utils/theme";

(function initThemeAndLock(){
  applyTheme(loadTheme());
  const locked = loadLock();
  document.documentElement.setAttribute("data-locked", locked ? "1" : "0");
  // ensure lock is persisted format
  saveLock(locked);
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
