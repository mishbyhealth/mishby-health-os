// src/components/PrintHeader.tsx
import React from "react";
import Logo from "@/assets/Logo.png";

/**
 * PrintHeader
 * - Hidden on screen, visible in print
 * - Injects print CSS (A4, margins, hide screen header/footer/nav, tidy tables)
 * - Shows brand + timestamp
 */
const PrintHeader: React.FC = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const HH = String(now.getHours()).padStart(2, "0");
  const MM = String(now.getMinutes()).padStart(2, "0");
  const stamp = `${dd}/${mm}/${yyyy} ${HH}:${MM} IST`;

  const css = `
  /* Hide this block on screen; show only in print */
  @media screen {
    .print-only { display: none !important; }
  }
  @media print {
    /* Page setup for A4 PDFs */
    @page { size: A4; margin: 12mm; }
    html, body { background: #fff !important; color: #111 !important; }

    /* Hide screen chrome (header/footer/nav etc.) */
    header, nav, footer,
    .no-print, .screen-only {
      display: none !important;
    }

    /* Show the print header block */
    .print-only { display: block !important; }

    /* Tidy tables and avoid weird page breaks */
    table { border-collapse: collapse; width: 100%; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr, img { page-break-inside: avoid; }

    /* Compact spacing */
    .print-container { margin-bottom: 8mm; }
    .print-title { font-size: 18px; font-weight: 700; margin: 0 0 2mm 0; }
    .print-sub { font-size: 12px; color: #555; margin: 0; }
    .print-meta { font-size: 11px; color: #333; margin-top: 1mm; }
    .print-divider { border-top: 1px solid #ddd; margin-top: 3mm; }
  }
  `;

  return (
    <>
      {/* Inject print CSS */}
      <style>{css}</style>

      {/* Visible only in print */}
      <div className="print-only print-container">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={Logo}
            alt="GloWell"
            style={{ height: 36, width: "auto", objectFit: "contain" }}
          />
          <div>
            <h1 className="print-title">GloWell — Live Naturally</h1>
            <p className="print-sub">Personal Health Plan (print view)</p>
            <div className="print-meta">Printed on: {stamp}</div>
          </div>
        </div>
        <div className="print-divider" />
      </div>
    </>
  );
};

export default PrintHeader;
