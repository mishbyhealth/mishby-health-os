// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

// ✅ Import Tailwind styles
import "./index.css";

import AppRoutes from "./routes/AppRoutes";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
