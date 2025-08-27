// src/utils/pdfExporter.ts
// Classic, text-based PDF (no images) – clean bullets, safe margins, no clipping.

type Section = { title: string; items: string[] };

export async function exportPlanPDFClassic(sections: Section[]) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF("p", "pt", "a4");
  (doc as any).setProperties?.({
    title: "GloWell — Personal Wellness Plan",
    author: "GloWell",
    subject: "Health Plan",
  });

  // Page & layout
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Safe margins (slightly wider on sides to avoid any cut)
  const M = { top: 64, right: 56, bottom: 64, left: 56 };
  const W = pageW - M.left - M.right;

  // Typography
  const FONT = "helvetica";
  const SIZE = {
    title: 16,
    h: 14,
    body: 12,
    small: 10,
  };
  const GAP = {
    afterTitle: 18,
    afterH: 10,
    line: 16,
    bulletGap: 6,
  };
  const INDENT = { bulletDot: 6, bulletText: 16 };

  let y = M.top;

  // Header per page
  const drawHeader = () => {
    doc.setFont(FONT, "bold");
    doc.setFontSize(SIZE.title);
    doc.text("GloWell — Personal Wellness Plan", M.left, M.top - 28);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(M.left, M.top - 22, pageW - M.right, M.top - 22);
  };

  // Footer per page
  const drawFooterAllPages = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont(FONT, "normal");
      doc.setFontSize(SIZE.small);
      doc.text(
        `© GloWell · Non-clinical wellness guidance. Page ${i} of ${total}`,
        M.left,
        pageH - 22
      );
    }
  };

  // Ensure space or add page with header
  const ensure = (need: number) => {
    if (y + need <= pageH - M.bottom) return;
    doc.addPage();
    drawHeader();
    y = M.top;
  };

  // Start – first page header
  drawHeader();

  // Title (visual, optional – already in header; keep small title in body for clarity)
  doc.setFont(FONT, "bold");
  doc.setFontSize(SIZE.title);
  doc.text("GloWell — Personal Wellness Plan", M.left, y);
  y += GAP.afterTitle;

  // Render sections
  doc.setFont(FONT, "bold");
  doc.setFontSize(SIZE.h);

  for (const sec of sections) {
    // Section Heading
    ensure(SIZE.h + GAP.afterH);
    doc.text(sec.title, M.left, y);
    y += GAP.afterH;

    // Bullets
    doc.setFont(FONT, "normal");
    doc.setFontSize(SIZE.body);

    for (const raw of sec.items) {
      const text = raw.trim();
      // Wrap bullet text to fit width
      const wrapWidth = W - INDENT.bulletText;
      const lines = doc.splitTextToSize(text, wrapWidth);

      const bulletY = y;
      ensure(GAP.line * Math.max(1, lines.length));
      // Bullet dot
      doc.circle(M.left + INDENT.bulletDot, bulletY - 3.5, 1.2, "F");
      // Bullet text
      let lineY = bulletY;
      for (const ln of lines) {
        doc.text(ln, M.left + INDENT.bulletText, lineY);
        lineY += GAP.line;
      }
      y = bulletY + GAP.line * Math.max(1, lines.length) - (GAP.line - GAP.bulletGap);
    }

    // Gap after each section
    y += 6;
    // Reset heading style for next section
    doc.setFont(FONT, "bold");
    doc.setFontSize(SIZE.h);
  }

  // Timestamp (on last page near bottom)
  const stamp = new Date().toLocaleString();
  doc.setFont(FONT, "normal");
  doc.setFontSize(SIZE.small);
  ensure(24);
  doc.text(stamp, M.left, y + 14);

  // Footer on all pages (page X of Y)
  drawFooterAllPages();

  // Save
  const stampFile =
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}` +
    `_${String(new Date().getHours()).padStart(2, "0")}${String(new Date().getMinutes()).padStart(2, "0")}`;
  doc.save(`GloWell_Health_Plan_${stampFile}.pdf`);
}
