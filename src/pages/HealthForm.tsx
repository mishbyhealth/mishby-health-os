// src/pages/HealthForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import Drawer from "../components/Drawer";
import { ARCHETYPES, getArchetype, type ArchetypeId, type ArchetypeTimes } from "../utils/archetypes";
import { inferDosha, labelFromScores, type DoshaScores, clamp as clamp10 } from "../utils/dosha";
import {
  ensureLocationsLoaded,
  searchStates,
  searchCities,
  searchCitiesAsync,
  type LocationsResult,
  type LocationRecord,
} from "../utils/locations";
import { useNavigate } from "react-router-dom";

/** ===== Storage Keys (V2, but keeps V1 compatibility) ===== */
const INTAKE_V2_KEY = "glowell:intake.v2";        // { profile, schedule, health, today }
const INTAKE_V1_KEY = "glowell:intake";           // legacy flat intake (written for compatibility)
const DAILY_KEY     = "glowell:daily";            // Daily logs (unchanged)
const LABS_KEY      = "glowell:labs";             // Labs (unchanged)
const REPORTS_KEY   = "glowell:reports";          // Reports (unchanged)
const SUB_KEY       = "glowell:subscription";     // Subscription tier (for retention)

/** ===== Types ===== */
type Gender = "male" | "female" | "other" | "";
type DietType = "vegetarian" | "vegan" | "eggetarian" | "non_vegetarian" | "all_eater";
type Cuisine =
  | "Gujarati" | "Punjabi" | "South Indian" | "Bengali" | "Rajasthani" | "North Indian" | "International Veg" | "Other";

type Profile = {
  name?: string;
  dobISO?: string | "";
  age?: number | null;
  gender?: Gender;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  dietType?: DietType;
  cuisine?: Cuisine | "";
  familyHistory?: string[];  // Diabetes, Heart disease, Thyroid, etc.
  allergies?: string[];      // e.g., peanuts, lactose
  dosha?: DoshaScores;       // sliders 1..10 each
};

type Schedule = {
  archetypeId: ArchetypeId;
  times: ArchetypeTimes;
  // Location
  state?: string; city?: string; district?: string; pincode?: string; region?: string; timezone?: string;
};

type HealthHistory = {
  chronic?: string[];         // long-term
  resolved?: string[];        // past/resolved
  habits?: string[];          // lifestyle habits
  devices?: string[];         // ["bp","glucose","tracker"]
  goals?: string[];           // ["weight_loss","muscle_gain","sleep","stress","mobility"]
  womens?: { periodStartISO?: string | ""; periodEndISO?: string | ""; cycleLengthDays?: number | null } | null;
};

type SymptomsToday = {
  chips?: string[];           // quick symptoms today/this week
  notes?: string;
};

type DailyLog = {
  id: string; dateISO: string;
  bpSys?: number | null; bpDia?: number | null;
  glucoseFasting?: number | null; glucosePostMeal?: number | null;
  steps?: number | null;
  mood?: number | null; stress?: number | null; sleepHours?: number | null; sleepQuality?: number | null;
};

type LabRecord = { id: string; dateISO: string; a1c?: number | null; tsh?: number | null; ldl?: number | null; };
type ReportItem = { id: string; name: string; size: number; type: string; savedAt: string; dataURL?: string; };
type Subscription = { tier?: "free" | "silver" | "gold" | "platinum" };

type IntakeV2 = {
  profile: Profile;
  schedule: Schedule;
  health: HealthHistory;
  today: SymptomsToday;
};

function safeGet(key: string){ try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key: string, val: any){ try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function load<T>(key: string, fallback: T): T { const raw = safeGet(key); try { return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function save<T>(key: string, val: T){ safeSet(key, val); }

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function ymd(d: Date){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const da=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${da}`; }
function ageFromDOB(dobISO?: string | ""): number | null {
  if (!dobISO) return null;
  const dob = new Date(dobISO + "T00:00:00");
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return (age >= 0 && age <= 120) ? age : null;
}
function bmiFromHW(h?: number | null, w?: number | null): number | null {
  const H = Number(h || 0), W = Number(w || 0); if (!H || !W) return null; const m = H / 100;
  const v = W / (m * m); return Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
}
function retentionDaysForTier(tier?: Subscription["tier"]): number | null {
  switch (tier) { case "free": return 90; case "silver": return 365; case "gold": return 365*3; case "platinum": return null; default: return 90; }
}

/** ===== HealthForm Component ===== */
export default function HealthForm(){
  const navigate = useNavigate();

  // Location loader
  const [loc, setLoc] = useState<LocationsResult | null>(null);
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cityPickList, setCityPickList] = useState<LocationRecord[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Drawers visibility
  const [openProfile, setOpenProfile] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openHealth, setOpenHealth] = useState(false);

  // V2 intake
  const [v2, setV2] = useState<IntakeV2>({
    profile: { dietType: "vegetarian", cuisine: "Gujarati", heightCm: null, weightKg: null, gender: "", age: null, dobISO: "" },
    schedule: { archetypeId: "student_regular", times: getArchetype("student_regular").defaults, timezone: "Asia/Kolkata" },
    health: { chronic: [], resolved: [], habits: [], devices: [], goals: [], womens: null },
    today: { chips: [], notes: "" },
  });

  // Daily/labs/reports/subscription
  const [daily, setDaily] = useState<DailyLog[]>([]);
  const [log, setLog] = useState<DailyLog>({ id: "", dateISO: ymd(new Date()) });
  const [labs, setLabs] = useState<LabRecord[]>([]);
  const [labDraft, setLabDraft] = useState<LabRecord>({ id: "", dateISO: ymd(new Date()) });
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [sub, setSub] = useState<Subscription>({});

  const bmi = useMemo(()=> bmiFromHW(v2.profile.heightCm, v2.profile.weightKg), [v2.profile.heightCm, v2.profile.weightKg]);
  const doshaLabel = useMemo(()=> labelFromScores(v2.profile.dosha || { kapha:5, pitta:5, vata:5 }), [v2.profile.dosha]);

  // Init
  useEffect(() => {
    (async () => {
      setSub(load<Subscription>(SUB_KEY, {}));
      setV2(load<IntakeV2>(INTAKE_V2_KEY, v2));
      setDaily(load<DailyLog[]>(DAILY_KEY, []));
      setLabs(load<LabRecord[]>(LABS_KEY, []));
      setReports(load<ReportItem[]>(REPORTS_KEY, []));
      setLog((l) => ({ ...l, id: "log-" + Date.now().toString(36).toUpperCase() }));
      setLabDraft((l) => ({ ...l, id: "lab-" + Date.now().toString(36).toUpperCase() }));
      const locs = await ensureLocationsLoaded();
      setLoc(locs);

      // If schedule has state prefilled, prime city pick list
      const st = (load<IntakeV2>(INTAKE_V2_KEY, v2)).schedule?.state;
      if (locs?.index && st) {
        setStateQuery(st);
        setLoadingCities(true);
        const list = await searchCitiesAsync(locs.index, st, "");
        setCityPickList(list);
        setCityQuery((load<IntakeV2>(INTAKE_V2_KEY, v2)).schedule?.city || "");
        setLoadingCities(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist helper (writes V2 + legacy V1 for compatibility)
  function persist(next: IntakeV2) {
    // derive BMI/age
    const age = next.profile.age ?? ageFromDOB(next.profile.dobISO || "") ?? null;
    const profileWithDerived: Profile = { ...next.profile, age, bmi: bmiFromHW(next.profile.heightCm, next.profile.weightKg) };
    const merged: IntakeV2 = { ...next, profile: profileWithDerived };
    save(INTAKE_V2_KEY, merged);
    setV2(merged);
    // Legacy V1 (minimal fields used by HealthPlan v8)
    const legacy = {
      age: profileWithDerived.age, dobISO: profileWithDerived.dobISO, gender: profileWithDerived.gender,
      heightCm: profileWithDerived.heightCm, weightKg: profileWithDerived.weightKg,
      dietType: profileWithDerived.dietType, timezone: next.schedule.timezone || "Asia/Kolkata",
      state: next.schedule.state, city: next.schedule.city, district: next.schedule.district, pincode: next.schedule.pincode, region: next.schedule.region,
      // conditions & notes
      conditions: (next.health.chronic || []),
      healthNotes: (v2.today.notes || ""),
    };
    save(INTAKE_V1_KEY, legacy);
  }

  // === Profile drawer ===
  function updateProfile<K extends keyof Profile>(k: K, v: Profile[K]) {
    persist({ ...v2, profile: { ...v2.profile, [k]: v } });
  }

  // === Schedule drawer ===
  function updateSchedule<K extends keyof Schedule>(k: K, v: Schedule[K]) {
    persist({ ...v2, schedule: { ...v2.schedule, [k]: v } });
  }
  async function chooseState(nextState: string){
    if (!loc) return;
    setStateQuery(nextState);
    updateSchedule("state", nextState);
    setLoadingCities(true);
    const cities = await searchCitiesAsync(loc.index, nextState, "");
    setCityPickList(cities);
    const first = cities[0];
    updateSchedule("city", first?.city || "");
    updateSchedule("district", first?.district || "");
    updateSchedule("pincode", first?.pincode || "");
    updateSchedule("region", first?.city && nextState ? `${first.city}, ${nextState}` : nextState);
    updateSchedule("timezone", "Asia/Kolkata");
    setCityQuery(first?.city || "");
    setLoadingCities(false);
  }
  async function typeCity(v: string){
    setCityQuery(v);
    if (!loc || !v2.schedule.state) return;
    setLoadingCities(true);
    const list = await searchCitiesAsync(loc.index, v2.schedule.state, v);
    setCityPickList(list);
    setLoadingCities(false);
  }
  function chooseCity(rec: LocationRecord){
    updateSchedule("city", rec.city || "");
    updateSchedule("district", rec.district || "");
    updateSchedule("pincode", rec.pincode || "");
    updateSchedule("region", (rec.city || rec.district) && v2.schedule.state ? `${rec.city || rec.district}, ${v2.schedule.state}` : rec.city || rec.district || "");
    updateSchedule("timezone", "Asia/Kolkata");
    setCityQuery(rec.city || "");
  }
  async function useDeviceLocation(){
    try {
      if (!navigator.geolocation) { alert("Device location not available."); return; }
      const coords = await new Promise<GeolocationPositionCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: false, timeout: 10000 }
        );
      });
      const lat = coords.latitude, lon = coords.longitude;
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!res.ok) throw new Error("Reverse geocode failed");
      const j = await res.json();
      const addr = j?.address || {};
      const state = addr.state || addr.state_district || "";
      const district = addr.district || addr.county || addr.state_district || "";
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.hamlet || "";
      const pincode = addr.postcode || "";
      if (!state) { alert("Could not detect state from GPS. Please select manually."); return; }
      await chooseState(state);
      if (city) {
        const list = await searchCitiesAsync(loc!.index, state, city);
        if (list.length) chooseCity(list[0]);
        else {
          updateSchedule("city", city); updateSchedule("district", district); updateSchedule("pincode", pincode);
          updateSchedule("region", city && state ? `${city}, ${state}` : state); setCityQuery(city);
        }
      }
      alert("Location filled from device.");
    } catch (e:any) {
      alert(`Device location error: ${e?.message || e}`);
    }
  }

  // === Health drawer ===
  function toggleFromArray(list: string[] | undefined, value: string): string[] {
    const set = new Set(list || []);
    if (set.has(value)) set.delete(value); else set.add(value);
    return Array.from(set);
  }
  function updateHealth(partial: Partial<HealthHistory>) {
    persist({ ...v2, health: { ...v2.health, ...partial } });
  }

  // === Today (quick) ===
  const ageVal = v2.profile.age ?? ageFromDOB(v2.profile.dobISO || "") ?? null;
  const isMinor = (ageVal ?? 0) < 18;
  const cond = new Set(v2.health.chronic || []);
  const showBP = !isMinor || cond.has("Hypertension") || cond.has("Pregnancy");
  const showGlucose = cond.has("Diabetes") || cond.has("Prediabetes") || (ageVal ?? 0) >= 35;
  const showThyroid = cond.has("Thyroid");
  const showWomens = v2.profile.gender === "female" && (ageVal ?? 0) >= 10 && (ageVal ?? 0) <= 50;

  function saveTodayLog(){
    const entry: DailyLog = {
      ...log,
      id: "log-" + Date.now().toString(36).toUpperCase(),
      dateISO: log.dateISO || ymd(new Date()),
      bpSys: showBP ? (log.bpSys ?? null) : null,
      bpDia: showBP ? (log.bpDia ?? null) : null,
      glucoseFasting: showGlucose ? (log.glucoseFasting ?? null) : null,
      glucosePostMeal: showGlucose ? (log.glucosePostMeal ?? null) : null,
      steps: log.steps ?? null,
      mood: log.mood ?? null,
      stress: log.stress ?? null,
      sleepHours: log.sleepHours ?? null,
      sleepQuality: log.sleepQuality ?? null,
    };
    const next = [entry, ...daily];
    const days = retentionDaysForTier(sub.tier);
    let pruned = next;
    if (days !== null) {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      pruned = next.filter((d) => new Date(d.dateISO + "T00:00:00") >= cutoff);
    }
    setDaily(pruned); save(DAILY_KEY, pruned);
    alert(`Today's log saved!${days === null ? " (lifetime retention)" : ` (kept for ${days} days)`}`);
  }

  function saveLab(){
    const entry: LabRecord = {
      ...labDraft,
      id: "lab-" + Date.now().toString(36).toUpperCase(),
      dateISO: labDraft.dateISO || ymd(new Date()),
      a1c: labDraft.a1c ?? null,
      tsh: showThyroid ? (labDraft.tsh ?? null) : null,
      ldl: labDraft.ldl ?? null,
    };
    const next = [entry, ...labs];
    setLabs(next); save(LABS_KEY, next);
    alert("Lab record saved!");
  }

  async function onUploadReports(e: React.ChangeEvent<HTMLInputElement>){
    const files = e.target.files; if (!files || !files.length) return;
    const arr = Array.from(files);
    const additions: ReportItem[] = [];
    for (const f of arr) {
      const base: ReportItem = {
        id: "rep-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2,6),
        name: f.name, size: f.size, type: f.type, savedAt: new Date().toISOString(),
      };
      if (f.size <= 1_000_000) {
        try {
          const dataURL: string = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(String(reader.result));
            reader.onerror = () => rej(new Error("read error"));
            reader.readAsDataURL(f);
          });
          additions.push({ ...base, dataURL });
        } catch { additions.push(base); }
      } else { additions.push(base); }
    }
    const next = [...additions, ...reports];
    setReports(next); save(REPORTS_KEY, next);
    e.currentTarget.value = "";
  }

  // === Review & Save ===
  function onSaveOnly(){
    persist(v2);
    alert("Saved!");
  }
  function onSaveAndOpenPlan(){
    persist(v2);
    navigate("/health-plan");
  }

  // === Render ===
  return (
    <div className="space-y-6">
      {/* Top summary + quick open drawers */}
      <section className="gw-card">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Health Intake</h1>
            <p className="text-sm gw-muted">Invisible parts: Profile, Schedule, Health — edit via drawers. “Today” is always here for quick update.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="gw-btn" onClick={()=>setOpenProfile(true)}>Edit Profile</button>
            <button className="gw-btn" onClick={()=>setOpenSchedule(true)}>Edit Schedule</button>
            <button className="gw-btn" onClick={()=>setOpenHealth(true)}>Edit Health</button>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded border px-3 py-2 bg-white">
            <div className="text-xs gw-muted">Diet • Cuisine</div>
            <div className="text-sm">{(v2.profile.dietType || "—")} · {(v2.profile.cuisine || "—")}</div>
          </div>
          <div className="rounded border px-3 py-2 bg-white">
            <div className="text-xs gw-muted">Archetype</div>
            <div className="text-sm">{getArchetype(v2.schedule.archetypeId).label}</div>
          </div>
          <div className="rounded border px-3 py-2 bg-white">
            <div className="text-xs gw-muted">Dosha</div>
            <div className="text-sm">{doshaLabel}</div>
          </div>
          <div className="rounded border px-3 py-2 bg-white">
            <div className="text-xs gw-muted">BMI</div>
            <div className="text-sm">{v2.profile.bmi ?? bmi ?? "—"}</div>
          </div>
        </div>
      </section>

      {/* TODAY — Symptoms + Daily + Labs + Reports */}
      <section className="gw-card">
        <h2 className="font-medium mb-3">Today</h2>

        {/* Symptoms quick chips */}
        <div className="mb-2">
          <div className="text-xs gw-muted mb-1">Symptoms (tap to toggle)</div>
          <div className="flex flex-wrap gap-2">
            {["Back pain","Knee pain","Headache","Migraine","Acidity","Bloating","Constipation","Cough","Cold","Fatigue","Breathlessness","Palpitations","Swelling legs","Poor sleep","Stress","Low mood"].map((c) => {
              const active = (v2.today.chips || []).includes(c);
              return (
                <button type="button" key={c}
                  className={`px-3 py-1 rounded border text-sm ${active ? "bg-white gw-link-active" : "bg-white hover:bg-gray-50"}`}
                  onClick={() => {
                    const chips = toggleFromArray(v2.today.chips, c);
                    persist({ ...v2, today: { ...v2.today, chips } });
                  }}>
                  {c}
                </button>
              );
            })}
          </div>
          <textarea className="mt-2 w-full rounded border px-3 py-2 text-sm" rows={2}
            placeholder="Anything else today…" value={v2.today.notes || ""}
            onChange={(e)=>persist({ ...v2, today: { ...v2.today, notes: e.target.value } })}/>
        </div>

        {/* Daily inputs */}
        <div className="grid gap-3 md:grid-cols-6">
          <label className="block">
            <div className="text-xs gw-muted mb-1">Date</div>
            <input type="date" className="w-full rounded border px-3 py-2 text-sm"
              value={log.dateISO} onChange={(e)=>setLog(l=>({ ...l, dateISO: e.target.value }))}/>
          </label>

          {showBP && <>
            <label className="block">
              <div className="text-xs gw-muted mb-1">BP (Systolic)</div>
              <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 120"
                value={log.bpSys ?? ""} onChange={(e)=>setLog(l=>({ ...l, bpSys: e.target.value ? Number(e.target.value) : null }))}/>
            </label>
            <label className="block">
              <div className="text-xs gw-muted mb-1">BP (Diastolic)</div>
              <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 80"
                value={log.bpDia ?? ""} onChange={(e)=>setLog(l=>({ ...l, bpDia: e.target.value ? Number(e.target.value) : null }))}/>
            </label>
          </>}

          {showGlucose && <>
            <label className="block">
              <div className="text-xs gw-muted mb-1">Glucose — Fasting</div>
              <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 95"
                value={log.glucoseFasting ?? ""} onChange={(e)=>setLog(l=>({ ...l, glucoseFasting: e.target.value ? Number(e.target.value) : null }))}/>
            </label>
            <label className="block">
              <div className="text-xs gw-muted mb-1">Glucose — Post-meal</div>
              <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 140"
                value={log.glucosePostMeal ?? ""} onChange={(e)=>setLog(l=>({ ...l, glucosePostMeal: e.target.value ? Number(e.target.value) : null }))}/>
            </label>
          </>}

          <label className="block">
            <div className="text-xs gw-muted mb-1">Steps</div>
            <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 6000"
              value={log.steps ?? ""} onChange={(e)=>setLog(l=>({ ...l, steps: e.target.value ? Number(e.target.value) : null }))}/>
          </label>
        </div>

        {/* Wellbeing */}
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <label className="block">
            <div className="text-xs gw-muted mb-1">Mood</div>
            <select className="w-full rounded border px-3 py-2 text-sm"
              value={log.mood ?? ""} onChange={(e)=>setLog(l=>({ ...l, mood: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">—</option><option value={1}>Very low</option><option value={2}>Low</option><option value={3}>Neutral</option><option value={4}>Good</option><option value={5}>Very good</option>
            </select>
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Stress</div>
            <select className="w-full rounded border px-3 py-2 text-sm"
              value={log.stress ?? ""} onChange={(e)=>setLog(l=>({ ...l, stress: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">—</option><option value={1}>Very low</option><option value={2}>Low</option><option value={3}>Moderate</option><option value={4}>High</option><option value={5}>Very high</option>
            </select>
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Sleep (hours)</div>
            <input type="number" step="0.25" min="0" max="24" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 6.5"
              value={log.sleepHours ?? ""} onChange={(e)=>setLog(l=>({ ...l, sleepHours: e.target.value ? Number(e.target.value) : null }))}/>
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Sleep quality</div>
            <select className="w-full rounded border px-3 py-2 text-sm"
              value={log.sleepQuality ?? ""} onChange={(e)=>setLog(l=>({ ...l, sleepQuality: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">—</option><option value={1}>Poor</option><option value={2}>Fair</option><option value={3}>Okay</option><option value={4}>Good</option><option value={5}>Excellent</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="gw-btn" onClick={saveTodayLog}>Save Today’s Log</button>
        </div>

        {/* Recent logs table */}
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left">
              <th className="border-b py-2 pr-3">Date</th>
              {showBP && <th className="border-b py-2 pr-3">BP</th>}
              {showGlucose && <th className="border-b py-2 pr-3">Glucose F/PP</th>}
              <th className="border-b py-2 pr-3">Steps</th>
              <th className="border-b py-2 pr-3">Mood/Stress</th>
              <th className="border-b py-2">Sleep (h/Q)</th>
            </tr></thead>
            <tbody>
              {daily.slice(0, 15).map((d) => (
                <tr key={d.id}>
                  <td className="border-b py-2 pr-3">{d.dateISO}</td>
                  {showBP && <td className="border-b py-2 pr-3">{d.bpSys ?? "—"} / {d.bpDia ?? "—"}</td>}
                  {showGlucose && <td className="border-b py-2 pr-3">{d.glucoseFasting ?? "—"} / {d.glucosePostMeal ?? "—"}</td>}
                  <td className="border-b py-2 pr-3">{d.steps ?? "—"}</td>
                  <td className="border-b py-2 pr-3">{d.mood ?? "—"} / {d.stress ?? "—"}</td>
                  <td className="border-b py-2">{d.sleepHours ?? "—"} / {d.sleepQuality ?? "—"}</td>
                </tr>
              ))}
              {!daily.length && <tr><td colSpan={6} className="border-b py-2 gw-muted">No logs yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Labs */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">Periodic labs</h3>
          <div className="grid gap-3 md:grid-cols-5">
            <label className="block">
              <div className="text-xs gw-muted mb-1">Date</div>
              <input type="date" className="w-full rounded border px-3 py-2 text-sm"
                value={labDraft.dateISO} onChange={(e)=>setLabDraft(l=>({ ...l, dateISO: e.target.value }))}/>
            </label>
            <label className="block">
              <div className="text-xs gw-muted mb-1">HbA1c (%)</div>
              <input type="number" step="0.1" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 6.2"
                value={labDraft.a1c ?? ""} onChange={(e)=>setLabDraft(l=>({ ...l, a1c: e.target.value ? Number(e.target.value) : null }))}/>
            </label>
            {showThyroid && (
              <label className="block">
                <div className="text-xs gw-muted mb-1">TSH (uIU/mL)</div>
                <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 2.5"
                  value={labDraft.tsh ?? ""} onChange={(e)=>setLabDraft(l=>({ ...l, tsh: e.target.value ? Number(e.target.value) : null }))}/>
              </label>
            )}
            <label className="block">
              <div className="text-xs gw-muted mb-1">LDL (mg/dL)</div>
              <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 110"
                value={labDraft.ldl ?? ""} onChange={(e)=>setLabDraft(l=>({ ...l, ldl: e.target.value ? Number(e.target.value) : null }))}/>
            </label>
          </div>
          <div className="mt-3">
            <button type="button" className="gw-btn" onClick={saveLab}>Save Lab</button>
          </div>
          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left">
                <th className="border-b py-2 pr-3">Date</th>
                <th className="border-b py-2 pr-3">HbA1c</th>
                {showThyroid && <th className="border-b py-2 pr-3">TSH</th>}
                <th className="border-b py-2">LDL</th>
              </tr></thead>
              <tbody>
                {labs.slice(0, 10).map((l) => (
                  <tr key={l.id}>
                    <td className="border-b py-2 pr-3">{l.dateISO}</td>
                    <td className="border-b py-2 pr-3">{l.a1c ?? "—"}</td>
                    {showThyroid && <td className="border-b py-2 pr-3">{l.tsh ?? "—"}</td>}
                    <td className="border-b py-2">{l.ldl ?? "—"}</td>
                  </tr>
                ))}
                {!labs.length && <tr><td colSpan={4} className="border-b py-2 gw-muted">No labs saved.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reports */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">Upload medical reports (PDF/images)</h3>
          <input type="file" multiple accept="application/pdf,image/*" onChange={onUploadReports}/>
          <p className="mt-2 text-xs gw-muted">≤1MB preview inline; larger files saved as metadata only.</p>
          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left">
                <th className="border-b py-2 pr-3">Name</th>
                <th className="border-b py-2 pr-3">Size</th>
                <th className="border-b py-2 pr-3">Type</th>
                <th className="border-b py-2 pr-3">Saved</th>
                <th className="border-b py-2">Actions</th>
              </tr></thead>
              <tbody>
                {reports.map(r=>(
                  <tr key={r.id}>
                    <td className="border-b py-2 pr-3">{r.name}</td>
                    <td className="border-b py-2 pr-3">{Math.round(r.size/1024)} KB</td>
                    <td className="border-b py-2 pr-3">{r.type || "—"}</td>
                    <td className="border-b py-2 pr-3">{new Date(r.savedAt).toLocaleString()}</td>
                    <td className="border-b py-2">
                      {r.dataURL ? <a className="gw-link" href={r.dataURL} target="_blank" rel="noreferrer">Open</a>
                                  : <span className="text-xs gw-muted">Preview unavailable</span>}
                      <button type="button" className="ml-2 gw-btn" onClick={()=>{
                        const next = reports.filter(x=>x.id!==r.id); setReports(next); save(REPORTS_KEY, next);
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!reports.length && <tr><td colSpan={5} className="border-b py-2 gw-muted">No reports uploaded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* REVIEW & ACTIONS */}
      <section className="gw-card">
        <h2 className="font-medium mb-2">Review</h2>
        <ul className="text-sm list-disc pl-5 gw-muted">
          <li>Diet Family: <span className="gw-link-active">{v2.profile.dietType || "—"}</span> · Cuisine: <span className="gw-link-active">{v2.profile.cuisine || "—"}</span></li>
          <li>Archetype: <span className="gw-link-active">{getArchetype(v2.schedule.archetypeId).label}</span></li>
          <li>Dosha: <span className="gw-link-active">{doshaLabel}</span></li>
          <li>Chronic: {(v2.health.chronic||[]).join(", ") || "—"} · Habits: {(v2.health.habits||[]).join(", ") || "—"} · Goals: {(v2.health.goals||[]).join(", ") || "—"}</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="gw-btn" onClick={onSaveOnly}>Save</button>
          <button className="gw-btn" onClick={onSaveAndOpenPlan}>Save & Open Health Plan</button>
        </div>
      </section>

      {/* PROFILE DRAWER */}
      <Drawer open={openProfile} onClose={()=>setOpenProfile(false)} title="Profile (one-time)">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="text-xs gw-muted mb-1">Name</div>
            <input className="w-full rounded border px-3 py-2 text-sm" value={v2.profile.name || ""} onChange={(e)=>updateProfile("name", e.target.value)} />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">DOB</div>
            <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={v2.profile.dobISO || ""} onChange={(e)=>updateProfile("dobISO", e.target.value)} />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Age (years)</div>
            <input type="number" min={1} max={120} className="w-full rounded border px-3 py-2 text-sm"
              value={v2.profile.age ?? ""} onChange={(e)=>updateProfile("age", e.target.value ? clamp(Number(e.target.value),1,120) : null)} />
          </label>

          <label className="block">
            <div className="text-xs gw-muted mb-1">Gender</div>
            <select className="w-full rounded border px-3 py-2 text-sm" value={v2.profile.gender || ""} onChange={(e)=>updateProfile("gender", e.target.value as Gender)}>
              <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Height (cm)</div>
            <input type="number" min={50} max={250} className="w-full rounded border px-3 py-2 text-sm"
              value={v2.profile.heightCm ?? ""} onChange={(e)=>updateProfile("heightCm", e.target.value ? clamp(Number(e.target.value),50,250) : null)} />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Weight (kg)</div>
            <input type="number" min={20} max={300} className="w-full rounded border px-3 py-2 text-sm"
              value={v2.profile.weightKg ?? ""} onChange={(e)=>updateProfile("weightKg", e.target.value ? clamp(Number(e.target.value),20,300) : null)} />
          </label>

          <label className="block">
            <div className="text-xs gw-muted mb-1">Diet type</div>
            <select className="w-full rounded border px-3 py-2 text-sm" value={v2.profile.dietType || "vegetarian"} onChange={(e)=>updateProfile("dietType", e.target.value as DietType)}>
              <option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="eggetarian">Eggetarian</option><option value="non_vegetarian">Non-vegetarian</option><option value="all_eater">All eater</option>
            </select>
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Preferred cuisine</div>
            <select className="w-full rounded border px-3 py-2 text-sm" value={v2.profile.cuisine || ""} onChange={(e)=>updateProfile("cuisine", e.target.value as Cuisine)}>
              <option value="">Select</option>
              {["Gujarati","Punjabi","South Indian","Bengali","Rajasthani","North Indian","International Veg","Other"].map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          {/* Dosha sliders */}
          <div className="md:col-span-3 mt-2">
            <div className="text-sm font-medium mb-2">Ayurveda Dosha Profile</div>
            <div className="grid gap-3 md:grid-cols-3">
              {(["kapha","pitta","vata"] as Array<keyof DoshaScores>).map((k)=>(
                <label key={k} className="block">
                  <div className="text-xs gw-muted mb-1">{k[0].toUpperCase()+k.slice(1)} (1–10)</div>
                  <input type="range" min={1} max={10}
                    value={(v2.profile.dosha?.[k] ?? 5)}
                    onChange={(e)=>{
                      const val = clamp10(Number(e.target.value));
                      updateProfile("dosha", { ...(v2.profile.dosha||{kapha:5,pitta:5,vata:5}), [k]: val });
                    }} />
                  <div className="text-xs">{v2.profile.dosha?.[k] ?? 5}</div>
                </label>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button className="gw-btn" type="button" onClick={()=>{
                const inferred = inferDosha({
                  concerns: v2.today.chips,
                  conditions: v2.health.chronic,
                  habits: v2.health.habits,
                  wellbeing: { stress: log.stress, sleepHours: log.sleepHours, sleepQuality: log.sleepQuality }
                });
                updateProfile("dosha", inferred);
              }}>Auto-infer from your signals</button>
              <span className="text-sm gw-muted">Current label: <strong>{doshaLabel}</strong></span>
            </div>
          </div>

          {/* Family history / allergies */}
          <div className="md:col-span-3 mt-3">
            <div className="text-xs gw-muted mb-1">Family history (toggle)</div>
            <div className="flex flex-wrap gap-2">
              {["Diabetes","Heart disease","Thyroid"].map(h=>(
                <button key={h} type="button"
                  className={`px-3 py-1 rounded border text-sm ${(v2.profile.familyHistory||[]).includes(h) ? "bg-white gw-link-active":"bg-white hover:bg-gray-50"}`}
                  onClick={()=> updateProfile("familyHistory", toggleFromArray(v2.profile.familyHistory,h))}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* SCHEDULE DRAWER */}
      <Drawer open={openSchedule} onClose={()=>setOpenSchedule(false)} title="Schedule & Location">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block md:col-span-2">
            <div className="text-xs gw-muted mb-1">Archetype</div>
            <select className="w-full rounded border px-3 py-2 text-sm"
              value={v2.schedule.archetypeId}
              onChange={(e)=>{
                const id = e.target.value as ArchetypeId;
                updateSchedule("archetypeId", id);
                updateSchedule("times", getArchetype(id).defaults);
              }}>
              {ARCHETYPES.map(a=> <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </label>

          {["wake","leave","return","lunch","dinner"].map((key)=>(
            <label key={key} className="block">
              <div className="text-xs gw-muted mb-1">{key[0].toUpperCase()+key.slice(1)} time</div>
              <input type="time" className="w-full rounded border px-3 py-2 text-sm"
                value={(v2.schedule.times as any)[key] || ""}
                onChange={(e)=>{
                  const t = { ...v2.schedule.times, [key]: e.target.value } as ArchetypeTimes;
                  updateSchedule("times", t);
                }}/>
            </label>
          ))}
          <label className="block">
            <div className="text-xs gw-muted mb-1">Commute (mins/day)</div>
            <input type="number" min={0} max={240} className="w-full rounded border px-3 py-2 text-sm"
              value={v2.schedule.times.commuteMins ?? 0}
              onChange={(e)=> updateSchedule("times", { ...v2.schedule.times, commuteMins: e.target.value ? Number(e.target.value) : 0 }) }/>
          </label>

          {/* Location picker */}
          <div className="md:col-span-2 mt-2">
            <div className="text-sm font-medium mb-1">Location</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-xs gw-muted mb-1">State (type to search)</div>
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Type state name…"
                  value={stateQuery} onChange={(e)=>setStateQuery(e.target.value)}
                  onBlur={()=>{
                    if (!loc) return;
                    const exact = searchStates(loc.index, stateQuery).find((s)=> s.toLowerCase() === stateQuery.toLowerCase());
                    if (exact) chooseState(exact);
                  }}/>
                {loc && stateQuery && (
                  <div className="mt-1 max-h-40 overflow-auto rounded border bg-white text-sm">
                    {searchStates(loc.index, stateQuery).slice(0,20).map((s)=>(
                      <button type="button" key={s} className="block w-full text-left px-3 py-1 hover:bg-gray-50" onMouseDown={()=>chooseState(s)}>{s}</button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs gw-muted mb-1">City/Town/Village</div>
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder={v2.schedule.state ? "Type name or pincode…" : "Select state first"} disabled={!v2.schedule.state}
                  value={cityQuery} onChange={(e)=>typeCity(e.target.value)} />
                {v2.schedule.state && (
                  <div className="mt-1 max-h-48 overflow-auto rounded border bg-white text-sm">
                    {loadingCities && <div className="px-3 py-2 gw-muted">Loading {v2.schedule.state}…</div>}
                    {!loadingCities && cityQuery && (cityPickList.length ? searchCities(loc!.index, v2.schedule.state!, cityQuery) : []).slice(0,30).map((r)=>(
                      <button type="button" key={`${r.state}-${r.city}-${r.pincode}-${r.district}`} className="block w-full text-left px-3 py-1 hover:bg-gray-50" onMouseDown={()=>chooseCity(r)}>
                        {(r.city || r.district || "—")}, {r.state} {r.pincode ? `• ${r.pincode}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded border px-3 py-2 text-sm bg-white">
                <div className="text-xs gw-muted">Timezone</div>
                <div>{v2.schedule.timezone || "Asia/Kolkata"}</div>
              </div>
            </div>

            <div className="mt-2">
              <button className="gw-btn" type="button" onClick={useDeviceLocation}>Use Device Location</button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* HEALTH DRAWER */}
      <Drawer open={openHealth} onClose={()=>setOpenHealth(false)} title="Medical history & context">
        <div className="grid gap-4">
          {/* Chronic */}
          <div>
            <div className="text-sm font-medium">Chronic (long-term)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Hypertension","Diabetes","Prediabetes","Thyroid","Dyslipidemia","Obesity","Asthma","COPD","GERD/Acidity","IBS","Fatty liver","Back pain","Osteoarthritis","Migraine","Depression","Anxiety","PCOS/PCOD","Pregnancy"].map(c => {
                const active = (v2.health.chronic || []).includes(c);
                return (
                  <button key={c} type="button"
                    className={`px-3 py-1 rounded border text-sm ${active ? "bg-white gw-link-active" : "bg-white hover:bg-gray-50"}`}
                    onClick={() => updateHealth({ chronic: toggleFromArray(v2.health.chronic, c) })}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habits / Devices / Goals */}
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium">Habits</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Sedentary","Night_shifts","Outside_food","Low_protein","Late_caffeine"].map(h=>{
                  const label = h.replace("_"," ");
                  const active = (v2.health.habits || []).includes(h);
                  return (
                    <button key={h} type="button"
                      className={`px-3 py-1 rounded border text-sm ${active ? "bg-white gw-link-active" : "bg-white hover:bg-gray-50"}`}
                      onClick={()=> updateHealth({ habits: toggleFromArray(v2.health.habits, h) })}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Devices</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["bp","glucose","tracker"].map(d=>{
                  const label = d === "bp" ? "BP monitor" : d === "glucose" ? "Glucose monitor" : "Fitness tracker";
                  const active = (v2.health.devices || []).includes(d);
                  return (
                    <button key={d} type="button"
                      className={`px-3 py-1 rounded border text-sm ${active ? "bg-white gw-link-active" : "bg-white hover:bg-gray-50"}`}
                      onClick={()=> updateHealth({ devices: toggleFromArray(v2.health.devices, d) })}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Goals</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["weight_loss","muscle_gain","sleep","stress","mobility"].map(g=>{
                  const label = g.replace("_"," ");
                  const active = (v2.health.goals || []).includes(g);
                  return (
                    <button key={g} type="button"
                      className={`px-3 py-1 rounded border text-sm ${active ? "bg-white gw-link-active" : "bg-white hover:bg-gray-50"}`}
                      onClick={()=> updateHealth({ goals: toggleFromArray(v2.health.goals, g) })}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Women’s tracker */}
          {showWomens && (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block">
                <div className="text-xs gw-muted mb-1">Period start date</div>
                <input type="date" className="w-full rounded border px-3 py-2 text-sm"
                  value={v2.health.womens?.periodStartISO || ""} onChange={(e)=>updateHealth({ womens: { ...(v2.health.womens||{}), periodStartISO: e.target.value } })}/>
              </label>
              <label className="block">
                <div className="text-xs gw-muted mb-1">Period end date</div>
                <input type="date" className="w-full rounded border px-3 py-2 text-sm"
                  value={v2.health.womens?.periodEndISO || ""} onChange={(e)=>updateHealth({ womens: { ...(v2.health.womens||{}), periodEndISO: e.target.value } })}/>
              </label>
              <label className="block">
                <div className="text-xs gw-muted mb-1">Cycle length (days)</div>
                <input type="number" min={15} max={60} className="w-full rounded border px-3 py-2 text-sm"
                  value={v2.health.womens?.cycleLengthDays ?? ""} onChange={(e)=>updateHealth({ womens: { ...(v2.health.womens||{}), cycleLengthDays: e.target.value ? Number(e.target.value) : null } })}/>
              </label>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
