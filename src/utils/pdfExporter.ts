// src/utils/pdfExporter.ts

// Text/Styled exporter (tries jsPDF.html() → falls back to image mode)
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

  // ⚠️ IMPORTANT: check instance, not prototype
  const pdf = new jsPDF("p", "pt", "a4");
  const hasHtml = typeof (pdf as any).html === "function";

  if (mode === "text" && hasHtml) {
    await (pdf as any).html(planEl, {
      margin: [60, 40, 60, 40],
      autoPaging: "text",
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FFFFFF" },
      callback: (doc: any) => {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          // Header
          doc.setFont("helvetica", "bold"); doc.setFontSize(12);
          doc.text("GloWell — Personal Wellness Plan", 40, 32);
          // Footer
          doc.setFont("helvetica", "normal"); doc.setFontSize(10);
          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() - 100,
            doc.internal.pageSize.getHeight() - 24
          );
        }
        doc.save(fileName);
      },
    });
    return;
  }

  // IMAGE fallback (robust)
  const scale = 2;
  const canvas = await html2canvas(planEl, {
    scale,
    useCORS: true,
    backgroundColor: "#FFFFFF",
    windowWidth: planEl.scrollWidth,
    windowHeight: planEl.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let remainingHeight = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  remainingHeight -= pageHeight;

  while (remainingHeight > -pageHeight) {
    position = remainingHeight - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    remainingHeight -= pageHeight;
  }

  pdf.save(fileName);
}

// NEW: Pure-text exporter — always extractable/selectable
export async function exportPlanPDFPureText(planEl: HTMLElement) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "pt", "a4");

  const margin = { top: 60, left: 40, right: 40, bottom: 60 };
  const width = doc.internal.pageSize.getWidth() - margin.left - margin.right;
  const lineGap = 16;

  // Title
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("GloWell — Personal Wellness Plan (Text Export)", margin.left, margin.top);

  let cursorY = margin.top + 24;

  // Build a plain text from headings + lists (simple and robust)
  const blocks: string[] = [];
  planEl.querySelectorAll("h2, h3, li, p").forEach((node) => {
    const tag = node.tagName.toLowerCase();
    const text = (node as HTMLElement).innerText.trim();
    if (!text) return;
    if (tag === "h2" || tag === "h3") blocks.push(`\n${text.toUpperCase()}\n`);
    else blocks.push(`• ${text}`);
  });

  const joined = blocks.join("\n");
  doc.setFont("helvetica", "normal"); doc.setFontSize(12);

  const lines = doc.splitTextToSize(joined, width);

  const pageHeight = doc.internal.pageSize.getHeight();
  for (const line of lines) {
    if (cursorY > pageHeight - margin.bottom) {
      doc.addPage(); cursorY = margin.top;
    }
    doc.text(line, margin.left, cursorY);
    cursorY += lineGap;
  }

  // Footer
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
