import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Safe PDF Exporter with Optional Brand Logo
 * - Captures #plan-root
 * - Adds logo (if present) at top of first page
 * - Falls back to text header if logo not found / fails
 * - A4 portrait, margins, multi-page support
 */

type Props = {
  buttonLabel?: string;
  logoSrc?: string; // default: "/brand/logo-hero.png"
  fileName?: string; // default: "GloWell-Plan.pdf"
};

async function loadImageToDataURL(src: string): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = src;
    });

    // draw to canvas → dataURL
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export default function PDFExportButton({
  buttonLabel = "Download PDF",
  logoSrc = "/brand/logo-hero.png",
  fileName = "GloWell-Plan.pdf",
}: Props) {
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    const root = document.getElementById("plan-root");
    if (!root) {
      alert("Plan not found. Make sure there is an element with id='plan-root'.");
      return;
    }

    setBusy(true);
    try {
      // Capture the plan area
      const scale = window.devicePixelRatio > 1 ? 2 : 1.5;
      const canvas = await html2canvas(root, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      // PDF setup (A4 portrait)
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      // Optional logo (top of first page)
      let headerHeight = 0;
      let logoData: string | null = null;

      if (logoSrc) {
        logoData = await loadImageToDataURL(logoSrc);
        if (logoData) {
          // Draw logo approx 30mm high (auto width)
          const desiredHeight = 18; // keep it small & neat
          const desiredWidth = usableWidth * 0.45; // ~45% width
          const x = margin;
          const y = margin;
          pdf.addImage(logoData, "PNG", x, y, desiredWidth, desiredHeight, "", "FAST");
          headerHeight = desiredHeight + 4; // space below logo
        } else {
          // Fallback text header (no crash)
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(14);
          pdf.text("Health Plan", margin, margin + 6);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.text("Powered by GloWell", margin, margin + 12);
          headerHeight = 18;
        }
      }

      // Add captured plan image as multi-page if needed
      const imgProps = {
        width: usableWidth,
        height: (canvas.height * usableWidth) / canvas.width,
      };

      // First page Y starts after header
      let remainingHeight = imgProps.height;
      let positionY = margin + headerHeight;

      // Draw chunks per page
      // We re-add the same big image, shifting the viewport using 'addImage' with 'clip' is complex.
      // Simpler approach: slice canvas into page-height chunks.
      const sliceHeightPx = Math.floor(((usableHeight - headerHeight) * canvas.height) / imgProps.height);
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) throw new Error("Canvas context not available.");

      let startYpx = 0;
      let pageIndex = 0;

      while (remainingHeight > 0) {
        const chunkHeightPx = Math.min(sliceHeightPx, canvas.height - startYpx);

        // Prepare slice canvas
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = chunkHeightPx;
        const sctx = sliceCanvas.getContext("2d");
        if (!sctx) throw new Error("Slice context not available.");

        sctx.drawImage(
          canvas,
          0,
          startYpx,
          canvas.width,
          chunkHeightPx,
          0,
          0,
          canvas.width,
          chunkHeightPx
        );

        const sliceData = sliceCanvas.toDataURL("image/png");
        const sliceHeightMM = (chunkHeightPx * usableWidth) / canvas.width;

        if (pageIndex > 0) {
          pdf.addPage();
          // On next pages, small top margin only
          positionY = margin;
        }

        pdf.addImage(sliceData, "PNG", margin, positionY, usableWidth, sliceHeightMM, "", "FAST");

        startYpx += chunkHeightPx;
        remainingHeight -= sliceHeightMM;
        pageIndex += 1;
      }

      // Footer (tiny page number)
      const pageCount = pdf.getNumberOfPages();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const footerText = `Page ${i} of ${pageCount}`;
        pdf.text(footerText, pageWidth - margin - 30, pageHeight - 6);
      }

      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      alert("PDF export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className={`px-4 py-2 rounded-xl shadow ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
      title="Download your plan as PDF"
    >
      {busy ? "Preparing..." : (buttonLabel || "Download PDF")}
    </button>
  );
}
