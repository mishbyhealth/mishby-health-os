// src/utils/pdfExporter.ts

// px/pt mapping (jsPDF uses pt; DOM uses px @ 96dpi)
const PX_PER_PT = 96 / 72;

/**
 * IMAGE-PERFECT styled PDF (visual match, no clipping)
 * - Always uses html2canvas -> image -> multi-page
 * - Narrow safe content width so nothing cuts on the right
 */
export async function exportPlanPDF(planEl: HTMLElement) {
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

  // ---- A4 page + safe content box ----
  const pageWpt = pdf.internal.pageSize.getWidth();
  const pageHpt = pdf.internal.pageSize.getHeight();

  // थोड़ी ज्यादा सेफ्टी: left/right margin 56pt
  const margin = { top: 60, right: 56, bottom: 60, left: 56 };
  const contentWpt = pageWpt - margin.left - margin.right;
  const contentWpx = Math.floor(contentWpt * PX_PER_PT);

  // ---- Clamp DOM width (so nothing can overflow on right) ----
  const prev = {
    width: planEl.style.width,
    maxWidth: (planEl.style as any).maxWidth,
    boxSizing: planEl.style.boxSizing,
  };
  planEl.style.boxSizing = "border-box";
  planEl.style.width = `${contentWpx}px`;
  (planEl.style as any).maxWidth = "none";

  // PDF export mode (smaller font/padding via page CSS)
  planEl.classList.add("pdf-export");

  try {
    // Rasterize entire plan at this exact width
    const canvas = await html2canvas(planEl, {
      scale: 2,                       // crisp
      useCORS: true,
      backgroundColor: "#FFFFFF",
      windowWidth: contentWpx,        // important: clamp width
      windowHeight: planEl.scrollHeight,
      letterRendering: true,
    });

    const imgData = canvas.toDataURL("image/png");

    // Lay the big image across multiple pages by vertical shifting
    const usableHpt = pageHpt - margin.top - margin.bottom;      // content height per page
    const imgWpt = contentWpt;
    const imgHpt = (canvas.height / canvas.width) * imgWpt;

    // First page
    pdf.addImage(imgData, "PNG", margin.left, margin.top, imgWpt, imgHpt, undefined, "FAST");

    // Extra pages
    let rendered = usableHpt;
    while (rendered < imgHpt - 0.1) {
      pdf.addPage();
      const y = margin.top - rendered; // shift image up by what's already shown
      pdf.addImage(imgData, "PNG", margin.left, y, imgWpt, imgHpt, undefined, "FAST");
      rendered += usableHpt;
    }

    pdf.save(fileName);
  } finally {
    // Restore DOM
    planEl.classList.remove("pdf-export");
    planEl.style.width = prev.width;
    (planEl.style as any).maxWidth = prev.maxWidth;
    planEl.style.boxSizing = prev.boxSizing;
  }
}

/**
 * ALWAYS-SELECTABLE pure-text PDF (backup/export for copy/search)
 * - No styling; bullet text only
 */
export async function exportPlanPDFPureText(planEl: HTMLElement) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "pt", "a4");

  (doc as any).setProperties?.({
    title: "GloWell — Personal Wellness Plan (Text Export)",
    author: "GloWell",
  });

  const margin = { top: 60, left: 56, right: 56, bottom: 60 };
  const width = doc.internal.pageSize.getWidth() - margin.left - margin.right;
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("GloWell — Personal Wellness Plan (Text Export)", margin.left, margin.top);
  let y = margin.top + 24;

  // Collect simple text
  const lines: string[] = [];
  planEl.querySelectorAll("h2, h3, li, p").forEach((node) => {
    const tag = node.tagName.toLowerCase();
    const text = (node as HTMLElement).innerText.trim();
    if (!text) return;
    if (tag === "h2" || tag === "h3") lines.push("", text.toUpperCase(), "");
    else lines.push("• " + text);
  });

  doc.setFont("helvetica", "normal"); doc.setFontSize(12);
  const wrapped = doc.splitTextToSize(lines.join("\n"), width);
  for (const line of wrapped) {
    if (y > pageH - margin.bottom) { doc.addPage(); y = margin.top; }
    doc.text(line, margin.left, y);
    y += 16;
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
