import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { isOwner, isFullForm, setFullForm, getFullForm } from "@/utils/owner";
import OwnerBar from "@/components/OwnerBar";

import { useDraftAutosave, loadDraft, saveDraft, clearDraft } from "@/utils/drafts";
import { useAccountId } from "@/context/AccountProvider";
import {
  kIntake, kToday, kLabs,
  K_LEGACY_INTAKE, K_LEGACY_TODAY, K_LEGACY_LABS,
  touchAccountUpdatedAt
} from "@/utils/accounts";

// -------------- Storage Keys --------------
const DRAFT_PAGE = "health-form";

// -------------- Types (simplified) --------------
type Sex = "Male" | "Female" | "Other" | "";
type DoshaMix = { vata: number; pitta: number; kapha: number; label?: string; };
type ProfileDrawer = {
  name: string; dob: string; age?: number | ""; sex: Sex;
  heightCm?: number | ""; weightKg?: number | ""; locationState?: string; locationCity?: string;
  timezone?: string; dietType?: "Vegetarian" | "Vegan" | "All-eater" | "Egg-only" | "";
  cuisine?: string; allergies?: string; intolerances?: string; preferences?: string; archetype?: string;
};
type ScheduleDrawer = {
  workDays?: string; workTimes?: string; wakeTime?: string; sleepTime?: string;
  mealAnchors?: { breakfast?: string; lunch?: string; snack?: string; dinner?: string };
  activityWindows?: string;
};
type HealthDrawer = {
  conditions: string[]; currentMeds?: string;
  wellbeing?: { mood?: number; stress?: number; sleepQuality?: number };
  dosha?: DoshaMix; labAnchors?: string;
};
type TodayLog = {
  date: string; symptoms: string[]; notes?: string; steps?: number | "";
  mood?: number | ""; stress?: number | ""; sleepHours?: number | ""; sleepQuality?: number | "";
};
type LabRecord = {
  date: string; a1c?: number | ""; fpg?: number | ""; ppg?: number | "";
  ldl?: number | ""; hdl?: number | ""; tg?: number | ""; tsh?: number | ""; ft4?: number | "";
  creatinine?: number | ""; egfr?: number | ""; vitD?: number | ""; vitB12?: number | "";
};
type IntakeV2 = { profile: ProfileDrawer; schedule: ScheduleDrawer; health: HealthDrawer; };
type FormDraft = { intake?: Partial<IntakeV2>; today?: Partial<TodayLog>; labs?: LabRecord[]; fullForm?: boolean; contextFlags?: string[]; };

// -------------- Constants --------------
const TOP_CONCERNS = ["Headache","Back pain","Knee pain","Acidity","Bloating","Constipation","Cough","Cold","Fatigue","Breathlessness","Palpitations","Poor sleep","Low mood","Stress"];
const CONDITIONS_GRID = ["Hypertension","Diabetes","Thyroid","PCOS/PCOD","GERD/Acidity","Asthma","Allergic rhinitis","Anemia","Chronic pain","Obesity/Overweight","Underweight","Hyperlipidemia","Kidney stone history","Migraine","Depression/Anxiety"];
const CONTEXT_TOGGLES = ["Smoker","Former Smoker","Non-Smoker","Alcohol (rare)","Alcohol (moderate)","Alcohol (frequent)","Sedentary","Active","Heavy labor","Student","Job (Desk)","Job (Field)","Home-maker","Shift work","Travel days","Sleep schedule issues","Fasting/Religious","Vegetarian","Vegan","All-eater","Egg-only","Caffeine high","Caffeine low","Hydration low","Hydration high"];

// -------------- Helpers --------------
function todayISO(): string {
  const d = new Date(); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,"0"); const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function loadJSON<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; } }
function saveJSON<T>(key: string, value: T) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function exists(key: string) { try { return localStorage.getItem(key) != null; } catch { return false; } }
function computeDoshaLabel(d: DoshaMix): string {
  const pairs: Array<[string, number]> = [["Vata", d.vata],["Pitta", d.pitta],["Kapha", d.kapha]];
  pairs.sort((a,b)=>b[1]-a[1]); const [a,b] = pairs;
  return Math.abs(a[1]-b[1]) <= 1 ? `${a[0]}-${b[0]}` : a[0];
}
function normalizeIntake(raw?: Partial<IntakeV2>): IntakeV2 {
  const profile: ProfileDrawer = {
    name: raw?.profile?.name ?? "", dob: raw?.profile?.dob ?? "", age: raw?.profile?.age ?? "",
    sex: (raw?.profile?.sex as Sex) ?? "", heightCm: raw?.profile?.heightCm ?? "", weightKg: raw?.profile?.weightKg ?? "",
    locationState: raw?.profile?.locationState ?? "", locationCity: raw?.profile?.locationCity ?? "",
    timezone: raw?.profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    dietType: (raw?.profile?.dietType as any) ?? "", cuisine: raw?.profile?.cuisine ?? "",
    allergies: raw?.profile?.allergies ?? "", intolerances: raw?.profile?.intolerances ?? "",
    preferences: raw?.profile?.preferences ?? "", archetype: raw?.profile?.archetype ?? "",
  };
  const schedule: ScheduleDrawer = {
    workDays: raw?.schedule?.workDays ?? "", workTimes: raw?.schedule?.workTimes ?? "",
    wakeTime: raw?.schedule?.wakeTime ?? "", sleepTime: raw?.schedule?.sleepTime ?? "",
    mealAnchors: {
      breakfast: raw?.schedule?.mealAnchors?.breakfast ?? "",
      lunch: raw?.schedule?.mealAnchors?.lunch ?? "",
      snack: raw?.schedule?.mealAnchors?.snack ?? "",
      dinner: raw?.schedule?.mealAnchors?.dinner ?? "",
    },
    activityWindows: raw?.schedule?.activityWindows ?? "",
  };
  const d: DoshaMix = { vata: raw?.health?.dosha?.vata ?? 5, pitta: raw?.health?.dosha?.pitta ?? 5, kapha: raw?.health?.dosha?.kapha ?? 5 };
  const health: HealthDrawer = {
    conditions: Array.isArray(raw?.health?.conditions) ? raw!.health!.conditions! : [],
    currentMeds: raw?.health?.currentMeds ?? "",
    wellbeing: {
      mood: raw?.health?.wellbeing?.mood ?? 5,
      stress: raw?.health?.wellbeing?.stress ?? 5,
      sleepQuality: raw?.health?.wellbeing?.sleepQuality ?? 5,
    },
    dosha: { ...d, label: computeDoshaLabel(d) },
    labAnchors: raw?.health?.labAnchors ?? "A1c, FPG/PPG, Lipids, Thyroid, BP@home",
  };
  return { profile, schedule, health };
}
function normalizeToday(raw?: Partial<TodayLog>): TodayLog {
  return { date: raw?.date ?? todayISO(), symptoms: Array.isArray(raw?.symptoms) ? raw!.symptoms : [], notes: raw?.notes ?? "", steps: raw?.steps ?? "", mood: raw?.mood ?? "", stress: raw?.stress ?? "", sleepHours: raw?.sleepHours ?? "", sleepQuality: raw?.sleepQuality ?? "" };
}

// -------------- UI bits --------------
function SectionCard(props: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="gw-card">
      <div className="gw-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3 className="text-lg">{props.title}</h3>
        {props.right}
      </div>
      <div>{props.children}</div>
    </div>
  );
}
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`gw-badge ${active ? "is-active" : ""}`} onClick={onClick} title={label} aria-pressed={active}>
      {label}
    </button>
  );
}
function Row({ children }: { children: React.ReactNode }) { return <div className="gw-row" style={{ gap: "0.75rem" }}>{children}</div>; }
function Col({ children, w = "1" }: { children: React.ReactNode; w?: "1" | "2" | "3" | "4" }) {
  const width = w === "1" ? "100%" : w === "2" ? "calc(50% - 0.375rem)" : w === "3" ? "calc(33.333% - 0.5rem)" : "calc(25% - 0.5625rem)";
  return <div style={{ width, minWidth: "260px" }}>{children}</div>;
}
function LabeledInput(props: { label: string; type?: string; value: any; onChange: (v: any) => void; placeholder?: string; min?: number; max?: number; step?: number; }) {
  return (
    <label className="gw-label">
      <span>{props.label}</span>
      <input className="gw-input" type={props.type ?? "text"} value={props.value ?? ""} onChange={(e)=>props.onChange(props.type==="number"?(e.target.value===""?"":Number(e.target.value)):e.target.value)} placeholder={props.placeholder} min={props.min} max={props.max} step={props.step}/>
    </label>
  );
}
function Slider(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="gw-label">
      <span>{props.label}: <b>{props.value}</b></span>
      <input className="gw-input" type="range" min={1} max={10} step={1} value={props.value} onChange={(e)=>props.onChange(Number(e.target.value))}/>
    </label>
  );
}

// -------------- Main --------------
export default function HealthForm() {
  const navigate = useNavigate();
  const accountId = useAccountId() || "self";

  const owner = useMemo(() => { try { return isOwner(); } catch { return true; } }, []);
  const initialFullForm = useMemo<boolean>(() => { try { return typeof getFullForm === "function" ? !!getFullForm() : !!isFullForm(); } catch { return true; } }, []);
  const [fullForm, setFullFormState] = useState<boolean>(initialFullForm);
  useEffect(()=>{ try { setFullForm(!!fullForm); } catch {} }, [fullForm]);

  // Seed from account keys if present; else fall back to legacy keys and mirror into account
  const readSeed = <T,>(keyAcc: string, keyLegacy: string, normalize: (x:any)=>T, def: T): T => {
    if (exists(keyAcc)) return normalize(loadJSON<any>(keyAcc, def));
    const legacy = loadJSON<any>(keyLegacy, def);
    // seed account store with legacy contents (keep legacy too)
    saveJSON(keyAcc, legacy);
    return normalize(legacy);
  };

  const [intake, setIntake] = useState<IntakeV2>(() => readSeed<IntakeV2>(kIntake(accountId), K_LEGACY_INTAKE, normalizeIntake, normalizeIntake({})));
  const [today, setToday]   = useState<TodayLog>(()   => readSeed<TodayLog>(kToday(accountId),  K_LEGACY_TODAY,  normalizeToday,  normalizeToday({})));
  const [labs, setLabs]     = useState<LabRecord[]>(() => {
    const accKey = kLabs(accountId);
    if (exists(accKey)) return loadJSON<any[]>(accKey, []);
    const legacy = loadJSON<any[]>(K_LEGACY_LABS, []); saveJSON(accKey, legacy); return Array.isArray(legacy)? legacy: [];
  });

  // Dosha label sync
  useEffect(() => {
    const base: DoshaMix = {
      vata: intake.health?.dosha?.vata ?? 5,
      pitta: intake.health?.dosha?.pitta ?? 5,
      kapha: intake.health?.dosha?.kapha ?? 5,
    };
    const label = computeDoshaLabel(base);
    setIntake((prev) => ({
      ...prev,
      health: {
        ...(prev.health || { conditions: [] }),
        currentMeds: prev.health?.currentMeds ?? "",
        wellbeing: prev.health?.wellbeing ?? { mood: 5, stress: 5, sleepQuality: 5 },
        labAnchors: prev.health?.labAnchors ?? "A1c, FPG/PPG, Lipids, Thyroid, BP@home",
        dosha: { ...base, label },
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intake.health?.dosha?.vata, intake.health?.dosha?.pitta, intake.health?.dosha?.kapha]);

  // Dual-write helpers
  const writeBoth = <T,>(keyAcc: string, keyLegacy: string, value: T) => {
    saveJSON(keyAcc, value); saveJSON(keyLegacy, value); touchAccountUpdatedAt(accountId);
  };

  const saveIntake = () => writeBoth(kIntake(accountId), K_LEGACY_INTAKE, intake);
  const saveToday  = () => writeBoth(kToday(accountId),  K_LEGACY_TODAY,  today);
  const saveLabs   = () => writeBoth(kLabs(accountId),   K_LEGACY_LABS,   labs);

  const [contextFlags, setContextFlags] = useState<string[]>([]);
  const toggleContext = (label: string) => setContextFlags((p)=> p.includes(label)? p.filter(x=>x!==label) : [...p, label]);
  const toggleSymptom = (label: string) => setToday((p)=>{ const cur=Array.isArray(p.symptoms)?p.symptoms:[]; return { ...p, symptoms: cur.includes(label)? cur.filter(x=>x!==label) : [...cur, label] }; });
  const toggleCondition = (label: string) => setIntake((p)=> {
    const cur = Array.isArray(p.health?.conditions)? p.health!.conditions! : [];
    const next = cur.includes(label)? cur.filter(x=>x!==label) : [...cur, label];
    return { ...p, health: { ...(p.health || { conditions: [] }), conditions: next, currentMeds: p.health?.currentMeds ?? "",
      wellbeing: p.health?.wellbeing ?? { mood: 5, stress: 5, sleepQuality: 5 },
      dosha: p.health?.dosha ?? { vata:5, pitta:5, kapha:5, label:"Pitta-Vata" }, labAnchors: p.health?.labAnchors ?? "A1c, FPG/PPG, Lipids, Thyroid, BP@home" } };
  });

  const blankLab: LabRecord = { date: todayISO(), a1c:"", fpg:"", ppg:"", ldl:"", hdl:"", tg:"", tsh:"", ft4:"", creatinine:"", egfr:"", vitD:"", vitB12:"" };
  const addLab = () => setLabs((prev)=>[...prev, { ...blankLab }]);

  const handleFullOn = () => setFullFormState(true);
  const handleFullOff = () => setFullFormState(false);
  const openPlan = () => navigate("/health-plan");

  // ----- Drafts (per account + mode) -----
  const applyDraft = (draft: FormDraft | null | undefined) => {
    if (!draft) return;
    if (draft.intake) setIntake((p)=> normalizeIntake({ ...p, ...draft.intake }));
    if (draft.today)  setToday((p)=> normalizeToday({ ...p, ...draft.today }));
    if (draft.labs && Array.isArray(draft.labs)) setLabs(draft.labs);
    if (typeof draft.fullForm === "boolean") setFullFormState(draft.fullForm);
    if (Array.isArray(draft.contextFlags)) setContextFlags(draft.contextFlags);
  };

  useEffect(() => {
    const d = loadDraft<FormDraft>(DRAFT_PAGE, null as any);
    applyDraft(d);
    const onMode = () => applyDraft(loadDraft<FormDraft>(DRAFT_PAGE, null as any));
    const onAcc  = () => applyDraft(loadDraft<FormDraft>(DRAFT_PAGE, null as any));
    window.addEventListener("glowell:modechange", onMode as EventListener);
    window.addEventListener("glowell:accountchange", onAcc as EventListener);
    return () => {
      window.removeEventListener("glowell:modechange", onMode as EventListener);
      window.removeEventListener("glowell:accountchange", onAcc as EventListener);
    };
  }, []);

  useDraftAutosave(React, DRAFT_PAGE, useMemo(()=>({ intake, today, labs, fullForm, contextFlags }), [intake,today,labs,fullForm,contextFlags]), 600);
  const saveDraftNow = () => saveDraft(DRAFT_PAGE, { intake, today, labs, fullForm, contextFlags });
  const clearDraftNow = () => clearDraft(DRAFT_PAGE);

  // -------------- UI Render --------------
  const conditions = intake.health?.conditions ?? [];
  const symptoms = today.symptoms ?? [];

  return (
    <div className="py-2">
      <div className="gw-tint mx-auto" style={{ maxWidth: 980 }}>
        <div className="gw-row" style={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 className="text-xl">Health Intake</h2>
          <div className="text-xs gw-badge">Account: {accountId}</div>
          <div>
            <button className="gw-btn" onClick={saveIntake} title="Save Intake">Save</button>
            <button className="gw-btn" onClick={openPlan} style={{ marginLeft: "0.5rem" }}>Generate Plan</button>
            <button className="gw-btn" onClick={saveDraftNow} style={{ marginLeft: "0.5rem" }} title="Save Draft (mode/account aware)">Save Draft</button>
            <button className="gw-btn" onClick={clearDraftNow} style={{ marginLeft: "0.5rem" }} title="Discard Draft (this mode/account)">Discard Draft</button>
          </div>
        </div>

        {owner && (
          <div style={{ marginTop: "0.5rem" }}>
            <OwnerBar
              owner={owner}
              fullForm={fullForm}
              onFullOn={handleFullOn}
              onFullOff={handleFullOff}
              onJumpProfile={() => document.getElementById("section-profile")?.scrollIntoView({ behavior: "smooth" })}
              onJumpSchedule={() => document.getElementById("section-schedule")?.scrollIntoView({ behavior: "smooth" })}
              onJumpHealth={() => document.getElementById("section-health")?.scrollIntoView({ behavior: "smooth" })}
            />
          </div>
        )}

        {/* TODAY */}
        <SectionCard title="Today (Quick Log)">
          <Row>
            <Col w="2"><LabeledInput label="Date" type="date" value={today.date} onChange={(v)=>setToday((p)=>({ ...p, date: v }))} /></Col>
            <Col w="2"><LabeledInput label="Steps" type="number" value={today.steps ?? ""} onChange={(v)=>setToday((p)=>({ ...p, steps: v }))} min={0} /></Col>
          </Row>
          <Row>
            <Col w="2"><LabeledInput label="Notes" value={today.notes ?? ""} onChange={(v)=>setToday((p)=>({ ...p, notes: v }))} placeholder="Short note for today…" /></Col>
            <Col w="2">
              <Row>
                <Col><LabeledInput label="Sleep (hours)" type="number" value={today.sleepHours ?? ""} onChange={(v)=>setToday((p)=>({ ...p, sleepHours: v }))} min={0} step={0.5}/></Col>
                <Col><LabeledInput label="Sleep Quality (1–10)" type="number" value={today.sleepQuality ?? ""} onChange={(v)=>setToday((p)=>({ ...p, sleepQuality: v }))} min={1} max={10}/></Col>
              </Row>
            </Col>
          </Row>
          <div style={{ marginTop: "0.5rem" }}>
            <div className="gw-label"><span>Symptoms (tap to toggle)</span></div>
            <div className="gw-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              {TOP_CONCERNS.map((c)=> <Chip key={c} label={c} active={symptoms.includes(c)} onClick={()=>toggleSymptom(c)}/>)}
            </div>
          </div>
          <Row>
            <Col w="2"><LabeledInput label="Mood (1–10)" type="number" value={today.mood ?? ""} onChange={(v)=>setToday((p)=>({ ...p, mood: v }))} min={1} max={10}/></Col>
            <Col w="2"><LabeledInput label="Stress (1–10)" type="number" value={today.stress ?? ""} onChange={(v)=>setToday((p)=>({ ...p, stress: v }))} min={1} max={10}/></Col>
          </Row>
          <div style={{ marginTop: "0.5rem" }}>
            <button className="gw-btn" onClick={saveToday}>Save Today</button>
          </div>
        </SectionCard>

        {/* LABS */}
        <SectionCard title="Periodic Labs" right={<button className="gw-btn" onClick={addLab}>+ Add</button>}>
          {labs.length === 0 && (<div className="gw-tint" style={{ padding: "0.75rem", borderRadius: "0.5rem" }}>No lab records yet. Click “+ Add”.</div>)}
          {labs.map((r, idx)=>(
            <div key={idx} className="gw-card" style={{ marginBottom: "0.75rem" }}>
              <Row>
                <Col><LabeledInput label="Date" type="date" value={r.date} onChange={(v)=>setLabs((prev)=>{const copy=[...prev]; copy[idx]={...copy[idx], date:v}; return copy;})}/></Col>
                <Col><LabeledInput label="HbA1c (%)" type="number" value={r.a1c ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], a1c:v}; return c;})} step={0.1}/></Col>
                <Col><LabeledInput label="FPG (mg/dL)" type="number" value={r.fpg ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], fpg:v}; return c;})}/></Col>
                <Col><LabeledInput label="PPG (mg/dL)" type="number" value={r.ppg ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], ppg:v}; return c;})}/></Col>
              </Row>
              <Row>
                <Col><LabeledInput label="LDL" type="number" value={r.ldl ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], ldl:v}; return c;})}/></Col>
                <Col><LabeledInput label="HDL" type="number" value={r.hdl ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], hdl:v}; return c;})}/></Col>
                <Col><LabeledInput label="Triglycerides" type="number" value={r.tg ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], tg:v}; return c;})}/></Col>
                <Col><LabeledInput label="Creatinine" type="number" value={r.creatinine ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], creatinine:v}; return c;})} step={0.1}/></Col>
              </Row>
              <Row>
                <Col><LabeledInput label="eGFR" type="number" value={r.egfr ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], egfr:v}; return c;})}/></Col>
                <Col><LabeledInput label="TSH" type="number" value={r.tsh ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], tsh:v}; return c;})} step={0.01}/></Col>
                <Col><LabeledInput label="FT4" type="number" value={r.ft4 ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], ft4:v}; return c;})} step={0.01}/></Col>
                <Col><LabeledInput label="Vitamin D" type="number" value={r.vitD ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], vitD:v}; return c;})}/></Col>
              </Row>
              <Row>
                <Col><LabeledInput label="Vitamin B12" type="number" value={r.vitB12 ?? ""} onChange={(v)=>setLabs((p)=>{const c=[...p]; c[idx]={...c[idx], vitB12:v}; return c;})}/></Col>
              </Row>
            </div>
          ))}
          <div><button className="gw-btn" onClick={saveLabs}>Save Labs</button></div>
        </SectionCard>

        {/* ADVANCED (Full Form) */}
        {fullForm && (
          <>
            <SectionCard title="Profile" right={<span className="gw-badge">Owner View</span>}>
              <div id="section-profile" />
              <Row>
                <Col w="2"><LabeledInput label="Name" value={intake.profile.name} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, name:v } }))}/></Col>
                <Col w="2"><LabeledInput label="DOB" type="date" value={intake.profile.dob} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, dob:v } }))}/></Col>
              </Row>
              <Row>
                <Col><LabeledInput label="Age" type="number" value={intake.profile.age ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, age:v } }))} min={0} max={120}/></Col>
                <Col><LabeledInput label="Sex" value={intake.profile.sex} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, sex: v as Sex } }))} placeholder="Male / Female / Other"/></Col>
                <Col><LabeledInput label="Height (cm)" type="number" value={intake.profile.heightCm ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, heightCm:v } }))} min={0} step={0.5}/></Col>
                <Col><LabeledInput label="Weight (kg)" type="number" value={intake.profile.weightKg ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, weightKg:v } }))} min={0} step={0.1}/></Col>
              </Row>
              <Row>
                <Col><LabeledInput label="State" value={intake.profile.locationState ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, locationState:v } }))}/></Col>
                <Col><LabeledInput label="City" value={intake.profile.locationCity ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, locationCity:v } }))}/></Col>
                <Col><LabeledInput label="Timezone" value={intake.profile.timezone ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, timezone:v } }))}/></Col>
              </Row>
              <Row>
                <Col><LabeledInput label="Diet Type" value={intake.profile.dietType ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, dietType:v } }))} placeholder="Vegetarian / Vegan / All-eater / Egg-only"/></Col>
                <Col><LabeledInput label="Cuisine" value={intake.profile.cuisine ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, cuisine:v } }))} placeholder="e.g., Gujarati, South Indian…"/></Col>
              </Row>
              <Row>
                <Col><LabeledInput label="Allergies" value={intake.profile.allergies ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, allergies:v } }))}/></Col>
                <Col><LabeledInput label="Intolerances" value={intake.profile.intolerances ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, intolerances:v } }))}/></Col>
                <Col><LabeledInput label="Preferences" value={intake.profile.preferences ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, preferences:v } }))}/></Col>
                <Col><LabeledInput label="Archetype" value={intake.profile.archetype ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, profile:{ ...p.profile, archetype:v } }))} placeholder="Student / Desk / Field / Shift / Homemaker…"/></Col>
              </Row>
              <div style={{ marginTop: "0.5rem" }}><button className="gw-btn" onClick={saveIntake}>Save Profile</button></div>
            </SectionCard>

            <SectionCard title="Schedule" right={<span className="gw-badge">Owner View</span>}>
              <div id="section-schedule" />
              <Row>
                <Col><LabeledInput label="Work Days" value={intake.schedule.workDays ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, workDays:v } }))} placeholder="e.g., Mon–Fri"/></Col>
                <Col><LabeledInput label="Work Times" value={intake.schedule.workTimes ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, workTimes:v } }))} placeholder="e.g., 10:00–18:00"/></Col>
              </Row>
              <Row>
                <Col><LabeledInput label="Wake Time" type="time" value={intake.schedule.wakeTime ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, wakeTime:v } }))}/></Col>
                <Col><LabeledInput label="Sleep Time" type="time" value={intake.schedule.sleepTime ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, sleepTime:v } }))}/></Col>
              </Row>
              <SectionCard title="Meal Anchors">
                <Row>
                  <Col><LabeledInput label="Breakfast" type="time" value={intake.schedule.mealAnchors?.breakfast ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, mealAnchors:{ ...p.schedule.mealAnchors, breakfast:v } } }))}/></Col>
                  <Col><LabeledInput label="Lunch" type="time" value={intake.schedule.mealAnchors?.lunch ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, mealAnchors:{ ...p.schedule.mealAnchors, lunch:v } } }))}/></Col>
                  <Col><LabeledInput label="Snack" type="time" value={intake.schedule.mealAnchors?.snack ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, mealAnchors:{ ...p.schedule.mealAnchors, snack:v } } }))}/></Col>
                  <Col><LabeledInput label="Dinner" type="time" value={intake.schedule.mealAnchors?.dinner ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, mealAnchors:{ ...p.schedule.mealAnchors, dinner:v } } }))}/></Col>
                </Row>
              </SectionCard>
              <Row>
                <Col w="2"><LabeledInput label="Activity Windows" value={intake.schedule.activityWindows ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, schedule:{ ...p.schedule, activityWindows:v } }))} placeholder="e.g., 07:00–07:20, 17:30–18:00"/></Col>
              </Row>
              <div style={{ marginTop: "0.5rem" }}><button className="gw-btn" onClick={saveIntake}>Save Schedule</button></div>
            </SectionCard>

            <SectionCard title="Health (Conditions, Wellbeing, Dosha)" right={<span className="gw-badge">Owner View</span>}>
              <div id="section-health" />
              <div className="gw-label"><span>Conditions (non-diagnostic tags)</span></div>
              <div className="gw-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                {CONDITIONS_GRID.map((c)=> <Chip key={c} label={c} active={conditions.includes(c)} onClick={()=>toggleCondition(c)}/>)}
              </div>

              <div style={{ marginTop: "0.75rem" }} />
              <div className="gw-label"><span>Context (lifestyle & risks)</span></div>
              <div className="gw-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                {CONTEXT_TOGGLES.map((c)=> <Chip key={c} label={c} active={contextFlags.includes(c)} onClick={()=>toggleContext(c)}/>)}
              </div>

              <Row>
                <Col w="2"><LabeledInput label="Current Meds / Doses (optional)" value={intake.health?.currentMeds ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, health:{ ...(p.health||{conditions:[]}), currentMeds:v } }))} placeholder="e.g., Metformin 500mg OD"/></Col>
              </Row>

              <SectionCard title="Wellbeing (1–10)">
                <Row>
                  <Col><LabeledInput label="Mood" type="number" value={intake.health?.wellbeing?.mood ?? 5} onChange={(v)=>setIntake((p)=>({ ...p, health:{ ...(p.health||{conditions:[]}), wellbeing:{ ...(p.health?.wellbeing||{}), mood:v } } }))} min={1} max={10}/></Col>
                  <Col><LabeledInput label="Stress" type="number" value={intake.health?.wellbeing?.stress ?? 5} onChange={(v)=>setIntake((p)=>({ ...p, health:{ ...(p.health||{conditions:[]}), wellbeing:{ ...(p.health?.wellbeing||{}), stress:v } } }))} min={1} max={10}/></Col>
                  <Col><LabeledInput label="Sleep Quality" type="number" value={intake.health?.wellbeing?.sleepQuality ?? 5} onChange={(v)=>setIntake((p)=>({ ...p, health:{ ...(p.health||{conditions:[]}), wellbeing:{ ...(p.health?.wellbeing||{}), sleepQuality:v } } }))} min={1} max={10}/></Col>
                </Row>
              </SectionCard>

              <SectionCard title={`Ayurveda Dosha Profile ${intake.health?.dosha?.label ? `— ${intake.health.dosha.label}` : ""}`}>
                <Row>
                  <Col><Slider label="Vata"  value={intake.health?.dosha?.vata ?? 5}  onChange={(v)=>setIntake((p)=>({ ...p, health:{ ...(p.health||{conditions:[]}), dosha:{ ...(p.health?.dosha||{ pitta:5, kapha:5, vata:5 }), vata:v } } }))}/></Col>
                  <Col><Slider label="Pitta" value={intake.health?.dosha?.pitta ?? 5} onChange={(v)=>setIntake((p)=>({ ...p, health:{ ...(p.health||{conditions:[]}), dosha:{ ...(p.health?.dosha||{ vata:5, kapha:5, pitta:5 }), pitta:v } } }))}/></Col>
                  <Col><Slider label="Kapha" value={intake.health?.dosha?.kapha ?? 5} onChange={(v)=>setIntake((p)=>({ ...p, health:{ ...(p.health||{conditions:[]}), dosha:{ ...(p.health?.dosha||{ vata:5, pitta:5, kapha:5 }), kapha:v } } }))}/></Col>
                </Row>
              </SectionCard>

              <Row>
                <Col w="2"><LabeledInput label="Lab Anchors You Track" value={intake.health?.labAnchors ?? ""} onChange={(v)=>setIntake((p)=>({ ...p, health:{ ...(p.health||{conditions:[]}), labAnchors:v } }))} placeholder="e.g., A1c, FPG/PPG, Lipids, Thyroid, BP@home"/></Col>
              </Row>

              <div style={{ marginTop: "0.5rem" }}><button className="gw-btn" onClick={saveIntake}>Save Health</button></div>
            </SectionCard>
          </>
        )}

        <div className="gw-row" style={{ justifyContent: "flex-end", marginTop: "0.75rem", gap: "0.5rem" }}>
          <button className="gw-btn" onClick={saveIntake}>Save Intake</button>
          <button className="gw-btn" onClick={saveToday}>Save Today</button>
          <button className="gw-btn" onClick={saveLabs}>Save Labs</button>
          <button className="gw-btn" onClick={openPlan}>Go to Plan</button>
        </div>
      </div>
    </div>
  );
}
