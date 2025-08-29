// src/pages/HealthPlan.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import PlanView from "./PlanView";
// Use RELATIVE import instead of "@"
import { toast } from "../utils/toast"; 
import { exportPlanPDF } from "../mho/plugins/exporters/pdf"; 

const LS_PLAN = "glowell:plan";
const LS_USER = "glowell:user";
const LS_ORIENTATION = "glowell:pdfOrientation";

type Orientation = "portrait" | "landscape";

type PlanMeta = { title?: string };
type UserInfo = { firstName?: string };
type PlanData = {
  meta?: PlanMeta;
  hydration?: { tips?: string[] };
  movement?: { routines?: string[] };
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
  const [plan, setPlan] = useState<PlanData>(() => readJSON<PlanData>(LS_PLAN, { meta: { title: "" } }));
  const [user, setUser] = useState<UserInfo>(() => readJSON<UserInfo>(LS_USER, {}));
  const [orientation, setOrientation] = useState<Orientation>(() => readJSON<Orientation>(LS_ORIENTATION, "portrait"));

  useEffect(() => { writeJSON(LS_PLAN, plan); }, [plan]);
  useEffect(() => { writeJSON(LS_USER, user); }, [user]);
  useEffect(() => { writeJSON(LS_ORIENTATION, orientation); }, [orientation]);

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

  const handleExport = async (orient: Orientation) => {
    try {
      await ensureFirstName();
      const fileDate = new Date().toISOString().slice(0, 10);
      const suffixName = user.firstName ? `_${user.firstName}` : "";
      const suffixOrient = orient === "landscape" ? `_Landscape` : "";
      const safeTitle = (plan?.meta?.title || "Plan").replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
      const filename = `GloWell_${safeTitle}_${fileDate}${suffixName}${suffixOrient}.pdf`;

      const blob = await exportPlanPDF({ ...plan, meta: { ...(plan.meta || {}), orientation: orient } });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Small confirmation (optional)
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
      // POINT 2: toast after copy
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
      // POINT 3: toast after reset
      toast("Cleared!");
    } catch {
      alert("Could not clear data. Please hard-refresh if needed (Ctrl+Shift+R).");
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content="Neutral daily wellness outline — non-clinical." />
      </Helmet>

      <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Title</label>
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

          <div className="flex items-center gap-2">
            <button onClick={handleCopyShare} className="rounded-xl px-3 py-2 bg-emerald-600 text-white shadow hover:bg-emerald-700">
              Copy share link
            </button>
            <button onClick={handleReset} className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50">
              Reset (Clear Data)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-700 mr-2">PDF Orientation:</span>
          <button
            onClick={() => setOrientation("portrait")}
            className={
              "rounded-full px-3 py-1 border shadow-sm " +
              (orientation === "portrait" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-800 border-gray-200")
            }
          >
            Portrait
          </button>
          <button
            onClick={() => setOrientation("landscape")}
            className={
              "rounded-full px-3 py-1 border shadow-sm " +
              (orientation === "landscape" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-800 border-gray-200")
            }
          >
            Landscape
          </button>

          <div className="ml-auto flex gap-2">
            <button onClick={() => handleExport("portrait")} className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50">
              Download (Portrait)
            </button>
            <button onClick={() => handleExport("landscape")} className="rounded-xl px-3 py-2 bg-white border border-gray-200 shadow hover:bg-gray-50">
              Download (Landscape)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
          <PlanView data={plan} />
        </div>
      </div>
    </>
  );
}
