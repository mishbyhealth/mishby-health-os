import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";  // <-- add this
import App from "./App";
import "./index.css";

/**
 * Dev/Prod setup:
 * - Dev: keep it simple (no StrictMode) to avoid duplicate effects/toasts
 * - Prod: enable StrictMode
 * - BOTH: wrap the whole app with <BrowserRouter> so routing works
 *
 * हिन्दी:
 * - Dev में StrictMode हटाया (double-run रोकने के लिए).
 * - हर स्थिति में <BrowserRouter> लगाया ताकि Routes ठीक से चलें.
 */

const rootEl = document.getElementById("root")!;

if (import.meta.env.DEV) {
  ReactDOM.createRoot(rootEl).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
