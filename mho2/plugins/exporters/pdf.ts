// File: mho2/plugins/exporters/pdf.ts
import { jsPDF } from "jspdf";

function line(doc: jsPDF, text: string, x: number, y: number) {
  doc.text(String(text ?? ""), x, y);
  return y + 14;
}

export async function savePlanPDF(plan: any, filename = "WellnessPlanV2.pdf") {
  const d = plan?.day || {};
  const title =
    plan?.meta?.userTitle?.trim?.() ||
    plan?.meta?.title?.trim?.() ||
    "Daily Wellness Plan (V2) — Non-wellness";
  const generated = plan?.meta?.generatedAtISO || new Date().toISOString();

  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 40, 50);

  // Meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${generated}`, 40, 68);

  // Body
  doc.setFontSize(12);
  let y = 100;

  doc.setFont("helvetica", "bold");
  y = line(doc, "Basics", 40, y);
  doc.setFont("helvetica", "normal");
  y = line(doc, `Wake: ${d.wake || "-"}`, 40, y);
  y = line(doc, `Sleep: ${d.sleep || "-"}`, 40, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  y = line(doc, "Hydration", 40, y);
  doc.setFont("helvetica", "normal");
  y = line(doc, (d.hydration?.schedule || []).join(", ") || "-", 40, y);
  if (d.hydration?.notes?.length) y = line(doc, `Notes: ${d.hydration.notes.join(" • ")}`, 40, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  y = line(doc, "Movement", 40, y);
  doc.setFont("helvetica", "normal");
  (d.movement?.blocks || []).forEach((b: string) => (y = line(doc, `• ${b}`, 40, y)));
  if (d.movement?.notes?.length) y = line(doc, `Notes: ${d.movement.notes.join(" • ")}`, 40, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  y = line(doc, "Meals", 40, y);
  doc.setFont("helvetica", "normal");
  (d.meals || []).forEach((m: any) => {
    const ideas = (m.ideas || []).join(", ") || "-";
    const avoid = (m.avoid || []).join(", ") || "-";
    y = line(doc, `${m.label}: ${ideas}`, 40, y);
    y = line(doc, `   (avoid: ${avoid})`, 40, y);
  });

  // Footer / disclaimer
  const disclaimer =
    plan?.meta?.disclaimerText ||
    "Neutral, non-wellness guidance. Not a wellness review or support plan.";
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(disclaimer, 40, 780, { maxWidth: 515 });

  doc.save(filename);
}
