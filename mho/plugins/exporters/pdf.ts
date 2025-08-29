/* mho/plugins/exporters/pdf.ts
   English-only PDF export with:
   - Portrait + Landscape
   - Header shows custom plan title (plan.meta.title) with robust fallbacks
   - Optional subtitle: "Prepared for <FirstName>"
   - Correct footer: "Page X of Y"
*/

const BRAND = {
  primary: "#1fb6ae",
  bg: "#f7f5ed",
  text: "#1a1a1a",
  border: "#dcd7c9",
  subtle: "#52616b",
  tableHeader: "#e9f7f6",
  zebra: "#fbfaf5",
};

const TYPE = { title: 18, h1: 13, body: 11, small: 10, tiny: 9 };
const SPACE = { pageTop: 90, margin: 36, gutter: 16, cardHeader: 26, cardPad: 12, line: 15 };

const UI = {
  logoPath: "/og.png",
  logoWidth: 34,
  showLogoOnEveryPage: true,
  titleFallback: "GloWell — Daily Wellness Plan",
  titleOtherPages: "Daily Wellness Plan",
};

/* ---------------- helpers ---------------- */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function tryFilterPlan(plan: any): Promise<any> {
  try {
    const mod: any = await import("../../compliance/ComplianceGuard");
    if (mod?.ComplianceGuard?.filterPlan) return mod.ComplianceGuard.filterPlan(plan);
  } catch {}
  return plan;
}

async function fetchAsDataURL(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result as string);
      fr.onerror = () => r(null);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

/** Find first name for the subtitle */
function getFirstName(): string | null {
  try {
    const w: any = window as any;
    const fromWindow = w?.__USER__?.firstName || w?.__USER__?.name?.split?.(" ")?.[0];
    if (fromWindow) return String(fromWindow);
    const raw = localStorage.getItem("glowell:user");
    if (raw) {
      const obj = JSON.parse(raw);
      return obj?.firstName || obj?.name?.split?.(" ")?.[0] || null;
    }
  } catch {}
  return null;
}

/** NEW: Robust title fetch (param → window.__PLAN__ → localStorage) */
function getPlanTitleFromAnywhere(plan: any): string {
  const fromParam = plan?.meta?.title;
  if (fromParam && String(fromParam).trim()) return String(fromParam).trim();

  try {
    const w: any = window as any;
    const fromWin = w?.__PLAN__?.meta?.title;
    if (fromWin && String(fromWin).trim()) return String(fromWin).trim();
  } catch {}

  try {
    const raw = localStorage.getItem("glowell:plan");
    if (raw) {
      const obj = JSON.parse(raw);
      const fromLS = obj?.meta?.title;
      if (fromLS && String(fromLS).trim()) return String(fromLS).trim();
    }
  } catch {}

  return "";
}

/* ---------------- header + footer ---------------- */
function addHeader(doc: any, opts: { logo?: string | null; title: string; subtitle?: string | null }) {
  const W = doc.internal.pageSize.getWidth();
  const [pr, pg, pb] = hexToRgb(BRAND.primary);
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, W, 18, "F");

  const M = SPACE.margin;
  const y = 30;
  const lw = UI.logoWidth;

  if (opts.logo) {
    try { doc.addImage(opts.logo, "PNG", M, y - lw * 0.33, lw, lw); } catch {}
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(TYPE.title);
  doc.setTextColor(0, 0, 0);
  doc.text(opts.title, W / 2, y, { align: "center" });

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.small);
  doc.text(new Date().toLocaleDateString(), W - M, y, { align: "right" });

  // Subtitle
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(TYPE.small);
    doc.setTextColor(60, 60, 60);
    doc.text(opts.subtitle, W / 2, y + 14, { align: "center" });
  }

  // Underline
  doc.setDrawColor(210);
  const underlineY = opts.subtitle ? y + 22 : y + 8;
  doc.line(SPACE.margin, underlineY, W - SPACE.margin, underlineY);
}

/** Footer: "Page X of Y" */
function drawFooter(doc: any, page: number, total: number) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = SPACE.margin;

  doc.setDrawColor(220);
  doc.line(M, H - 34, W - M, H - 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.tiny);
  doc.setTextColor(60, 60, 60);
  doc.text("© 2025 GloWell — Non-clinical, general wellness guidance", M, H - 22);
  doc.text(`Page ${page} of ${total}`, W - M, H - 22, { align: "right" });
}

/* ---------------- layout helpers ---------------- */
function wrap(doc: any, text: string[], width: number, lineH = SPACE.line) {
  const out: string[] = [];
  for (const t of text) out.push(...doc.splitTextToSize(t, width));
  return { lines: out, height: out.length * lineH };
}

/** Page break helper */
function ensureSpace(
  doc: any,
  need: number,
  y: number,
  topY: number,
  logo: string | null,
  subtitle: string | null
) {
  const H = doc.internal.pageSize.getHeight();
  const bottom = 42;
  if (y + need > H - bottom) {
    (doc as any).addPage?.();
    addHeader(doc, {
      logo: UI.showLogoOnEveryPage ? logo : null,
      title: UI.titleOtherPages,
      subtitle,
    });
    return topY;
  }
  return y;
}

/* ---------------- cards + table ---------------- */
type SectionCard = { heading: string; lines: string[] };

function renderCard(doc: any, x: number, y: number, w: number, card: SectionCard): number {
  const pad = SPACE.cardPad;
  const headerH = SPACE.cardHeader;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.body);
  const measured = wrap(doc, card.lines, w - pad * 2);
  const bodyH = measured.height + pad * 2;
  const h = headerH + bodyH;

  // Header bg
  const [pr, pg, pb] = hexToRgb(BRAND.primary);
  doc.setFillColor(pr, pg, pb);
  doc.setDrawColor(210);
  doc.rect(x, y, w, headerH, "F");

  // Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(TYPE.h1);
  doc.setTextColor(255, 255, 255);
  doc.text(card.heading, x + pad, y + headerH - 9);

  // Body bg
  const [br, bg, bb] = hexToRgb(BRAND.bg);
  doc.setFillColor(br, bg, bb);
  doc.setTextColor(35, 35, 35);
  doc.rect(x, y + headerH, w, bodyH, "F");

  // Text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.body);
  let ty = y + headerH + pad + 2;
  for (const line of measured.lines) {
    doc.text(line, x + pad, ty);
    ty += SPACE.line;
  }

  // Border
  const [borR, borG, borB] = hexToRgb(BRAND.border);
  doc.setDrawColor(borR, borG, borB);
  doc.rect(x, y, w, h);

  return h;
}

function renderMealsTable(
  doc: any,
  x: number,
  y: number,
  w: number,
  rows: Array<{ label?: string; ideas?: string[]; avoid?: string[] }>
) {
  const cellPad = 8;
  const headerH = 24;
  const lineH = SPACE.line - 1;

  const col1 = Math.round(w * 0.2);
  const col2 = Math.round(w * 0.55);
  const col3 = w - col1 - col2;

  // Header
  const [thR, thG, thB] = hexToRgb(BRAND.tableHeader);
  doc.setFillColor(thR, thG, thB);
  doc.rect(x, y, w, headerH, "F");
  doc.setDrawColor(210);
  doc.rect(x, y, w, headerH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(TYPE.body);
  doc.setTextColor(30, 30, 30);
  doc.text("Meal", x + cellPad, y + 16);
  doc.text("Ideas", x + col1 + cellPad, y + 16);
  doc.text("Avoid", x + col1 + col2 + cellPad, y + 16);

  // Rows
  let yy = y + headerH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.small);
  const [borR, borG, borB] = hexToRgb(BRAND.border);
  doc.setDrawColor(borR, borG, borB);

  rows.forEach((r, idx) => {
    const label = r?.label ?? "";
    const ideasTxt = (Array.isArray(r?.ideas) ? r!.ideas.join(", ") : "") || "";
    const avoidTxt = (Array.isArray(r?.avoid) ? r!.avoid.join(", ") : "") || "";

    const l1 = doc.splitTextToSize(label, col1 - cellPad * 2);
    const l2 = doc.splitTextToSize(ideasTxt, col2 - cellPad * 2);
    const l3 = doc.splitTextToSize(avoidTxt, col3 - cellPad * 2);
    const lines = Math.max(l1.length, l2.length, l3.length) || 1;
    const rowH = lines * lineH + 8;

    // zebra
    if (idx % 2 === 1) {
      const [zr, zg, zb] = hexToRgb(BRAND.zebra);
      doc.setFillColor(zr, zg, zb);
      doc.rect(x, yy, w, rowH, "F");
    }

    // borders
    doc.rect(x, yy, col1, rowH);
    doc.rect(x + col1, yy, col2, rowH);
    doc.rect(x + col1 + col2, yy, col3, rowH);

    // text
    let ty = yy + 14;
    l1.forEach(line => { doc.text(line, x + cellPad, ty); ty += lineH; });
    ty = yy + 14;
    l2.forEach(line => { doc.text(line, x + col1 + cellPad, ty); ty += lineH; });
    ty = yy + 14;
    l3.forEach(line => { doc.text(line, x + col1 + col2 + cellPad, ty); ty += lineH; });

    yy += rowH;
  });

  return yy - y;
}

/* ---------------- core builder with orientation ---------------- */
async function buildPDF(plan: any, orientation: "portrait" | "landscape"): Promise<Blob> {
  // NEW: capture title from multiple sources BEFORE any filtering
  const rawTitle = getPlanTitleFromAnywhere(plan);

  const mod: any = await import("jspdf");
  const JSPDFClass = mod.jsPDF || mod.default;
  const doc: any = new JSPDFClass({ orientation, unit: "pt", format: "a4" });

  const safePlan = await tryFilterPlan(plan);
  const logo = await fetchAsDataURL(UI.logoPath);

  // Title & subtitle
  const planTitle: string = rawTitle ? `GloWell — ${rawTitle}` : UI.titleFallback;
  const firstName = getFirstName();
  const subtitle = firstName ? `Prepared for ${firstName}` : null;

  // Header
  addHeader(doc, { logo, title: planTitle, subtitle });

  const W = doc.internal.pageSize.getWidth();
  const M = SPACE.margin;
  const contentW = W - M * 2;
  const colW = Math.floor((contentW - SPACE.gutter) / 2);
  const topY = SPACE.pageTop;
  let y = topY;

  // Disclaimer
  const disc =
    safePlan?.meta?.disclaimerText ||
    "This PDF contains non-clinical, general wellness guidance only. For medical concerns, consult a qualified professional.";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(TYPE.small);
  doc.setTextColor(80, 80, 80);
  const discWrapped = doc.splitTextToSize(disc, contentW);
  const discH = discWrapped.length * (SPACE.line - 2) + 6;
  y = ensureSpace(doc, discH, y, topY, logo, subtitle);
  doc.text(discWrapped, M, y);
  y += discH;

  // Data prep
  const H = safePlan?.day?.hydration || {};
  const hydration: string[] = [];
  if (Array.isArray(H.schedule) && H.schedule.length) hydration.push(...H.schedule.map((t: string) => `• ${t}`));
  if (Array.isArray(H.notes) && H.notes.length) hydration.push(`Notes: ${H.notes.join(" • ")}`);
  if (H.target) hydration.push(`Target: ${H.target}`);
  if (!hydration.length) hydration.push("• As per your day’s routine");

  const MV = safePlan?.day?.movement || {};
  const movement: string[] = [];
  if (Array.isArray(MV.blocks) && MV.blocks.length) movement.push(...MV.blocks.map((b: string) => `• ${b}`));
  if (Array.isArray(MV.notes) && MV.notes.length) movement.push(`Notes: ${MV.notes.join(" • ")}`);
  if (!movement.length) movement.push("• Gentle stretches and a brisk walk");

  // Two cards
  doc.setFont("helvetica", "normal");
  doc.setFontSize(TYPE.body);
  const leftMeasure = wrap(doc, hydration, colW - SPACE.cardPad * 2);
  const rightMeasure = wrap(doc, movement, colW - SPACE.cardPad * 2);
  const leftH = SPACE.cardHeader + (leftMeasure.height + SPACE.cardPad * 2);
  const rightH = SPACE.cardHeader + (rightMeasure.height + SPACE.cardPad * 2);
  const rowH = Math.max(leftH, rightH);

  y = ensureSpace(doc, rowH, y, topY, logo, subtitle);
  const usedLeft = renderCard(doc, M, y, colW, { heading: "Hydration", lines: hydration });
  const usedRight = renderCard(doc, M + colW + SPACE.gutter, y, colW, { heading: "Movement", lines: movement });
  y += Math.max(usedLeft, usedRight) + 14;

  // Meals
  const meals = Array.isArray(safePlan?.day?.meals) ? safePlan.day.meals : [];
  const rows = meals.length
    ? meals.map((m: any) => ({ label: m?.label ?? "", ideas: m?.ideas ?? [], avoid: m?.avoid ?? [] }))
    : [{ label: "Balanced Plate", ideas: ["Veg + whole grains + protein"], avoid: [] }];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(TYPE.h1);
  const [sr, sg, sb] = hexToRgb(BRAND.subtle);
  doc.setTextColor(sr, sg, sb);

  const approx = 24 + rows.length * 28;
  y = ensureSpace(doc, approx, y, topY, logo, subtitle);
  doc.text("Meals", M, y);
  y += 6;

  doc.setTextColor(35, 35, 35);
  const tableH = renderMealsTable(doc, M, y, contentW, rows);
  y += tableH + 6;

  // Footers: "Page X of Y"
  const total = (doc as any).getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= total; p++) {
    (doc as any).setPage?.(p);
    drawFooter(doc, p, total);
  }

  const blob = (doc as any).output?.("blob");
  return blob instanceof Blob ? blob : new Blob([], { type: "application/pdf" });
}

/* ---------------- public APIs ---------------- */
export async function exportPlanPDF(plan: any): Promise<Blob> {
  return buildPDF(plan, "portrait");
}
export async function exportPlanPDFLandscape(plan: any): Promise<Blob> {
  return buildPDF(plan, "landscape");
}
