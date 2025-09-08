import React from "react";

// Lightweight wrapper if you want to reuse this shell elsewhere
export default function WizardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gw-page">
      <div className="gw-tint">
        {children}
      </div>
    </div>
  );
}
