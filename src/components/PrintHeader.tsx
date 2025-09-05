import React from "react";
import APP_META from "@/constants/appMeta";

/**
 * PrintHeader — inline SVG logo (no external asset), safe for PDF/Print.
 * Shown only in print. Keeps brand + version/date label.
 */
function nowLabel() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PrintHeader() {
  return (
    <>
      <style>{`
        @media print {
          .gw-print-header { 
            display: block !important;
            margin-bottom: 12px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
          }
          .gw-hide-on-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border-bottom: 1px solid #eee; padding: 6px 8px; }
        }
        @media screen { .gw-print-header { display: none; } }
      `}</style>

      <div className="gw-print-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Inline SVG logo — no external file dependency */}
          <svg width="36" height="36" viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id="gwg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" fill="url(#gwg)" />
            <text x="24" y="28" textAnchor="middle" fontSize="16" fontFamily="system-ui, sans-serif" fill="#fff">G</text>
          </svg>

          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{APP_META.brand}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {APP_META.versionLabel} • {APP_META.dateLabel}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              Printed: {nowLabel()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
