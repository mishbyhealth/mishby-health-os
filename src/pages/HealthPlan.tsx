// src/pages/HealthPlan.tsx — clean layout per v7 blueprint
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import PlanView from "./PlanView";
import { toast } from "../utils/toast";
import { exportPlanPDF } from "../../mho/plugins/exporters/pdf";

const LS_PLAN = "glowell:plan";
const LS_USER = "glowell:user";
const LS_ORIENTATION = "glowell:pdfOrientation";

type Orientation = "portrait" | "landscape";
type PlanMeta = { title?: string };
type UserInfo = { firstName?: string };
type PlanData = {
  meta?: PlanMeta;
  hydration?: { tips?: string[]; notes?: string[]; target?: string };
  movement?: { routines?: string[]; notes?: string[] };
  meals?: Array<{ label: string; ideas?: string[]; avoid?: string[] }>;
  mind?: { practices?: string[] };
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}
function random6(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function HealthPlan() {
  const [plan, setPlan] = useState<PlanData>(() =>
    readJSON<PlanData>(LS_PLAN, { meta: { title: "" } })
  );
  const [user, setUser] = useState<UserInfo>(() => readJSON<UserInfo>(LS_USER, {}));
  const [orientation, setOrientation] = useState<Orientation>(() =>
    readJSON<Orientation>(LS_ORIENTATION, "portrait")
  );
  const [showHelp, setShowHelp] = useState(false);

  // hidden file input for Import JSON
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    writeJSON(LS_PLAN, plan);
  }, [plan]);
  useEffect(() => {
    writeJSON(LS_USER, user);
  }, [user]);
  useEffect(() => {
    writeJSON(LS_ORIENTATION, orientation);
  }, [orientation]);

  const planTitle = plan?.meta?.title?.trim() || "";
  const pageTitle = useMemo(() => `GloWell — ${planTitle || "Health Plan"}`, [planTitle]);

  const setPlanTitle = (title: string) => {
    setPlan((p) => ({ ...p, meta: { ...(p.meta || {}), title } }));
  };

  const ensureFirstName = async () => {
    if (!user.firstName || !user.firstName.trim()) {
      const name = window.prompt("Your first name (for PDF filename & subtitle)?") || "";
      const clean = name.trim();
      if (clean) setUser({ firstName: clean });
    }
  };

  const handleExportPDF = async (orient: Orientation) => {
    try {
      await ensureFirstName();
      const fileDate = new Date().toISOString().slice(0, 10);
      const suffixName = user.firstName ? `_${user.firstName}` : "";
      const suffixOrient = orient === "landscape" ? `_Landscape` : "";
      const safeTitle = (plan?.meta?.title || "Plan")
        .replace(/[^\w\- ]+/g, "")
        .replace(/\s+/g, "_");
      const filename = `GloWell_${safeTitle}_${fileDate}${suffixName}${suffixOrient}.pdf`;

      const blob = await exportPlanPDF({
        ...plan,
        meta: { ...(plan.meta || {}), orientation: orient },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast("PDF ready to download");
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF. See console for details.");
    }
  };

  const handleCopyShare = async () => {
    const v = random6();
    const link = `https://mishbyhealth.com/health-plan?v=${v}`;
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied!");
    } catch {
      alert("Unable to copy link. Please copy manually:\n" + link);
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(LS_PLAN);
      localStorage.removeItem(LS_USER);
      localStorage.removeItem(LS_ORIENTATION);
      setPlan({ meta: { title: "" } });
      setUser({});
      setOrientation("portrait");
      toast("Cleared!");
    } catch {
      alert("Could not clear data. Please hard-refresh if needed (Ctrl+Shift+R).");
    }
  };

  // Load a ready sample plan
  const handleLoadSample = () => {
    const sample: PlanData = {
      meta: { title: "4-Week Wellness Plan" },
      hydration: {
        tips: [
          "Start day with 1 glass warm water",
          "6–8 glasses through the day",
          "Add electrolytes post-walk (optional)",
        ],
        target: "2–2.5 L / day",
      },
      movement: {
        routines: [
          "Morning: 15–25 min brisk walk",
          "Evening: 5–10 min gentle stretches",
          "2× week: light bodyweight (optional)",
        ],
      },
      meals: [
        {
          label: "Balanced Plate",
          ideas: ["Veg + whole grains + protein"],
          avoid: ["Sugary drinks", "Ultra-processed snacks"],
        },
      ],
      mind: { practices: ["2–3 min deep breathing", "5 min gratitude journaling (optional)"] },
    };
    setPlan(sample);
    toast("Loaded sample plan");
  };

  // Export JSON of current plan
  const handleExportJSON = () => {
    try {
      const pretty = JSON.stringify(plan, null, 2);
      const blob = new Blob([pretty], { type: "application/json" });
      const date = new Date().toISOString().slice(0, 10);
      const file = (plan?.meta?.title?.trim() || "GloWell_Plan").replace(/\s+/g, "_");
      const filename = `${file}_${date}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast("Plan exported (JSON)");
    } catch (e) {
      console.error(e);
      alert("Could not export JSON.");
    }
  };

  // Import JSON into current plan
  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };
  const onImportFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as PlanData;
      setPlan(data);
      toast("Plan imported");
    } catch (err) {
      console.error(err);
      alert("Invalid JSON file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content="Neutral daily wellness outline — non-clinical."
        />
      </Helmet>

      <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
        {/* Header / Title + Actions (fixed layout) */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          {/* Left: Plan Title (fixed width so it doesn't squash) */}
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Title
            </label>
            <input
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="e.g., Morning Balance Plan"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Title appears in browser tab &amp; PDF filename (not printed inside the PDF by design).
            </p>
          </div>

          {/* Right: Buttons cluster (wraps nicely on smaller widths) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50"
              title="Help & Deploy Guide"
            >
              Help
            </button>
            <button
              onClick={handleCopyShare}
              className="rounded-xl px-3 py-2 bg-emerald-600 text-white shadow hover:bg-emerald-700"
            >
              Copy share link
            </button>
            <button
              onClick={handleLoadSample}
              className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50"
            >
              Load sample plan
            </button>
            <button
              onClick={handleImportJSON}
              className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50"
              title="Import plan from JSON"
            >
              Import JSON
            </button>
            <button
              onClick={handleExportJSON}
              className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50"
              title="Export current plan as JSON"
            >
              Export JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onImportFileChange}
            />
            <button
              onClick={handleReset}
              className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50"
            >
              Reset (Clear Data)
            </button>
          </div>
        </div>

        {/* Orientation toggle + export */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-700 mr-2">PDF Orientation:</span>
          <button
            onClick={() => setOrientation("portrait")}
            className={
              "rounded-full px-3 py-1 border shadow-sm " +
              (orientation === "portrait"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-800 border-gray-200")
            }
          >
            Portrait
          </button>
          <button
            onClick={() => setOrientation("landscape")}
            className={
              "rounded-full px-3 py-1 border shadow-sm " +
              (orientation === "landscape"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-800 border-gray-200")
            }
          >
            Landscape
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExportPDF("portrait")}
              className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50"
            >
              Download (Portrait)
            </button>
            <button
              onClick={() => handleExportPDF("landscape")}
              className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50"
            >
              Download (Landscape)
            </button>
          </div>
        </div>

        {/* Plan view */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
          <PlanView data={plan} />
        </div>
      </div>

      {/* HELP PANEL */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Help &amp; Deploy Guide</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg px-2 py-1 border border-gray-200 hover:bg-gray-50"
                aria-label="Close help"
              >
                ✕
              </button>
            </div>

            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
              <li>
                <span className="font-medium">Deploy (Netlify):</span> Netlify → <em>Deploys</em> →{" "}
                <strong>Trigger deploy</strong> → <strong>Deploy project without cache</strong>.
              </li>
              <li>
                <span className="font-medium">Test fresh build:</span> Incognito + add <code>?v=123456</code> to the URL.
              </li>
              <li>
                <span className="font-medium">Share link:</span> Use <em>Copy share link</em>.
              </li>
              <li>
                <span className="font-medium">Reset data:</span> Use <em>Reset (Clear Data)</em>.
              </li>
              <li>
                <span className="font-medium">PDF export:</span> Choose orientation → Download. PDF matches on-screen design.
              </li>
            </ol>

            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-700">
              See <code>docs/README_DEPLOY.md</code> and <code>docs/PASTE_MAP.md</code> in your repo.
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-xl px-3 py-2 bg-emerald-600 text-white shadow hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
