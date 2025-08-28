/* src/pages/HealthPlan.tsx
   Adds a second button for Landscape PDF export
*/
import React from "react";
import PlanView from "./PlanView";
import { exportPlanPDF, exportPlanPDFLandscape } from "../../mho/plugins/exporters/pdf";

function loadPlan(): any {
  const fromWindow = (window as any).__PLAN__;
  if (fromWindow) return fromWindow;
  try {
    const raw = localStorage.getItem("glowell:plan");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    meta: { disclaimerText: "Non-clinical, general wellness guidance." },
    day: {
      hydration: {
        schedule: ["Morning: 300 ml warm water", "Before lunch: 300 ml", "Evening: 300 ml"],
        notes: ["Sip slowly", "Adjust by climate/activity"],
        target: "2400 ml",
      },
      movement: {
        blocks: ["8k steps target", "Every 60–90 min: 3–5 min stretch", "15–25 min brisk walk"],
        notes: ["Keep posture neutral"],
      },
      meals: [
        { label: "Breakfast", ideas: ["Whole grains", "Protein", "Fruit"], avoid: [] },
        { label: "Lunch", ideas: ["Dal/beans", "Veg", "Brown rice/Roti"], avoid: [] },
        { label: "Evening", ideas: ["Fruit or nuts (small)"], avoid: [] },
        { label: "Dinner (light)", ideas: ["Veg + protein"], avoid: ["Heavy fried", "Late meals"] },
      ],
    },
  };
}

/** Read user first name from multiple places */
function getUserFirstName(plan: any): string | null {
  const wUser = (window as any).__USER__;
  const fromWindow = wUser?.firstName || wUser?.name?.split?.(" ")?.[0];

  const fromPlan =
    plan?.meta?.user?.firstName ||
    plan?.meta?.userName?.split?.(" ")?.[0];

  let fromStorage: string | null = null;
  try {
    const raw = localStorage.getItem("glowell:user");
    if (raw) {
      const obj = JSON.parse(raw);
      fromStorage = obj?.firstName || obj?.name?.split?.(" ")?.[0] || null;
    }
  } catch {}

  return (fromWindow || fromPlan || fromStorage || null) ?? null;
}

function sanitizeForFilename(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

/** Ask once for first name and store it */
function ensureFirstName(): string | null {
  try {
    const stored = localStorage.getItem("glowell:user");
    if (stored) {
      const obj = JSON.parse(stored);
      if (obj?.firstName) return obj.firstName as string;
    }
  } catch {}
  const input = window.prompt("Optional: enter your first name for the PDF filename", "");
  const name = (input || "").trim();
  if (!name) return null;
  const safe = sanitizeForFilename(name);
  try {
    localStorage.setItem("glowell:user", JSON.stringify({ firstName: safe }));
  } catch {}
  (window as any).__USER__ = { ...(window as any).__USER__, firstName: safe };
  return safe;
}

function buildFilename(suffix: string, includeName: boolean, plan: any) {
  const date = new Date().toISOString().slice(0, 10);
  let first = getUserFirstName(plan);
  if (!first && includeName) first = ensureFirstName();
  const namePart = first ? "_" + sanitizeForFilename(first) : "";
  return `GloWell_Plan_${date}${namePart}${suffix}.pdf`;
}

export default function HealthPlan() {
  const plan = React.useMemo(() => loadPlan(), []);
  const [downloadingPortrait, setDownloadingPortrait] = React.useState(false);
  const [downloadingLandscape, setDownloadingLandscape] = React.useState(false);

  async function handleDownloadPortrait() {
    if (downloadingPortrait) return;
    setDownloadingPortrait(true);
    try {
      const blob = await exportPlanPDF(plan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildFilename("", true, plan); // e.g., ..._Mukul.pdf
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF export (portrait) failed:", e);
      alert("PDF export failed — see Console for details.");
    } finally {
      setDownloadingPortrait(false);
    }
  }

  async function handleDownloadLandscape() {
    if (downloadingLandscape) return;
    setDownloadingLandscape(true);
    try {
      const blob = await exportPlanPDFLandscape(plan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildFilename("_Landscape", true, plan); // e.g., ..._Mukul_Landscape.pdf
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF export (landscape) failed:", e);
      alert("PDF export failed — see Console for details.");
    } finally {
      setDownloadingLandscape(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Health Plan</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPortrait}
            disabled={downloadingPortrait}
            className={[
              "px-3 py-2 rounded-lg border transition",
              "border-[#1fb6ae]/30",
              downloadingPortrait
                ? "bg-[#1fb6ae]/40 text-white cursor-not-allowed"
                : "bg-[#1fb6ae] text-white hover:bg-[#18a299]"
            ].join(" ")}
            title="Download as PDF (Portrait)"
          >
            {downloadingPortrait ? "Downloading…" : "⬇️ Download PDF"}
          </button>

          <button
            onClick={handleDownloadLandscape}
            disabled={downloadingLandscape}
            className={[
              "px-3 py-2 rounded-lg border transition",
              "border-[#1fb6ae]/30",
              downloadingLandscape
                ? "bg-[#1fb6ae]/20 text-[#1fb6ae] cursor-not-allowed"
                : "bg-white text-[#1fb6ae] hover:bg-[#e9f7f6]"
            ].join(" ")}
            title="Download as PDF (Landscape)"
          >
            {downloadingLandscape ? "Preparing…" : "⬇️ Download (Landscape)"}
          </button>
        </div>
      </div>

      <PlanView plan={plan} />
    </div>
  );
}
