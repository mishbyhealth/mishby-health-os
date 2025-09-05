// src/pages/IntakeReview.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const INTAKE_V2_KEY = "glowell:intake.v2";
const DAILY_KEY = "glowell:daily";
const LABS_KEY = "glowell:labs";
const REPORTS_KEY = "glowell:reports";

type AnyRec = Record<string, any>;
type LabRecord = { id: string; dateISO: string; a1c?: number|null; tsh?: number|null; ldl?: number|null };
type ReportItem = { id: string; name: string; size: number; type: string; savedAt: string; dataURL?: string };
type DailyLog = {
  id: string; dateISO: string;
  bpSys?: number|null; bpDia?: number|null;
  glucoseFasting?: number|null; glucosePostMeal?: number|null;
  steps?: number|null; mood?: number|null; stress?: number|null;
  sleepHours?: number|null; sleepQuality?: number|null;
};
type MedRecord = { id: string; name: string; dose: string; freq: string; sinceISO?: string; notes?: string };

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function save<T>(key: string, val: T){ try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function rid(){ return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7); }

export default function IntakeReview(){
  const navigate = useNavigate();
  const [v2, setV2] = useState<AnyRec | null>(null);
  const [daily, setDaily] = useState<DailyLog[]>([]);
  const [labs, setLabs] = useState<LabRecord[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [meds, setMeds] = useState<MedRecord[]>([]);
  const [draft, setDraft] = useState<MedRecord>({ id:"", name:"", dose:"", freq:"", sinceISO:"", notes:"" });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const intake = load<any>(INTAKE_V2_KEY, null);
    setV2(intake);
    setDaily(load<DailyLog[]>(DAILY_KEY, []));
    setLabs(load<LabRecord[]>(LABS_KEY, []));
    setReports(load<ReportItem[]>(REPORTS_KEY, []));
    const existing: MedRecord[] = (intake?.health?.medications || []).map((m: any) => ({
      id: String(m.id || rid()),
      name: String(m.name || ""),
      dose: String(m.dose || ""),
      freq: String(m.freq || ""),
      sinceISO: m.sinceISO || "",
      notes: String(m.notes || "")
    }));
    setMeds(existing);
  }, []);

  function persistMeds(next: MedRecord[]){
    setMeds(next);
    const intake = load<any>(INTAKE_V2_KEY, {}) || {};
    const updated = { ...intake, health: { ...(intake.health || {}), medications: next } };
    save(INTAKE_V2_KEY, updated);
    setV2(updated);
  }

  function addOrUpdateMed(){
    const clean: MedRecord = {
      ...draft,
      id: draft.id || rid(),
      name: (draft.name || "").trim(),
      dose: (draft.dose || "").trim(),
      freq: (draft.freq || "").trim(),
      sinceISO: draft.sinceISO || "",
      notes: (draft.notes || "").trim(),
    };
    if (!clean.name) { alert("Please enter medicine name."); return; }
    const next = editId ? meds.map(m => m.id === editId ? clean : m) : [clean, ...meds];
    persistMeds(next);
    setDraft({ id:"", name:"", dose:"", freq:"", sinceISO:"", notes:"" });
    setEditId(null);
  }

  function editMed(m: MedRecord){ setEditId(m.id); setDraft(m); }
  function deleteMed(id: string){
    if (!confirm("Delete this medicine?")) return;
    persistMeds(meds.filter(m => m.id !== id));
    if (editId === id) { setEditId(null); setDraft({ id:"", name:"", dose:"", freq:"", sinceISO:"", notes:"" }); }
  }

  const profile = v2?.profile || {};
  const schedule = v2?.schedule || {};
  const health = v2?.health || {};
  const today = v2?.today || {};

  const doshaLabel = useMemo(() => {
    const d = profile?.dosha || { kapha:5, pitta:5, vata:5 };
    const arr = [{k:"Kapha",v:d.kapha},{k:"Pitta",v:d.pitta},{k:"Vata",v:d.vata}].sort((a,b)=>b.v-a.v);
    if (arr[0].v === arr[2].v) return "Tridoshic-balanced";
    if (arr[0].v === arr[1].v) return `${arr[0].k}-${arr[1].k}`;
    return arr[0].k;
  }, [profile?.dosha]);

  return (
    <div className="space-y-6">
      <section className="gw-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Confirm your health details</h1>
            <p className="text-sm gw-muted">Review everything at a glance. Edit anything from the Health Form drawers.</p>
          </div>
          <div className="flex gap-2">
            <button className="gw-btn" onClick={()=>navigate("/health-form")}>Open Health Form</button>
            <button className="gw-btn" onClick={()=>navigate("/health-plan")}>Confirm & Open Plan</button>
          </div>
        </div>
      </section>

      {/* Profile */}
      <section className="gw-card">
        <h2 className="font-medium mb-2">Profile</h2>
        <div className="grid gap-3 md:grid-cols-4 text-sm">
          <Info label="Name" value={profile.name || "—"} />
          <Info label="DOB" value={profile.dobISO || "—"} />
          <Info label="Age" value={(profile.age ?? "—")} />
          <Info label="Gender" value={profile.gender || "—"} />
          <Info label="Height (cm)" value={profile.heightCm ?? "—"} />
          <Info label="Weight (kg)" value={profile.weightKg ?? "—"} />
          <Info label="BMI" value={profile.bmi ?? "—"} />
          <Info label="Diet · Cuisine" value={`${profile.dietType || "—"} · ${profile.cuisine || "—"}`} />
          <Info label="Dosha" value={doshaLabel} />
          <Info label="Family history" value={(profile.familyHistory||[]).join(", ") || "—"} />
          <Info label="Allergies" value={(profile.allergies||[]).join(", ") || "—"} />
        </div>
      </section>

      {/* Schedule & Location */}
      <section className="gw-card">
        <h2 className="font-medium mb-2">Schedule & Location</h2>
        <div className="grid gap-3 md:grid-cols-4 text-sm">
          <Info label="Archetype" value={schedule?.archetypeId || "—"} />
          <Info label="Wake" value={schedule?.times?.wake || "—"} />
          <Info label="Leave" value={schedule?.times?.leave || "—"} />
          <Info label="Return" value={schedule?.times?.return || "—"} />
          <Info label="Lunch" value={schedule?.times?.lunch || "—"} />
          <Info label="Dinner" value={schedule?.times?.dinner || "—"} />
          <Info label="Commute (mins)" value={schedule?.times?.commuteMins ?? "—"} />
          <Info label="Region" value={schedule?.region || "—"} />
          <Info label="Pincode" value={schedule?.pincode || "—"} />
          <Info label="Timezone" value={schedule?.timezone || "Asia/Kolkata"} />
        </div>
      </section>

      {/* Health history & context */}
      <section className="gw-card">
        <h2 className="font-medium mb-2">Health history & context</h2>
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <Info label="Chronic (long-term)" value={(health.chronic||[]).join(", ") || "—"} />
          <Info label="Resolved/Past" value={(health.resolved||[]).join(", ") || "—"} />
          <Info label="Habits" value={(health.habits||[]).map((h:string)=>h.replace("_"," ")).join(", ") || "—"} />
          <Info label="Devices" value={(health.devices||[]).map((d:string)=> d==="bp"?"BP monitor":d==="glucose"?"Glucose monitor":"Fitness tracker").join(", ") || "—"} />
          <Info label="Goals" value={(health.goals||[]).map((g:string)=>g.replace("_"," ")).join(", ") || "—"} />
          {profile?.gender==="female" && (
            <Info
              label="Women's tracker"
              value={
                health?.womens
                  ? `${health.womens.periodStartISO || "—"} to ${health.womens.periodEndISO || "—"} · ${health.womens.cycleLengthDays || "—"} days`
                  : "—"
              }
            />
          )}
        </div>
      </section>

      {/* Current symptoms */}
      <section className="gw-card">
        <h2 className="font-medium mb-2">Current symptoms</h2>
        <div className="text-sm">
          <div className="mb-1">
            <span className="gw-muted">Quick chips:</span> {(v2?.today?.chips||[]).join(", ") || "—"}
          </div>
          <div>
            <span className="gw-muted">Notes:</span> {v2?.today?.notes || "—"}
          </div>
        </div>
      </section>

      {/* Medications */}
      <section className="gw-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Current medications (optional)</h2>
          <span className="text-xs gw-muted">Add medicines you’re currently taking (name, dose, frequency).</span>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <L label="Name"><input className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., Metformin" value={draft.name} onChange={(e)=>setDraft(d=>({ ...d, name: e.target.value }))}/></L>
          <L label="Dose"><input className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 500 mg" value={draft.dose} onChange={(e)=>setDraft(d=>({ ...d, dose: e.target.value }))}/></L>
          <L label="Frequency">
            <select className="w-full rounded border px-3 py-2 text-sm" value={draft.freq} onChange={(e)=>setDraft(d=>({ ...d, freq: e.target.value }))}>
              <option value="">Select</option>
              <option value="OD">OD (once daily)</option>
              <option value="BD">BD (twice daily)</option>
              <option value="TDS">TDS (thrice daily)</option>
              <option value="HS">HS (at bedtime)</option>
              <option value="PRN">PRN (as needed)</option>
            </select>
          </L>
          <L label="Since (date)"><input type="date" className="w-full rounded border px-3 py-2 text-sm" value={draft.sinceISO || ""} onChange={(e)=>setDraft(d=>({ ...d, sinceISO: e.target.value }))}/></L>
          <L label="Notes"><input className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., after meals" value={draft.notes || ""} onChange={(e)=>setDraft(d=>({ ...d, notes: e.target.value }))}/></L>
        </div>
        <div className="mt-2 flex gap-2">
          <button className="gw-btn" onClick={addOrUpdateMed}>{editId ? "Update" : "Add"} medicine</button>
          {editId && <button className="gw-btn" onClick={()=>{ setEditId(null); setDraft({ id:"", name:"", dose:"", freq:"", sinceISO:"", notes:"" }); }}>Cancel edit</button>}
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left">
              <th className="border-b py-2 pr-3">Name</th>
              <th className="border-b py-2 pr-3">Dose</th>
              <th className="border-b py-2 pr-3">Frequency</th>
              <th className="border-b py-2 pr-3">Since</th>
              <th className="border-b py-2 pr-3">Notes</th>
              <th className="border-b py-2">Actions</th>
            </tr></thead>
            <tbody>
              {meds.map(m=>(
                <tr key={m.id}>
                  <td className="border-b py-2 pr-3">{m.name}</td>
                  <td className="border-b py-2 pr-3">{m.dose}</td>
                  <td className="border-b py-2 pr-3">{m.freq || "—"}</td>
                  <td className="border-b py-2 pr-3">{m.sinceISO || "—"}</td>
                  <td className="border-b py-2 pr-3">{m.notes || "—"}</td>
                  <td className="border-b py-2">
                    <button className="gw-btn" onClick={()=>{ setEditId(m.id); setDraft(m); }}>Edit</button>
                    <button className="gw-btn ml-2" onClick={()=>deleteMed(m.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!meds.length && <tr><td colSpan={6} className="border-b py-2 gw-muted">No medicines added.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Labs & Reports snapshot */}
      <section className="gw-card">
        <h2 className="font-medium mb-2">Labs & reports (snapshot)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border bg-white p-3">
            <div className="text-sm font-medium mb-2">Recent labs</div>
            <table className="w-full text-sm">
              <thead><tr className="text-left">
                <th className="border-b py-1 pr-2">Date</th>
                <th className="border-b py-1 pr-2">A1c</th>
                <th className="border-b py-1 pr-2">TSH</th>
                <th className="border-b py-1">LDL</th>
              </tr></thead>
              <tbody>
                {labs.slice(0, 6).map(l=>(
                  <tr key={l.id}>
                    <td className="border-b py-1 pr-2">{l.dateISO}</td>
                    <td className="border-b py-1 pr-2">{l.a1c ?? "—"}</td>
                    <td className="border-b py-1 pr-2">{l.tsh ?? "—"}</td>
                    <td className="border-b py-1">{l.ldl ?? "—"}</td>
                  </tr>
                ))}
                {!labs.length && <tr><td colSpan={4} className="border-b py-1 gw-muted">No labs saved.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="rounded border bg-white p-3">
            <div className="text-sm font-medium mb-2">Uploaded reports</div>
            <table className="w-full text-sm">
              <thead><tr className="text-left">
                <th className="border-b py-1 pr-2">Name</th>
                <th className="border-b py-1 pr-2">Size</th>
                <th className="border-b py-1 pr-2">Type</th>
                <th className="border-b py-1">Saved</th>
              </tr></thead>
              <tbody>
                {reports.slice(0, 6).map(r=>(
                  <tr key={r.id}>
                    <td className="border-b py-1 pr-2">{r.name}</td>
                    <td className="border-b py-1 pr-2">{Math.round(r.size/1024)} KB</td>
                    <td className="border-b py-1 pr-2">{r.type || "—"}</td>
                    <td className="border-b py-1">{new Date(r.savedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {!reports.length && <tr><td colSpan={4} className="border-b py-1 gw-muted">No reports uploaded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="gw-card">
        <div className="flex items-center justify-between">
          <div className="text-sm gw-muted">Everything correct? You can always return and edit later.</div>
          <div className="flex gap-2">
            <button className="gw-btn" onClick={()=>navigate("/health-form")}>Edit more</button>
            <button className="gw-btn" onClick={()=>navigate("/health-plan")}>Confirm & Open Plan</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({label, value}:{label:string; value:any}){
  return (
    <div className="rounded border bg-white px-3 py-2">
      <div className="text-xs gw-muted">{label}</div>
      <div className="text-sm">{(value===0 || value) ? String(value) : "—"}</div>
    </div>
  );
}
function L({label, children}:{label:string; children:React.ReactNode}) {
  return (
    <label className="block">
      <div className="text-xs gw-muted mb-1">{label}</div>
      {children}
    </label>
  );
}
