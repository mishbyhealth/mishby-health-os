// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "@/App";
import "@/index.css";

import { bootMode } from "@/utils/mode";
import { bootAccountsMigration } from "@/utils/accounts";
import FloatingModeToggle from "@/components/FloatingModeToggle";
import FloatingAccountsShortcut from "@/components/FloatingAccountsShortcut";
import AccountsPage from "@/pages/Accounts";
import { AccountProvider } from "@/context/AccountProvider";

// ---- Boot (theme, lock, full-form, mode, accounts migration) ----
(function boot() {
  const tKey = "glowell:theme";
  const theme = localStorage.getItem(tKey) || "lavender";
  if (!localStorage.getItem(tKey)) localStorage.setItem(tKey, theme);
  document.documentElement.setAttribute("data-theme", theme);

  const locked = localStorage.getItem("glowell:locked") === "1";
  document.documentElement.setAttribute("data-locked", locked ? "1" : "0");

  const full = localStorage.getItem("glowell:fullForm") === "1";
  document.documentElement.setAttribute("data-fullform", full ? "1" : "0");

  bootMode();               // data-mode
  bootAccountsMigration();  // seeds "Self", copies legacy keys, sets current id
})();

// ---- Mount App with /accounts route + providers ----
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AccountProvider>
        <Routes>
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/*" element={<App />} />
        </Routes>

        {/* Owner floating shortcuts */}
        <FloatingModeToggle />
        <FloatingAccountsShortcut />
      </AccountProvider>
    </BrowserRouter>
  </React.StrictMode>
);
