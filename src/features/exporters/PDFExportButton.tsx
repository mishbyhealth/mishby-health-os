// Path: src/features/exporters/DownloadPlanPDF.tsx
// Purpose: Stable PDF export with DOM-safe logo injection and automatic error log capture.
// Usage:
//  1) Place your logo at: /public/brand-logo.png  (same-origin, avoids CORS)
//  2) Ensure your plan wrapper has id="plan-root" (already in v4)
//  3) Import and render <DownloadPlanPDF /> inside your Plan page header/toolbox
//  4) If anything fails, a small "Export log" chip appears to download errors

import React, { useCallback, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ---------- Types ----------
interface ExportOptions {
  filename?: string;
  logoSrc?: string; // e.g. "/brand-logo.png" in /public
  headerTitle?: string; // fallback text header if logo fails/unavailable
}

// ---------- Helpers ----------
function nowISO() {
  return new Date().toISOString();
}

function startConsoleCapture(target: Array<string>) {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    try {
      target.push(`[${nowISO()}] ERROR: ` + args.map(String).join(" "));
    } catch {}
    originalError(...args);
  };
  console.warn = (...args: any[]) => {
    try {
      target.push(`[${nowISO()}] WARN: ` + args.map(String).join(" "));
    } catch {}
    originalWarn(...args);
  };
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
}

async function ensureImageDecodes(src: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // safe for same-origin /public
    img.onload = () => {
      // Attempt decode() where supported for better timing accuracy
      // @ts-ignore
      if (img.decode) {
        // @ts-ignore
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => reject(new Error("Logo failed to load"));
    img.src = src;
  });
}

function makeHeader(logoOk: boolean, opts: Required<Omit<ExportOptions, "filename">>) {
  const header = document.createElement("div");
  header.setAttribute("data-export-header", "");
  // Soft, calm header styling to match app theme (teal/lavender vibe)
  header.style.padding = "16px";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "12px";
  header.style.borderBottom = "1px solid #e5e7eb"; // gray-200
  header.style.background = "#F5FAFA"; // soft teal tint

  if (logoOk) {
    const img = document.createElement("img");
    img.src = opts.logoSrc;
    img.alt = "Brand Logo";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.objectFit = "contain";
    img.style.flexShrink = "0";
    header.appendChild(img);
  }

  const title = document.createElement("div");
  title.textContent = opts.headerTitle;
  title.style.fontWeight = "600";
  title.style.fontSize = "16px";
  title.style.color = "#0f766e"; // teal-700
  header.appendChild(title);

  const date = document.createElement("div");
  date.textContent = new Date().toLocaleString();
  date.style.marginLeft = "auto";
  date.style.fontSize = "12px";
  date.style.color = "#6b7280"; // gray-500
  header.appendChild(date);

  return header;
}

function wrapForA4(element: HTMLElement, header: HTMLElement) {
  // A4 width in CSS px at 96 DPI ≈ 794px; leave small padding
  const wrapper = document.createElement("div");
  wrapper.style.width = "764px";
  wrapper.style.padding = "16px";
  wrapper.style.background = "#ffffff";
  wrapper.style.color = "#111827"; // gray-900
  wrapper.style.fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

  wrapper.appendChild(header);

  const clone = element.cloneNode(true) as HTMLElement;
  // Ensure backgrounds are white for PDF readability
  (clone.style as any).background = "#ffffff";
  wrapper.appendChild(clone);

  return wrapper;
}

async function tryJsPdfHtml(planEl: HTMLElement, options: Required<ExportOptions>, logs: string[]) {
  const a4 = { unit: "pt" as const, format: "a4" as const, orientation: "p" as const };
  const doc = new jsPDF(a4);

  let logoOk = false;
  try {
    await ensureImageDecodes(options.logoSrc);
    logoOk = true;
  } catch (e: any) {
    logs.push(`[${nowISO()}] INFO: Proceeding with text header (logo not used): ${e?.message || e}`);
  }

  const header = makeHeader(logoOk, {
    logoSrc: options.logoSrc,
    headerTitle: options.headerTitle,
  });

  const wrapper = wrapForA4(planEl, header);
  // Place off-screen to avoid flicker but remain renderable
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  document.body.appendChild(wrapper);

  try {
    await doc.html(wrapper, {
      x: 24,
      y: 24,
      width: 548, // roughly A4 pt width minus margins
      windowWidth: wrapper.clientWidth,
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      },
    } as any);
  } finally {
    document.body.removeChild(wrapper);
  }

  doc.save(options.filename);
}

async function fallbackCanvasMultipage(planEl: HTMLElement, options: Required<ExportOptions>, logs: string[]) {
  const a4 = { unit: "pt" as const, format: "a4" as const, orientation: "p" as const };
  const pdf = new jsPDF(a4);

  let logoOk = false;
  try {
    await ensureImageDecodes(options.logoSrc);
    logoOk = true;
  } catch {}
  const header = makeHeader(logoOk, {
    logoSrc: options.logoSrc,
    headerTitle: options.headerTitle,
  });

  const wrapper = wrapForA4(planEl, header);
  // Temporarily attach for accurate measurement and rasterization
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth; // fit to width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0; // top of first page

    // First page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Additional pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight; // this shifts the big image up
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(options.filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}

// ---------- Component ----------
export const DownloadPlanPDF: React.FC<{
  selector?: string; // plan container selector
  filename?: string;
  logoSrc?: string;
  headerTitle?: string;
}> = ({
  selector = "#plan-root",
  filename = "GloWell-Plan.pdf",
  logoSrc = "/brand-logo.png",
  headerTitle = "GloWell — Personal Wellness Plan",
}) => {
  const [busy, setBusy] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);

  const opts = useMemo<Required<ExportOptions>>(
    () => ({ filename, logoSrc, headerTitle }),
    [filename, logoSrc, headerTitle]
  );

  const downloadLog = useCallback(() => {
    const blob = new Blob([logRef.current.join("\n") || "No errors captured."], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pdf-export-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    logRef.current = [];
    const stop = startConsoleCapture(logRef.current);

    try {
      const planEl = document.querySelector(selector) as HTMLElement | null;
      if (!planEl) {
        const msg = `Plan container not found for selector: ${selector}`;
        console.error(msg);
        alert(msg);
        return;
      }

      // Primary path: jsPDF.html
      try {
        await tryJsPdfHtml(planEl, opts, logRef.current);
      } catch (e: any) {
        logRef.current.push(
          `[${nowISO()}] INFO: Falling back to html2canvas multipage due to: ${e?.message || e}`
        );
        await fallbackCanvasMultipage(planEl, opts, logRef.current);
      }
    } catch (err: any) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Click the log chip to download details.");
    } finally {
      stop();
      setBusy(false);
      // surface any captured lines
      setLogLines([...logRef.current]);
    }
  }, [busy, opts, selector]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleExport}
        disabled={busy}
        className={
          "px-4 py-2 rounded-xl shadow-sm border border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        }
        aria-busy={busy}
      >
        {busy ? "Exporting…" : "Download PDF"}
      </button>

      {logLines.length > 0 && (
        <button
          onClick={downloadLog}
          className="px-3 py-1 rounded-full text-xs border border-gray-300 hover:bg-gray-50"
          title="Download export log"
        >
          Export log
        </button>
      )}
    </div>
  );
};

export default DownloadPlanPDF;
