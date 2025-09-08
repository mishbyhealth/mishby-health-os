import React from "react";

export default function WizardBox({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="gw-card" style={{ marginBottom: "0.75rem" }}>
      <div className="gw-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="text-lg">{title}</h3>
        {right}
      </div>
      <div style={{ marginTop: "0.5rem" }}>{children}</div>
    </div>
  );
}
