import React, { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type Plan = {
  title?: string;
  notes?: string;
  hydration?: string[];
  movement?: string[];
  meals?: string[];
};

type Props = { plan: Plan; fileName?: string; onBack?: () => void };

export default function PDFExporter({ plan, fileName = "Health-Plan.pdf", onBack }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const download = async () => {
    const el = printRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }
    pdf.save(fileName);
  };

  const Section = ({ name, items }: { name: string; items?: string[] }) => (
    <section style={{ marginTop: 14 }}>
      <h3 style={{ fontSize: 16, margin: 0, marginBottom: 8 }}>{name}</h3>
      {Array.isArray(items) && items.length ? (
        <ul style={{ marginTop: 0, marginLeft: 18 }}>
          {items.map((it, i) => (
            <li key={i} style={{ lineHeight: 1.6 }}>{it}</li>
          ))}
        </ul>
      ) : (
        <p style={{ opacity: 0.7, margin: 0 }}>No items yet.</p>
      )}
    </section>
  );

  return (
    <>
      {/* Controls (visible) */}
      <div style={{ display: "flex", gap: 8 }}>
        {onBack && <button onClick={onBack} className="btn">← Edit Form</button>}
        <button onClick={download} className="btn btn-primary">⬇ Download PDF</button>
      </div>

      {/* Hidden printable content */}
      <div
        ref={printRef}
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          width: 794,
          padding: 32,
          boxSizing: "border-box",
          background: "#fff",
          color: "#111827",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand)" }} />
          <div>
            <div style={{ fontSize: 14, color: "#6B7280" }}>GloWell • Live Naturally</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {plan?.title || "Your Daily Wellness Plan"}
            </div>
          </div>
        </div>

        <p style={{ marginTop: 0, marginBottom: 16, opacity: 0.85 }}>
          {plan?.notes || "Non-wellness general wellness suggestions. Adjust gently to your routine."}
        </p>

        <Section name="Hydration" items={plan?.hydration} />
        <Section name="Movement" items={plan?.movement} />
        <Section name="Meals" items={plan?.meals} />

        <footer style={{ marginTop: 28, fontSize: 10, color: "#6B7280" }}>
          © {new Date().getFullYear()} GloWell — Non-clinical guidance only.
        </footer>
      </div>
    </>
  );
}
