import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyTheme, loadTheme, loadLock } from "@/utils/theme";

function boot() {
  try {
    // apply persisted theme + lock before first paint
    applyTheme(loadTheme());
    const locked = loadLock();
    document.documentElement.setAttribute("data-locked", locked ? "1" : "0");
  } catch {
    // noop
  }
}

const mount =
  document.getElementById("root") ??
  (() => {
    const el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
    return el;
  })();

boot();
createRoot(mount).render(<App />);
