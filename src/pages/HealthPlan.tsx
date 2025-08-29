import React from "react";
import PlanView from "./PlanView";
import { exportPlanPDF, exportPlanPDFLandscape } from "../../mho/plugins/exporters/pdf";

/* ---------- storage helpers ---------- */
const PLAN_KEY = "glowell:plan";
const USER_KEY = "glowell:user";

function loadPlan(): any {
  const fromWindow = (window as any).__PLAN__;
  if (fromWindow) return fromWindow;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // fallback starter
  return {
    meta: { title: "", disclaimerText: "Non-clinical, general wellness guidance." },
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
function savePlan(p: any) {
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); } catch {}
}

/* ---------- name helpers (for filename & “Prepared for …”) ---------- */
function getUserFirstName(plan: any): string | null {
  const wUser = (window as any).__USER__;
  const fromWindow = wUser?.firstName || wUser?.name?.split?.(" ")?.[0];
  const fromPlan = plan?.meta?.user?.firstName || plan?.meta?.userName?.split?.(" ")?.[0];

  let fromStorage: string | null = null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      fromStorage = obj?.firstName || obj?.name?.split?.(" ")?.[0] || null;
    }
  } catch {}
  return (fromWindow || fromPlan || fromStorage || null) ?? null;
}
function sanitizeForFilename(s: string): string {
  return s.normalize("NFKD").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").trim();
}
function ensureFirstName(): string | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      const obj = JSON.parse(stored);
      if (obj?.firstName) return obj.firstName as string;
    }
  } catch {}
  const input = window.prompt("Optional: enter your first name for the PDF filename", "");
  const name = (input || "").trim();
  if (!name) return null;
  const safe = sanitizeForFilename(name);
  try { localStorage.setItem(USER_KEY, JSON.stringify({ firstName: safe })); } catch {}
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

/* ---------- page ---------- */
type Orientation = "portrait" | "landscape";

export default function HealthPlan() {
  const [plan, setPlan] = React.useState<any>(() => loadPlan());
  const [pref, setPref] = React.useState<Orientation>(() => {
    try {
      const v = localStorage.getItem("glowell:pdfOrientation");
      return v === "landscape" || v === "portrait" ? (v as Orientation) : "portrait";
    } catch { return "portrait"; }
  });
  const [downloadingPortrait, setDownloadingPortrait] = React.useState(false);
  const [downloadingLandscape, setDownloadingLandscape] = React.useState(false);

  // auto-persist plan when it changes
  React.useEffect(() => { savePlan(plan); }, [plan]);

  // persist orientation preference
  React.useEffect(() => { try { localStorage.setItem("glowell:pdfOrientation", pref); } catch {} }, [pref]);

  // handlers
  async function handleDownloadPortrait() {
    if (downloadingPortrait) return;
    setDownloadingPortrait(true);
    try {
      const blob = await exportPlanPDF(plan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = buildFilename("", true, plan);
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setPref("portrait");
    } catch (e) {
      console.error("PDF export (portrait) failed:", e);
      alert("PDF export failed — see Console for details.");
    } finally { setDownloadingPortrait(false); }
  }
  async function handleDownloadLandscape() {
    if (downloadingLandscape) return;
    setDownloadingLandscape(true);
    try {
      const blob = await exportPlanPDFLandscape(plan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = buildFilename("_Landscape", true, plan);
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setPref("landscape");
    } catch (e) {
      console.error("PDF export (landscape) failed:", e);
      alert("PDF export failed — see Console for details.");
    } finally { setDownloadingLandscape(false); }
  }

  const portraitPrimary = pref === "portrait";

  return (
    <div className="p-4 space-y-5">
      {/* Title + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Health Plan</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPortrait}
            disabled={downloadingPortrait}
            className={[
              "px-3 py-2 rounded-lg border transition",
              "border-[#1fb6ae]/30",
              (portraitPrimary
                ? (downloadingPortrait ? "bg-[#1fb6ae]/40 text-white cursor-not-allowed" : "bg-[#1fb6ae] text-white hover:bg-[#18a299]")
                : (downloadingPortrait ? "bg-[#1fb6ae]/20 text-[#1fb6ae] cursor-not-allowed" : "bg-white text-[#1fb6ae] hover:bg-[#e9f7f6]"))
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
              (!portraitPrimary
                ? (downloadingLandscape ? "bg-[#1fb6ae]/40 text-white cursor-not-allowed" : "bg-[#1fb6ae] text-white hover:bg-[#18a299]")
                : (downloadingLandscape ? "bg-[#1fb6ae]/20 text-[#1fb6ae] cursor-not-allowed" : "bg-white text-[#1fb6ae] hover:bg-[#e9f7f6]"))
            ].join(" ")}
            title="Download as PDF (Landscape)"
          >
            {downloadingLandscape ? "Preparing…" : "⬇️ Download (Landscape)"}
          </button>
        </div>
      </div>

      {/* Plan Title input (auto-saves) */}
      <div className="grid gap-2">
        <label className="text-sm text-gray-600">Plan Title (shows in PDF header)</label>
        <input
          value={plan?.meta?.title ?? ""}
          onChange={(e) =>
            setPlan((prev: any) => ({ ...prev, meta: { ...(prev?.meta || {}), title: e.target.value } }))
          }
          onBlur={() => savePlan(plan)}
          placeholder="e.g., 4-Week Wellness Plan"
          className="w-full max-w-xl px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1fb6ae]"
        />
        <p className="text-xs text-gray-500">Tip: This title will appear beneath the logo in your PDF.</p>
      </div>

      <PlanView plan={plan} />
    </div>
  );
}
