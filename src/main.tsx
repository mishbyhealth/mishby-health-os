import React from "react";
import ReactDOM from "react-dom/client";

import AppRoutes from "@/routes/AppRoutes";
import "./index.css"; // <-- make sure Tailwind is loaded

const rootEl = document.getElementById("root");
if (!rootEl) {
  const el = document.createElement("div");
  el.innerText = "Root container #root not found in index.html";
  document.body.appendChild(el);
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <AppRoutes />
    </React.StrictMode>
  );
}
