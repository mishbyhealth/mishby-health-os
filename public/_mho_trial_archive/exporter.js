// public/mho/exporter.js
// Trial-only PDF exporter that attaches window.exportPlanToPDF without TypeScript imports.

(function () {
  if (window.exportPlanToPDF) return;

  function loadPdfLib() {
    return new Promise(function (resolve, reject) {
      if (window.PDFLib) return resolve(window.PDFLib);
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      s.onload = function () { resolve(window.PDFLib); };
      s.onerror = function () { reject(new Error('Failed to load pdf-lib CDN')); };
      document.head.appendChild(s);
    });
  }

  window.exportPlanToPDF = async function (plan) {
    const PDFLib = await loadPdfLib();
    const { PDFDocument, StandardFonts, rgb } = PDFLib;

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const width = page.getWidth();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const margin = 48;
    let y = 812;

    function wrap(text, maxWidth, size, fnt) {
      const words = String(text || '').split(/\s+/);
      const out = [];
      let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (fnt.widthOfTextAtSize(t, size) > maxWidth && line) {
          out.push(line);
          line = w;
        } else line = t;
      }
      if (line) out.push(line);
      return out;
    }

    function write(text, size, fnt) {
      size = size || 12; fnt = fnt || font;
      const lines = wrap(text, width - margin * 2, size, fnt);
      for (const line of lines) {
        if (y < 72) y = 812;
        page.drawText(line, { x: margin, y, size, font: fnt, color: rgb(0, 0, 0) });
        y -= size + 6;
      }
    }

    write(plan.title || 'GloWell — Personalized Plan', 18, bold);
    y -= 28;
    write('Created: ' + (plan.createdAt || new Date().toISOString()));
    y -= 6;

    write('Profile', 14, bold);
    if (plan.profile) {
      Object.entries(plan.profile).forEach(function ([k, v]) { write(k + ': ' + String(v)); });
    }
    y -= 6;

    write('Daily Schedule', 14, bold);
    (plan.schedule || []).forEach(function (s) { write((s.time || '') + ' — ' + s.title + (s.detail ? ': ' + s.detail : '')); });
    y -= 6;

    if (Array.isArray(plan.recommendations) && plan.recommendations.length) {
      write('Recommendations', 14, bold);
      plan.recommendations.forEach(function (r) { write('• ' + r); });
      y -= 6;
    }
    if (Array.isArray(plan.avoid) && plan.avoid.length) {
      write('Avoid', 14, bold);
      plan.avoid.forEach(function (a) { write('• ' + a); });
    }

    const bytes = await pdf.save();
    // Make a plain ArrayBuffer for Blob
    const buf = new ArrayBuffer(bytes.length);
    new Uint8Array(buf).set(bytes);
    const blob = new Blob([buf], { type: 'application/pdf' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GloWell_Plan_' + Date.now() + '.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
})();
