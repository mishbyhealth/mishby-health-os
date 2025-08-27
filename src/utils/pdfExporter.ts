// src/utils/pdfExporter.ts

// ---- helpers ----
async function toDataURL(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// px/pt mapping (jsPDF uses pt; browser DOM uses px ~ 96dpi)
const PX_PER_PT = 96 / 72;

// ---- main styled/text exporter ----
export async function exportPlanPDF(planEl: HTMLElement, mode: "text" | "image" = "text") {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  const fileName = `GloWell_HealthPlan_${stamp}.pdf`;

  const pdf = new jsPDF("p", "pt", "a4");
  (pdf as any).setProperties?.({
    title: "GloWell — Personal Wellness Plan",
    author: "GloWell",
    subject: "Health Plan",
  });

  // page + content box
  const pageWpt = pdf.internal.pageSize.getWidth();
  const pageHpt = pdf.internal.pageSize.getHeight();
  const margin = { top: 60, right: 40, bottom: 60, left: 40 };
  const contentWpt = pageWpt - margin.left - margin.right;
  const contentWpx = Math.floor(contentWpt * PX_PER_PT); // clamp DOM width to this

  // Temporarily constrain export width to avoid right cutoff/overlap
  const prev = {
    width: planEl.style.width,
    maxWidth: (planEl.style as any).maxWidth,
    boxSizing: planEl.style.boxSizing,
  };
  planEl.style.boxSizing = "border-box";
  planEl.style.width = `${contentWpx}px`;
  (planEl.style as any).maxWidth = "none";

  try {
    const hasHtml = typeof (pdf as any).html === "function";

    if (mode === "text" && hasHtml) {
      await (pdf as any).html(planEl, {
        // Important: give x/y and exact width matching content box
        x: margin.left,
        y: margin.top,
        width: contentWpt, // in pt
        autoPaging: "text",
        // Better accuracy; letterRendering avoids glyph crowding
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FFFFFF", letterRendering: true },
        callback: async (doc: any) => {
          const pageCount = doc.getNumberOfPages();
          const logoData =
            (await toDataURL("/logo.png")) ||
            (await toDataURL("/logo.svg")) ||
            null;

          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Header
            if (logoData) {
              doc.addImage(logoData, "PNG", margin.left, 18, 18, 18);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(12);
              doc.text("GloWell — Personal Wellness Plan", margin.left + 24, 32);
            } else {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(12);
              doc.text("GloWell — Personal Wellness Plan", margin.left, 32);
            }
            doc.setDrawColor(30, 41, 59);
            doc.setLineWidth(0.5);
            doc.line(margin.left, 38, pageWpt - margin.right, 38);

            // Footer
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(
              `Page ${i} of ${pageCount}`,
              pageWpt - margin.right - 100,
              pageHpt - 24
            );
          }

          doc.save(fileName);
        },
      });
      return;
    }

    // ---- IMAGE fallback (robust) ----
    const canvas = await html2canvas(planEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFFFF",
      windowWidth: contentWpx, // ensure capture matches our clamped width
      windowHeight: planEl.scrollHeight,
      letterRendering: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWpt = contentWpt;
    const imgHpt = (canvas.height * (imgWpt * PX_PER_PT)) / canvas.width / PX_PER_PT;

    let y = margin.top;
    let remaining = imgHpt;

    pdf.addImage(imgData, "PNG", margin.left, y, imgWpt, imgHpt, undefined, "FAST");
    remaining -= (pageHpt - margin.top - margin.bottom);

    while (remaining > 0) {
      pdf.addPage();
      y = margin.top - (imgHpt - remaining);
      pdf.addImage(imgData, "PNG", margin.left, y, imgWpt, imgHpt, undefined, "FAST");
      remaining -= (pageHpt - margin.top - margin.bottom);
    }

    pdf.save(fileName);
  } finally {
    // Restore DOM styles
    planEl.style.width = prev.width;
    (planEl.style as any).maxWidth = prev.maxWidth;
    planEl.style.boxSizing = prev.boxSizing;
  }
}

// ---- ALWAYS-extractable plain-text exporter (backup) ----
export async function exportPlanPDFPureText(planEl: HTMLElement) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "pt", "a4");

  (doc as any).setProperties?.({
    title: "GloWell — Personal Wellness Plan (Text Export)",
    author: "GloWell",
  });

  const margin = { top: 60, left: 40, right: 40, bottom: 60 };
  const width = doc.internal.pageSize.getWidth() - margin.left - margin.right;
  const lineGap = 16;

  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("GloWell — Personal Wellness Plan (Text Export)", margin.left, margin.top);

  let cursorY = margin.top + 24;

  const blocks: string[] = [];
  planEl.querySelectorAll("h2, h3, li, p").forEach((node) => {
    const tag = node.tagName.toLowerCase();
    const text = (node as HTMLElement).innerText.trim();
    if (!text) return;
    if (tag === "h2" || tag === "h3") blocks.push(`\n${text.toUpperCase()}\n`);
    else blocks.push(`• ${text}`);
  });

  doc.setFont("helvetica", "normal"); doc.setFontSize(12);
  const lines = doc.splitTextToSize(blocks.join("\n"), width);
  const pageH = doc.internal.pageSize.getHeight();

  for (const line of lines) {
    if (cursorY > pageH - margin.bottom) {
      doc.addPage(); cursorY = margin.top;
    }
    doc.text(line, margin.left, cursorY);
    cursorY += lineGap;
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${total}`,
      doc.internal.pageSize.getWidth() - 100,
      doc.internal.pageSize.getHeight() - 24
    );
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  doc.save(`GloWell_HealthPlan_TEXT_${stamp}.pdf`);
}
