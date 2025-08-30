// File: src/pages/HealthFormV2.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PrettyHealthFormV2 from "@/features-v2/health-plan-advanced/PrettyHealthFormV2";
import PlanViewV2 from "@/pages/PlanViewV2";
import { generateSafePlanV2 } from "../../mho2/engine-v2/safeGenerate";

const LS_INTAKE_KEY = "glowell:intake_v2";
const LS_PLAN_KEY = "glowell:plan_v2";
const LS_HISTORY_KEY = "glowell:plan_history_v2";

function loadJSON<T>(k: string): T | null {
  try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as T) : null; } catch { return null; }
}
function saveJSON(k: string, v: any) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

function makeTitle(date: Date, userTitle?: string) {
  if (userTitle?.trim()) return userTitle.trim();
  const opts: Intl.DateTimeFormatOptions = { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" };
  return "Wellness Plan – " + date.toLocaleString(undefined, opts);
}

export default function HealthFormV2Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const forceForm = /\/health-form(\/|$)/.test(location.pathname) || location.pathname.endsWith("/form");

  const savedIntake = useMemo(() => loadJSON<any>(LS_INTAKE_KEY), []);
  const savedPlan   = useMemo(() => loadJSON<any>(LS_PLAN_KEY), []);

  const [intake, setIntake] = useState<any>(savedIntake);
  const [plan, setPlan] = useState<any>(savedPlan);
  const [issues, setIssues] = useState<{ path: string; message: string }[]>([]);
  const [editing, setEditing] = useState<boolean>(forceForm || !savedPlan);

  useEffect(() => { if (forceForm) setEditing(true); }, [forceForm]);

  function appendHistory(intakeCopy: any, planCopy: any) {
    try {
      const history = (loadJSON<any[]>(LS_HISTORY_KEY) || []);
      const id = Date.now();
      const title = makeTitle(new Date(id), intakeCopy?.meta?.title);
      const planWithTitle = { ...(planCopy || {}), meta: { ...(planCopy?.meta || {}), userTitle: intakeCopy?.meta?.title || "" } };
      history.unshift({ id, title, intake: intakeCopy, plan: planWithTitle, tags: intakeCopy?.meta?.tags || [] });
      saveJSON(LS_HISTORY_KEY, history);
    } catch {}
  }

  function handleSubmit(data: any) {
    setIntake(data); saveJSON(LS_INTAKE_KEY, data);
    const out = generateSafePlanV2(data);
    // ✅ fixed: removed stray comma after {} in spread
    const live = { ...(out.plan || {}), meta: { ...(out.plan?.meta || {}), userTitle: data?.meta?.title || "" } };
    setPlan(live); saveJSON(LS_PLAN_KEY, live);
    setIssues(out.issues || []);
    appendHistory(data, live);
    setEditing(false);
  }

  function handleEdit() { setEditing(true); }
  function handleReset() {
    setIssues([]); setPlan(null); setEditing(true);
    try { localStorage.removeItem(LS_PLAN_KEY); } catch {}
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Wellness Intake — V2</h1>
            <p className="text-sm text-gray-600">Non-clinical intake. A neutral daily plan will be generated here.</p>
          </div>
          {!editing && (
            <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => navigate("/plans-v2/history")}>
              View History
            </button>
          )}
        </header>

        {editing && <PrettyHealthFormV2 initialData={intake || undefined} onSubmit={handleSubmit} />}

        {issues.length > 0 && (
          <div className="mt-4 p-3 border rounded bg-red-50 text-red-700">
            {issues.map((i, idx) => (<div key={idx}>{i.message}</div>))}
          </div>
        )}

        {!editing && plan && (
          <>
            <div className="mb-3 flex gap-3">
              <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={handleEdit}>Edit Answers</button>
              <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={handleReset}>Reset</button>
              <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => { appendHistory(intake, plan); alert("Saved copy to history."); }}>Save Copy to History</button>
            </div>
            <PlanViewV2 plan={plan} />
          </>
        )}
      </div>
    </div>
  );
}
