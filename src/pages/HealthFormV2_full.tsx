import React from "react";
import { useAccountId } from "@/context/AccountProvider";
import { loadDraft, saveDraft, useAutosave } from "@/utils/formPersistence";
import { kIntake, K_LEGACY_INTAKE, getIndex } from "@/utils/accounts";

// DEV-ONLY: keep inputs editable (disables any accidental “lock”/overlay)
function useDevUnlock() {
  React.useEffect(() => {
    // 1) kill maintenance lock
    try {
      localStorage.setItem("glowell:lock", "false");
      document.documentElement.removeAttribute("data-maintenance");
      (document.body as any).style.pointerEvents = "auto";
    } catch {}

    // 2) inject CSS to allow interaction through any tint/mask
    const style = document.createElement("style");
    style.setAttribute("data-dev-unlocker", "true");
    style.textContent = `
      [data-maintenance="true"] { pointer-events: auto !important; }
      .wizard-tint, .maintenance-mask, .gw-wizard-mask, .overlay, .veil, .mask, .backdrop {
        pointer-events: none !important;
      }
      .wizard-tint input, .wizard-tint textarea, .wizard-tint select, .wizard-tint button {
        pointer-events: auto !important;
      }
      fieldset[disabled] * { pointer-events: auto !important; }
    `;
    document.head.appendChild(style);

    // 3) repeatedly enable form controls
    const unlock = () => {
      try {
        const all = document.querySelectorAll<HTMLElement>(
          "input, textarea, select, button, fieldset, form"
        );
        all.forEach((el) => {
          const tag = el.tagName.toLowerCase();
          if (tag === "fieldset") (el as HTMLFieldSetElement).disabled = false;
          (el as any).disabled = false;
          (el as any).readOnly = false;
          el.removeAttribute("disabled");
          el.removeAttribute("readonly");
          el.removeAttribute("inert");
          el.removeAttribute("aria-disabled");
          el.style.pointerEvents = "auto";
          el.style.opacity = "";
          (el as any).style && ((el as any).style.filter = "");
        });

        // nuke common overlays
        document.querySelectorAll<HTMLElement>(".overlay,.mask,.backdrop,.maintenance-mask,.gw-wizard-mask")
          .forEach((e) => { e.style.pointerEvents = "none"; e.removeAttribute("inert"); });
      } catch {}
    };

    unlock();
    const interval = window.setInterval(unlock, 700);
    const mo = new MutationObserver(unlock);
    try { mo.observe(document.documentElement, { attributes: true, childList: true, subtree: true }); } catch {}

    return () => {
      window.clearInterval(interval);
      try { mo.disconnect(); } catch {}
      try { document.querySelector('style[data-dev-unlocker="true"]')?.remove(); } catch {}
    };
  }, []);
}

// --- V2 SAFETY PATCH: ensure draft exists with a page ---
(() => {
  try {
    const KEY = 'glowell:draft:healthform:v2';
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : null;
    if (!obj || typeof obj !== 'object' || obj.page == null) {
      localStorage.setItem(KEY, JSON.stringify({ page: 1, p1: {}, p2: {}, meta: {} }));
    }
  } catch {
    try {
      localStorage.setItem('glowell:draft:healthform:v2', JSON.stringify({ page: 1, p1: {}, p2: {}, meta: {} }));
    } catch {}
  }
})();

type FormV2 = { page: number; p1?: any; p2?: any; meta?: any };
const EMPTY_V2: FormV2 = { page: 1, p1: {}, p2: {}, meta: {} };
const ensure = (v: any): FormV2 =>
  v && typeof v === 'object' ? { ...EMPTY_V2, ...v, page: Number(v.page) || 1 } : EMPTY_V2;

/**
 * Health-Form 2.0 — Two-page wizard
 * Page-1 (Basics) + Page-2 (Health & Review)
 * Step C: implements Page-2 with autosave + dual-write. Page-1 kept from Step B.
 * Additive only; existing /health-form remains unchanged.
 */

// ---------- Types ----------
type TimeHHMM = string;
type YesNo = "yes" | "no";

type Dosha = { vata?: number; pitta?: number; kapha?: number; label?: string };
type Labs = {
  bpSys?: number; bpDia?: number;
  fpg?: number; ppg?: number; a1c?: number;
  ldl?: number; hdl?: number; tg?: number;
  tsh?: number; ft4?: number;
  creat?: number; egfr?: number;
  vitD?: number; vitB12?: number;
};

type IntakeV2 = {
  profile?: {
    name?: string;
    mobile?: string;
    email?: string;
    timezone?: string;
    locationHint?: string;
    age?: number;
    dob?: string;
    sex?: "male" | "female" | "other";
  };
  household?: {
    maritalStatus?: "bachelor" | "married" | "divorced" | "widowed";
    childrenCount?: number;
    youngestAge?: number;
    careDuties?: YesNo;
  };
  schedule?: {
    wakeTime?: TimeHHMM;
    sleepTime?: TimeHHMM;
    baselineSleepHours?: number;
    sleepStyle?: "normal" | "restless" | "night-awakenings";
    quietFrom?: TimeHHMM;
    quietTo?: TimeHHMM;
    workType?: "desk" | "field" | "shift";
    workDays?: string[];
    mealAnchors?: { breakfast?: TimeHHMM; lunch?: TimeHHMM; snack?: TimeHHMM; dinner?: TimeHHMM; };
  };
  anthropometrics?: {
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    bmiCategory?: "under" | "normal" | "over" | "obese";
  };
  lifestyle?: {
    activity?: "sedentary" | "active" | "heavy";
    hydrationSelf?: "low" | "ok" | "high";
    caffeine?: "none" | "1-2" | "3+";
    caffeineCutoff?: TimeHHMM;
    smoking?: "never" | "former" | "yes";
    alcohol?: "never" | "occasional" | "frequent";
  };
  notesPage1?: string;

  // ---- Page-2 (new in Step C) ----
  health?: {
    complaints?: string[];                 // e.g., ["headache","acidity"]
    pmh?: string[];                        // ticked past medical history
    meds?: string;                         // free text
    allergies?: string;                    // free text
    labs?: Labs;                           // optional numbers
    uploadsNote?: string;                  // placeholder note for uploads (actual uploads handled elsewhere)
    bloodGroup?: string;                   // optional
    doshaBaseline?: Dosha;                 // sliders + label
  };
  notesPage2?: string;                     // free notes (page-2)
};

// ---------- Helpers ----------
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

function parseHHMM(t?: string): { h: number; m: number } | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { h, m: mm };
}
function hoursBetween(sleep?: string, wake?: string): number | undefined {
  const s = parseHHMM(sleep), w = parseHHMM(wake);
  if (!s || !w) return undefined;
  const start = s.h * 60 + s.m;
  const end = w.h * 60 + w.m;
  const mins = end >= start ? (end - start) : (24 * 60 - start + end);
  return Math.round((mins / 60) * 10) / 10;
}
function bmiFrom(heightCm?: number, weightKg?: number) {
  if (!heightCm || !weightKg || heightCm <= 0) return { bmi: undefined, cat: undefined as IntakeV2["anthropometrics"]["bmiCategory"] };
  const m = heightCm / 100;
  const bmi = +(weightKg / (m * m)).toFixed(1);
  let cat: IntakeV2["anthropometrics"]["bmiCategory"] = "normal";
  if (bmi < 18.5) cat = "under";
  else if (bmi < 23) cat = "normal";
  else if (bmi < 27.5) cat = "over";
  else cat = "obese";
  return { bmi, cat };
}
function weekDays() { return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; }
function countFilled(obj: Record<string, any>, keys: string[]) {
  let n = 0;
  keys.forEach(k => {
    const v = (obj as any)?.[k];
    if (v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) n++;
  });
  return n;
}
function labelDosha(d?: Dosha) {
  const v = d?.vata ?? 0, p = d?.pitta ?? 0, k = d?.kapha ?? 0;
  const arr = [{k:"Vata",v},{k:"Pitta",v:p},{k:"Kapha",v:k}].sort((a,b)=>b.v-a.v);
  const top = arr[0], second = arr[1];
  if (top.v === 0 && second.v === 0) return "";
  return second.v > 0 ? `${top.k}-${second.k}` : top.k;
}

// ---------- Storage helpers ----------
function loadIntake(accountId: string): IntakeV2 {
  try {
    const raw = localStorage.getItem(kIntake(accountId));
    if (raw) return JSON.parse(raw) as IntakeV2;
  } catch {}
  return {};
}
function saveIntake(accountId: string, intake: IntakeV2) {
  try {
    localStorage.setItem(kIntake(accountId), JSON.stringify(intake));
  } catch {}
  // Dual-write legacy
  try {
    const legacy = JSON.parse(localStorage.getItem(K_LEGACY_INTAKE) || "{}");
    const merged = { ...(legacy || {}), ...intake };
    localStorage.setItem(K_LEGACY_INTAKE, JSON.stringify(merged));
  } catch {
    localStorage.setItem(K_LEGACY_INTAKE, JSON.stringify(intake));
  }
}

// ---------- Wizard meta ----------
type SectionKey =
  | "identify" | "ageSex" | "household" | "wakeSleep" | "anthropometrics" | "workMeals" | "lifestyle" | "notesP1"
  | "complaints" | "pmh" | "medsAllergies" | "labsVitals" | "uploads" | "bloodGroup" | "dosha" | "notesP2" | "review";

const PAGE1: SectionKey[] = ["identify","ageSex","household","wakeSleep","anthropometrics","workMeals","lifestyle","notesP1"];
const PAGE2: SectionKey[] = ["complaints","pmh","medsAllergies","labsVitals","uploads","bloodGroup","dosha","notesP2","review"];

type BoxState = { done: boolean; count?: number; total?: number; };
type WizardDraft = { page: 1 | 2; boxes: Record<SectionKey, BoxState>; };

const DEFAULT_DRAFT: WizardDraft = {
  page: 1,
  boxes: Object.fromEntries([...PAGE1, ...PAGE2].map(k => [k, { done: false, count: 0, total: 0 }])) as Record<SectionKey, BoxState>,
};

// ---------- UI bits ----------
function Badge({ state }: { state: BoxState }) {
  if (state.done) return <span className="gw-badge">✓ Saved</span>;
  const c = (state.count ?? 0), t = (state.total ?? 0);
  return <span className="gw-badge">{t ? `${c}/${t}` : "•"}</span>;
}
function Box({ title, k, draft, setDraft, children }:{
  title: string; k: SectionKey; draft: WizardDraft; setDraft: (d:WizardDraft)=>void; children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  const state = draft.boxes[k] || { done: false, count: 0, total: 0 };
  return (
    <div className="gw-card" style={{ marginBottom: "0.75rem" }}>
      <div className="gw-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="text-lg">{title}</h3>
        <div className="gw-row" style={{ gap: "0.5rem", alignItems: "center" }}>
          <Badge state={state} />
          <button className="gw-btn" onClick={() => setOpen(!open)}>{open ? "Close" : "Open"}</button>
        </div>
      </div>
      {open && (
        <div className="gw-tint" style={{ marginTop: "0.5rem", padding: "0.75rem", borderRadius: "0.5rem" }}>
          {children}
        </div>
      )}
    </div>
  );
}
function Labeled({ label, children }:{ label:string; children:React.ReactNode }) {
  return (
    <label className="gw-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <div className="gw-label" style={{ width: "180px" }}>{label}</div>
      <div style={{ flex: 1, minWidth: "220px" }}>{children}</div>
    </label>
  );
}
function Text({ value, onChange, placeholder, type="text" }:{
  value?: string; onChange:(v:string)=>void; placeholder?:string; type?:string;
}) {
  return <input className="gw-input" value={value || ""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} />;
}
function NumberInput({ value, onChange, placeholder }:{
  value?: number; onChange:(v:number|undefined)=>void; placeholder?:string;
}) {
  return <input className="gw-input" value={value ?? ""} onChange={e=>onChange(e.target.value===""?undefined:Number(e.target.value))} placeholder={placeholder} inputMode="numeric" />;
}
function Time({ value, onChange }:{ value?: TimeHHMM; onChange:(v:TimeHHMM)=>void }) {
  return <input className="gw-input" type="time" value={value || ""} onChange={e=>onChange(e.target.value)} />;
}
function Select<T extends string>({ value, onChange, options }:{
  value?: T; onChange:(v:T)=>void; options:{label:string; value:T}[];
}) {
  return (
    <select className="gw-input" value={value || ""} onChange={e=>onChange(e.target.value as T)}>
      <option value="" />
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Chips<T extends string>({ values, setValues, options }:{
  values: T[]; setValues: (v:T[])=>void; options:{label:string; value:T}[];
}) {
  const toggle = (v:T) => {
    const has = values.includes(v);
    setValues(has ? values.filter(x=>x!==v) : [...values, v]);
  };
  return (
    <div className="gw-row" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
      {options.map(o=>(
        <button key={o.value} type="button"
          className={`gw-badge ${values.includes(o.value) ? "is-active" : ""}`}
          onClick={()=>toggle(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Option data ----------
const COMPLAINTS = [
  "headache","back_pain","knee_pain","acidity","bloating","constipation","cough","cold",
  "fatigue","breathlessness","palpitations","poor_sleep","low_mood","stress","other"
] as const;
const PMH_GROUPS: { title:string; items:string[] }[] = [
  { title: "Cardio/Metabolic", items: ["hypertension","diabetes","hyperlipidemia"] },
  { title: "Thyroid", items: ["hypothyroid","hyperthyroid"] },
  { title: "Respiratory", items: ["asthma","allergic_rhinitis"] },
  { title: "Gastrointestinal", items: ["gerd","constipation_ibs"] },
  { title: "Renal/Hematology", items: ["kidney_stone","anemia"] },
  { title: "Neuro/Bone-Joint", items: ["migraine","chronic_joint_pain"] },
  { title: "Mental Health (tags)", items: ["anxiety_tag","depression_tag"] },
];

// ---------- Main ----------
export default function HealthFormV2() {
    useDevUnlock();   // keeps all inputs editable while you work
  React.useEffect(() => {
  const els = document.querySelectorAll('input, textarea, select, button');
  els.forEach((el) => {
    try {
      (el as HTMLInputElement).disabled = false;
      (el as HTMLInputElement).readOnly = false;
      el.removeAttribute('disabled');
      el.removeAttribute('readonly');
      (el as HTMLElement).style.pointerEvents = 'auto';
      (el as HTMLElement).style.opacity = '';
      (el as HTMLElement).style.filter = '';
    } catch {}
  });
}, []);
  const accountId = useAccountId();
  const DRAFT_KEY = `wizard:v2:${accountId}`;

  // Draft
  const [draft, setDraft] = React.useState<WizardDraft>(() => loadDraft<WizardDraft>(DRAFT_KEY, DEFAULT_DRAFT));
  useAutosave(DRAFT_KEY, draft, 600);
  React.useEffect(() => { saveDraft(DRAFT_KEY, draft); }, [DRAFT_KEY, draft]);

  // Intake
  const [intake, setIntake] = React.useState<IntakeV2>({});
  React.useEffect(() => {
    setIntake(loadIntake(accountId));
    setDraft(loadDraft<WizardDraft>(DRAFT_KEY, DEFAULT_DRAFT));
  }, [accountId]);

  // Derivations: baseline sleep + BMI
  React.useEffect(() => {
    const s = intake.schedule || {};
    const a = intake.anthropometrics || {};
    const h = hoursBetween(s.sleepTime, s.wakeTime);
    const { bmi, cat } = bmiFrom(a.heightCm, a.weightKg);
    setIntake(p => ({
      ...p,
      schedule: { ...(p.schedule||{}), baselineSleepHours: h },
      anthropometrics: { ...(p.anthropometrics||{}), bmi, bmiCategory: cat },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intake.schedule?.sleepTime, intake.schedule?.wakeTime, intake.anthropometrics?.heightCm, intake.anthropometrics?.weightKg]);

  // Persist intake (autosave + dual-write)
  useAutosave(kIntake(accountId), intake, 600);
  React.useEffect(() => { saveIntake(accountId, intake); }, [accountId, intake]);

  const setBoxState = (k: SectionKey, st: Partial<BoxState>) => {
    setDraft(prev => {
      const cur = prev.boxes[k] || { done: false, count: 0, total: 0 };
      return { ...prev, boxes: { ...prev.boxes, [k]: { ...cur, ...st } } };
    });
  };
  const setPage = (p:1|2) => setDraft(d => ({ ...d, page: p }));

  // Page status
  const pageKeys = draft.page === 1 ? PAGE1 : PAGE2;
  const completed = pageKeys.filter(k => draft.boxes[k]?.done).length;
  const total = pageKeys.length;

  // Duplicate check (mobile)
  const dupByMobile = (mob?: string) => {
    const phone = (mob || "").trim();
    if (!phone) return undefined;
    const found = getIndex().find(a => (a.phone || "").trim() === phone && a.id !== accountId);
    return found?.id;
  };

  // Gating for Women's section
  const isFemale12to55 =
    (intake.profile?.sex === "female") &&
    ((intake.profile?.age ?? 0) >= 12) &&
    ((intake.profile?.age ?? 0) <= 55);

  // ---- Page 1 UI (kept from Step B, condensed) ----
  const Page1 = () => (
    <>
      <SectionIdentify />
      <SectionAgeSex />
      <SectionHousehold />
      <SectionWakeSleep />
      <SectionAnthropometrics />
      <SectionWorkMeals />
      <SectionLifestyle />
      <SectionNotesP1 />
      <div className="gw-row" style={{ justifyContent: "flex-end" }}>
        <button className="gw-btn" onClick={()=>setPage(2)}>Next → Health</button>
      </div>
      <div className="text-xs" style={{ marginTop: "0.5rem" }}>
        Page progress: {completed}/{total} sections marked saved.
      </div>
    </>
  );

  // ---- Page 2 UI (new in Step C) ----
  const Page2 = () => (
    <>
      <SectionComplaints />
      <SectionPMH />
      <SectionMedsAllergies />
      <SectionLabsVitals />
      <SectionUploads />
      <SectionBloodGroup />
      <SectionDosha />
      <SectionNotesP2 />
      <SectionReview />
      <div className="gw-row" style={{ justifyContent: "space-between" }}>
        <button className="gw-btn" onClick={()=>setPage(1)}>← Back</button>
      </div>
      <div className="text-xs" style={{ marginTop: "0.5rem" }}>
        Page progress: {completed}/{total} sections marked saved.
      </div>
    </>
  );

  // ---- Section components (P1) ----
  function SectionIdentify() {
    return (
      <Box title="Identify" k="identify" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Labeled label="Name">
            <Text value={intake.profile?.name} onChange={v=>setIntake(p=>({ ...p, profile:{ ...(p.profile||{}), name:v } }))} placeholder="Full name" />
          </Labeled>
          <Labeled label="Mobile">
            <Text value={intake.profile?.mobile} onChange={v=>setIntake(p=>({ ...p, profile:{ ...(p.profile||{}), mobile:v } }))} placeholder="10-digit number" />
          </Labeled>
          <Labeled label="Email">
            <Text value={intake.profile?.email} onChange={v=>setIntake(p=>({ ...p, profile:{ ...(p.profile||{}), email:v } }))} placeholder="name@example.com" type="email" />
          </Labeled>
          <Labeled label="Timezone">
            <Text value={intake.profile?.timezone || tz} onChange={v=>setIntake(p=>({ ...p, profile:{ ...(p.profile||{}), timezone:v } }))} placeholder="e.g., Asia/Kolkata" />
          </Labeled>
          <Labeled label="Location (optional)">
            <Text value={intake.profile?.locationHint} onChange={v=>setIntake(p=>({ ...p, profile:{ ...(p.profile||{}), locationHint:v } }))} placeholder="City / State / PIN (optional)" />
          </Labeled>
        </div>
        {!!dupByMobile(intake.profile?.mobile) && (
          <div className="gw-badge" style={{ marginTop: "0.5rem" }}>
            Mobile matches existing account id: {dupByMobile(intake.profile?.mobile)}
          </div>
        )}
        {setTimeout(()=>setBoxState("identify", {
          total: 5,
          count: countFilled(intake.profile||{}, ["name","mobile","email","timezone","locationHint"]),
          done: Boolean((intake.profile?.name||"").trim() && (intake.profile?.mobile||"").trim())
        }), 0) && null}
      </Box>
    );
  }
  function SectionAgeSex() {
    return (
      <Box title="Age & Sex" k="ageSex" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Labeled label="DOB">
            <input className="gw-input" type="date" value={intake.profile?.dob || ""} onChange={e=>{
              const dob = e.target.value || undefined;
              let age: number | undefined = intake.profile?.age;
              if (dob) {
                const birth = new Date(dob);
                const today = new Date();
                age = today.getFullYear() - birth.getFullYear() - ((today.getMonth()<birth.getMonth() || (today.getMonth()===birth.getMonth() && today.getDate()<birth.getDate())) ? 1 : 0);
              }
              setIntake(p=>({ ...p, profile:{ ...(p.profile||{}), dob, age } }));
            }} />
          </Labeled>
          <Labeled label="Age (years)">
            <NumberInput value={intake.profile?.age} onChange={v=>setIntake(p=>({ ...p, profile:{ ...(p.profile||{}), age:v } }))} placeholder="e.g., 42" />
          </Labeled>
          <Labeled label="Sex">
            <Select value={intake.profile?.sex as any} onChange={(v)=>setIntake(p=>({ ...p, profile:{ ...(p.profile||{}), sex:v as any } }))} options={[
              {label:"Male", value:"male"},
              {label:"Female", value:"female"},
              {label:"Other", value:"other"},
            ]}/>
          </Labeled>
        </div>
        {setTimeout(()=>setBoxState("ageSex", {
          total: 3,
          count: countFilled(intake.profile||{}, ["dob","age","sex"]),
          done: Boolean(intake.profile?.age && intake.profile?.sex)
        }), 0) && null}
      </Box>
    );
  }
  function SectionHousehold() {
    return (
      <Box title="Household" k="household" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Labeled label="Marital status">
            <Select value={intake.household?.maritalStatus as any}
                    onChange={(v)=>setIntake(p=>({ ...p, household:{ ...(p.household||{}), maritalStatus: v as any } }))}
                    options={[
                      {label:"Bachelor", value:"bachelor"},
                      {label:"Married", value:"married"},
                      {label:"Divorced", value:"divorced"},
                      {label:"Widowed", value:"widowed"},
                    ]}/>
          </Labeled>
          {intake.household?.maritalStatus === "married" && (
            <>
              <Labeled label="# Children">
                <NumberInput value={intake.household?.childrenCount} onChange={(v)=>setIntake(p=>({ ...p, household:{ ...(p.household||{}), childrenCount:v } }))} placeholder="0–6+" />
              </Labeled>
              <Labeled label="Youngest age (yrs)">
                <NumberInput value={intake.household?.youngestAge} onChange={(v)=>setIntake(p=>({ ...p, household:{ ...(p.household||{}), youngestAge:v } }))} placeholder="optional" />
              </Labeled>
            </>
          )}
          <Labeled label="Care duties">
            <Select value={intake.household?.careDuties as any}
                    onChange={(v)=>setIntake(p=>({ ...p, household:{ ...(p.household||{}), careDuties: v as any } }))}
                    options={[
                      {label:"No", value:"no"},
                      {label:"Yes", value:"yes"},
                    ]}/>
          </Labeled>
        </div>
        {setTimeout(()=>setBoxState("household", {
          total: intake.household?.maritalStatus === "married" ? 4 : 2,
          count: (intake.household?.maritalStatus === "married"
            ? countFilled(intake.household||{}, ["maritalStatus","childrenCount","youngestAge","careDuties"])
            : countFilled(intake.household||{}, ["maritalStatus","careDuties"])),
          done: Boolean(intake.household?.maritalStatus)
        }), 0) && null}
      </Box>
    );
  }
  function SectionWakeSleep() {
    return (
      <Box title="Wake–Sleep (Baseline)" k="wakeSleep" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Labeled label="Wake time">
            <Time value={intake.schedule?.wakeTime} onChange={(v)=>setIntake(p=>({ ...p, schedule:{ ...(p.schedule||{}), wakeTime:v } }))}/>
          </Labeled>
          <Labeled label="Sleep time">
            <Time value={intake.schedule?.sleepTime} onChange={(v)=>setIntake(p=>({ ...p, schedule:{ ...(p.schedule||{}), sleepTime:v } }))}/>
          </Labeled>
          <Labeled label="Baseline sleep (hrs)">
            <input className="gw-input" value={intake.schedule?.baselineSleepHours ?? ""} readOnly />
          </Labeled>
          <Labeled label="Sleep style">
            <Select value={intake.schedule?.sleepStyle as any}
                    onChange={(v)=>setIntake(p=>({ ...p, schedule:{ ...(p.schedule||{}), sleepStyle: v as any } }))}
                    options={[
                      {label:"Normal", value:"normal"},
                      {label:"Restless", value:"restless"},
                      {label:"Night awakenings", value:"night-awakenings"},
                    ]}/>
          </Labeled>
          <Labeled label="Quiet hours (from)">
            <Time value={intake.schedule?.quietFrom} onChange={(v)=>setIntake(p=>({ ...p, schedule:{ ...(p.schedule||{}), quietFrom:v } }))}/>
          </Labeled>
          <Labeled label="Quiet hours (to)">
            <Time value={intake.schedule?.quietTo} onChange={(v)=>setIntake(p=>({ ...p, schedule:{ ...(p.schedule||{}), quietTo:v } }))}/>
          </Labeled>
        </div>
        {setTimeout(()=>setBoxState("wakeSleep", {
          total: 6,
          count: countFilled(intake.schedule||{}, ["wakeTime","sleepTime","baselineSleepHours","sleepStyle","quietFrom","quietTo"]),
          done: Boolean(intake.schedule?.wakeTime && intake.schedule?.sleepTime)
        }), 0) && null}
      </Box>
    );
  }
  function SectionAnthropometrics() {
    return (
      <Box title="Anthropometrics (BMI)" k="anthropometrics" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Labeled label="Height (cm)">
            <NumberInput value={intake.anthropometrics?.heightCm} onChange={(v)=>setIntake(p=>({ ...p, anthropometrics:{ ...(p.anthropometrics||{}), heightCm:v } }))} placeholder="e.g., 165" />
          </Labeled>
          <Labeled label="Weight (kg)">
            <NumberInput value={intake.anthropometrics?.weightKg} onChange={(v)=>setIntake(p=>({ ...p, anthropometrics:{ ...(p.anthropometrics||{}), weightKg:v } }))} placeholder="e.g., 64" />
          </Labeled>
          <Labeled label="BMI">
            <input className="gw-input" value={intake.anthropometrics?.bmi ?? ""} readOnly />
          </Labeled>
          <Labeled label="Category">
            <input className="gw-input" value={intake.anthropometrics?.bmiCategory || ""} readOnly />
          </Labeled>
        </div>
        {setTimeout(()=>setBoxState("anthropometrics", {
          total: 4,
          count: countFilled(intake.anthropometrics||{}, ["heightCm","weightKg","bmi","bmiCategory"]),
          done: Boolean(intake.anthropometrics?.heightCm && intake.anthropometrics?.weightKg)
        }), 0) && null}
      </Box>
    );
  }
  function SectionWorkMeals() {
    return (
      <Box title="Work & Meals" k="workMeals" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Labeled label="Work type">
            <Select value={intake.schedule?.workType as any}
                    onChange={(v)=>setIntake(p=>({ ...p, schedule:{ ...(p.schedule||{}), workType: v as any } }))}
                    options={[
                      {label:"Desk", value:"desk"},
                      {label:"Field", value:"field"},
                      {label:"Shift", value:"shift"},
                    ]}/>
          </Labeled>
          <Labeled label="Work days">
            <Chips<string>
              values={intake.schedule?.workDays || []}
              setValues={(vals)=>setIntake(p=>({ ...p, schedule:{ ...(p.schedule||{}), workDays: vals } }))}
              options={weekDays().map(d=>({ label:d, value:d }))}
            />
          </Labeled>
          <Labeled label="Breakfast time">
            <Time value={intake.schedule?.mealAnchors?.breakfast} onChange={(v)=>setIntake(p=>({
              ...p, schedule:{ ...(p.schedule||{}), mealAnchors:{ ...(p.schedule?.mealAnchors||{}), breakfast:v } }
            }))}/>
          </Labeled>
          <Labeled label="Lunch time">
            <Time value={intake.schedule?.mealAnchors?.lunch} onChange={(v)=>setIntake(p=>({
              ...p, schedule:{ ...(p.schedule||{}), mealAnchors:{ ...(p.schedule?.mealAnchors||{}), lunch:v } }
            }))}/>
          </Labeled>
          <Labeled label="Snack time">
            <Time value={intake.schedule?.mealAnchors?.snack} onChange={(v)=>setIntake(p=>({
              ...p, schedule:{ ...(p.schedule||{}), mealAnchors:{ ...(p.schedule?.mealAnchors||{}), snack:v } }
            }))}/>
          </Labeled>
          <Labeled label="Dinner time">
            <Time value={intake.schedule?.mealAnchors?.dinner} onChange={(v)=>setIntake(p=>({
              ...p, schedule:{ ...(p.schedule||{}), mealAnchors:{ ...(p.schedule?.mealAnchors||{}), dinner:v } }
            }))}/>
          </Labeled>
        </div>
        {setTimeout(()=>setBoxState("workMeals", {
          total: 6,
          count: countFilled(intake.schedule||{}, ["workType","workDays"]) +
                 countFilled(intake.schedule?.mealAnchors||{}, ["breakfast","lunch","snack","dinner"]),
          done: Boolean(intake.schedule?.workType)
        }), 0) && null}
      </Box>
    );
  }
  function SectionLifestyle() {
    return (
      <Box title="Lifestyle & Habits" k="lifestyle" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Labeled label="Activity level">
            <Select value={intake.lifestyle?.activity as any}
                    onChange={(v)=>setIntake(p=>({ ...p, lifestyle:{ ...(p.lifestyle||{}), activity: v as any } }))}
                    options={[
                      {label:"Sedentary", value:"sedentary"},
                      {label:"Active", value:"active"},
                      {label:"Heavy", value:"heavy"},
                    ]}/>
          </Labeled>
          <Labeled label="Hydration self-rating">
            <Select value={intake.lifestyle?.hydrationSelf as any}
                    onChange={(v)=>setIntake(p=>({ ...p, lifestyle:{ ...(p.lifestyle||{}), hydrationSelf: v as any } }))}
                    options={[
                      {label:"Low", value:"low"},
                      {label:"OK", value:"ok"},
                      {label:"High", value:"high"},
                    ]}/>
          </Labeled>
          <Labeled label="Caffeine">
            <Select value={intake.lifestyle?.caffeine as any}
                    onChange={(v)=>setIntake(p=>({ ...p, lifestyle:{ ...(p.lifestyle||{}), caffeine: v as any } }))}
                    options={[
                      {label:"None", value:"none"},
                      {label:"1–2 cups", value:"1-2"},
                      {label:"3+ cups", value:"3+"},
                    ]}/>
          </Labeled>
          <Labeled label="Caffeine cut-off (suggested)">
            <Time value={intake.lifestyle?.caffeineCutoff} onChange={(v)=>setIntake(p=>({ ...p, lifestyle:{ ...(p.lifestyle||{}), caffeineCutoff:v } }))}/>
          </Labeled>
          <Labeled label="Smoking">
            <Select value={intake.lifestyle?.smoking as any}
                    onChange={(v)=>setIntake(p=>({ ...p, lifestyle:{ ...(p.lifestyle||{}), smoking: v as any } }))}
                    options={[
                      {label:"Never", value:"never"},
                      {label:"Former", value:"former"},
                      {label:"Yes", value:"yes"},
                    ]}/>
          </Labeled>
          <Labeled label="Alcohol">
            <Select value={intake.lifestyle?.alcohol as any}
                    onChange={(v)=>setIntake(p=>({ ...p, lifestyle:{ ...(p.lifestyle||{}), alcohol: v as any } }))}
                    options={[
                      {label:"Never", value:"never"},
                      {label:"Occasional", value:"occasional"},
                      {label:"Frequent", value:"frequent"},
                    ]}/>
          </Labeled>
        </div>
        {setTimeout(()=>setBoxState("lifestyle", {
          total: 6,
          count: countFilled(intake.lifestyle||{}, ["activity","hydrationSelf","caffeine","caffeineCutoff","smoking","alcohol"]),
          done: Boolean(intake.lifestyle?.activity && intake.lifestyle?.hydrationSelf)
        }), 0) && null}
      </Box>
    );
  }
  function SectionNotesP1() {
    return (
      <Box title="Free Notes (Page 1)" k="notesP1" draft={draft} setDraft={setDraft}>
        <textarea className="gw-input" rows={4} placeholder="Anything important for planning..."
          value={intake.notesPage1 || ""} onChange={e=>setIntake(p=>({ ...p, notesPage1: e.target.value }))} />
        {setTimeout(()=>setBoxState("notesP1", {
          total: 1, count: (intake.notesPage1 && intake.notesPage1.trim() ? 1 : 0),
          done: Boolean(intake.notesPage1 && intake.notesPage1.trim().length>0)
        }), 0) && null}
      </Box>
    );
  }

  // ---- Section components (P2 new) ----
  function SectionComplaints() {
    const selected = intake.health?.complaints || [];
    const setSelected = (vals: string[]) => setIntake(p=>({ ...p, health:{ ...(p.health||{}), complaints: vals } }));
    return (
      <Box title="Presenting Complaints (Today)" k="complaints" draft={draft} setDraft={setDraft}>
        <Chips<string>
          values={selected}
          setValues={setSelected}
          options={COMPLAINTS.map(c=>({label:c.replaceAll("_"," ").replace(/\b\w/g, s=>s.toUpperCase()), value:c}))}
        />
        <div className="text-xs" style={{marginTop:"0.5rem"}}>Tip: you can refine durations/severity later in the tracker.</div>
        {setTimeout(()=>setBoxState("complaints", {
          total: 1, count: selected.length>0 ? 1 : 0, done: selected.length>0
        }), 0) && null}
      </Box>
    );
  }
  function SectionPMH() {
    const pmh = intake.health?.pmh || [];
    const setPMH = (vals: string[]) => setIntake(p=>({ ...p, health:{ ...(p.health||{}), pmh: vals } }));
    const options = [
      ...PMH_GROUPS.flatMap(g => g.items),
      ...(isFemale12to55 ? ["pcos_pcod","irregular_cycles","menopause_symptoms"] : [])
    ];
    return (
      <Box title="Past Medical History" k="pmh" draft={draft} setDraft={setDraft}>
        <Chips<string>
          values={pmh}
          setValues={setPMH}
          options={options.map(x=>({label:x.replaceAll("_"," ").replace(/\b\w/g, s=>s.toUpperCase()), value:x}))}
        />
        {setTimeout(()=>setBoxState("pmh", {
          total: 1, count: pmh.length>0 ? 1 : 0, done: pmh.length>0
        }), 0) && null}
      </Box>
    );
  }
  function SectionMedsAllergies() {
    return (
      <Box title="Medications & Allergies" k="medsAllergies" draft={draft} setDraft={setDraft}>
        <Labeled label="Current medications">
          <textarea className="gw-input" rows={3} placeholder="e.g., Metformin 500 mg OD; Atorvastatin 10 mg HS"
            value={intake.health?.meds || ""} onChange={e=>setIntake(p=>({ ...p, health:{ ...(p.health||{}), meds: e.target.value } }))} />
        </Labeled>
        <Labeled label="Allergies / Intolerances">
          <textarea className="gw-input" rows={2} placeholder="e.g., Penicillin; Lactose"
            value={intake.health?.allergies || ""} onChange={e=>setIntake(p=>({ ...p, health:{ ...(p.health||{}), allergies: e.target.value } }))} />
        </Labeled>
        {setTimeout(()=>setBoxState("medsAllergies", {
          total: 2, count: countFilled(intake.health||{}, ["meds","allergies"]), done: Boolean((intake.health?.meds||"").trim())
        }), 0) && null}
      </Box>
    );
  }
  function SectionLabsVitals() {
    const labs = intake.health?.labs || {};
    const setLab = (k:keyof Labs, v:number|undefined) => setIntake(p=>({ ...p, health:{ ...(p.health||{}), labs:{ ...(p.health?.labs||{}), [k]: v } } }));
    return (
      <Box title="Labs & Vitals (baseline, optional)" k="labsVitals" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap:"0.75rem", flexWrap:"wrap" }}>
          <Labeled label="BP Systolic">
            <NumberInput value={labs.bpSys} onChange={v=>setLab("bpSys", v)} placeholder="e.g., 120" />
          </Labeled>
          <Labeled label="BP Diastolic">
            <NumberInput value={labs.bpDia} onChange={v=>setLab("bpDia", v)} placeholder="e.g., 80" />
          </Labeled>
          <Labeled label="FPG (mg/dL)">
            <NumberInput value={labs.fpg} onChange={v=>setLab("fpg", v)} placeholder="e.g., 95" />
          </Labeled>
          <Labeled label="PPG (mg/dL)">
            <NumberInput value={labs.ppg} onChange={v=>setLab("ppg", v)} placeholder="e.g., 120" />
          </Labeled>
          <Labeled label="A1c (%)">
            <NumberInput value={labs.a1c} onChange={v=>setLab("a1c", v)} placeholder="e.g., 5.7" />
          </Labeled>
          <Labeled label="LDL">
            <NumberInput value={labs.ldl} onChange={v=>setLab("ldl", v)} placeholder="e.g., 100" />
          </Labeled>
          <Labeled label="HDL">
            <NumberInput value={labs.hdl} onChange={v=>setLab("hdl", v)} placeholder="e.g., 45" />
          </Labeled>
          <Labeled label="Triglycerides">
            <NumberInput value={labs.tg} onChange={v=>setLab("tg", v)} placeholder="e.g., 150" />
          </Labeled>
          <Labeled label="TSH">
            <NumberInput value={labs.tsh} onChange={v=>setLab("tsh", v)} placeholder="e.g., 2.5" />
          </Labeled>
          <Labeled label="FT4">
            <NumberInput value={labs.ft4} onChange={v=>setLab("ft4", v)} placeholder="e.g., 1.1" />
          </Labeled>
          <Labeled label="Creatinine">
            <NumberInput value={labs.creat} onChange={v=>setLab("creat", v)} placeholder="e.g., 0.9" />
          </Labeled>
          <Labeled label="eGFR">
            <NumberInput value={labs.egfr} onChange={v=>setLab("egfr", v)} placeholder="e.g., 95" />
          </Labeled>
          <Labeled label="Vitamin D">
            <NumberInput value={labs.vitD} onChange={v=>setLab("vitD", v)} placeholder="e.g., 30" />
          </Labeled>
          <Labeled label="Vitamin B12">
            <NumberInput value={labs.vitB12} onChange={v=>setLab("vitB12", v)} placeholder="e.g., 350" />
          </Labeled>
        </div>
        {setTimeout(()=>setBoxState("labsVitals", {
          total: 14, count: countFilled(labs as any, ["bpSys","bpDia","fpg","ppg","a1c","ldl","hdl","tg","tsh","ft4","creat","egfr","vitD","vitB12"]),
          done: Boolean(Object.values(labs).some(x=>x!==undefined && x!==""))
        }), 0) && null}
      </Box>
    );
  }
  function SectionUploads() {
    return (
      <Box title="Uploads" k="uploads" draft={draft} setDraft={setDraft}>
        <div className="text-sm">Use your existing uploads workflow/pages. You can leave a note here (file names, dates):</div>
        <textarea className="gw-input" rows={2} placeholder="e.g., CBC_2025-09-01.pdf; A1c_2025-09-05.jpg"
          value={intake.health?.uploadsNote || ""} onChange={e=>setIntake(p=>({ ...p, health:{ ...(p.health||{}), uploadsNote: e.target.value } }))} />
        {setTimeout(()=>setBoxState("uploads", {
          total: 1, count: (intake.health?.uploadsNote?.trim()?.length?1:0), done: Boolean(intake.health?.uploadsNote?.trim())
        }), 0) && null}
      </Box>
    );
  }
  function SectionBloodGroup() {
    return (
      <Box title="Blood Group (optional)" k="bloodGroup" draft={draft} setDraft={setDraft}>
        <Labeled label="Blood group">
          <Select value={intake.health?.bloodGroup as any}
                  onChange={(v)=>setIntake(p=>({ ...p, health:{ ...(p.health||{}), bloodGroup: v as any } }))}
                  options={[
                    {label:"A+", value:"A+"},{label:"A-", value:"A-"},
                    {label:"B+", value:"B+"},{label:"B-", value:"B-"},
                    {label:"AB+", value:"AB+"},{label:"AB-", value:"AB-"},
                    {label:"O+", value:"O+"},{label:"O-", value:"O-"},
                  ]}/>
        </Labeled>
        {setTimeout(()=>setBoxState("bloodGroup", {
          total: 1, count: (intake.health?.bloodGroup ? 1 : 0), done: Boolean(intake.health?.bloodGroup)
        }), 0) && null}
      </Box>
    );
  }
  function SectionDosha() {
    const d = intake.health?.doshaBaseline || {};
    const setD = (patch: Partial<Dosha>) => setIntake(p=>({
      ...p, health: { ...(p.health||{}), doshaBaseline: { ...(p.health?.doshaBaseline||{}), ...patch } }
    }));
    const label = labelDosha(d);
    React.useEffect(()=>{ if (label) setD({ label }); /* set once when values change */ // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [d.vata, d.pitta, d.kapha]);

    return (
      <Box title="Dosha (baseline, optional)" k="dosha" draft={draft} setDraft={setDraft}>
        <div className="gw-row" style={{ gap:"0.75rem", flexWrap:"wrap" }}>
          <Labeled label={`Vata (${d.vata ?? 0})`}>
            <input className="gw-input" type="range" min={0} max={10} step={1}
              value={d.vata ?? 0} onChange={e=>setD({ vata: Number(e.target.value) })}/>
          </Labeled>
          <Labeled label={`Pitta (${d.pitta ?? 0})`}>
            <input className="gw-input" type="range" min={0} max={10} step={1}
              value={d.pitta ?? 0} onChange={e=>setD({ pitta: Number(e.target.value) })}/>
          </Labeled>
          <Labeled label={`Kapha (${d.kapha ?? 0})`}>
            <input className="gw-input" type="range" min={0} max={10} step={1}
              value={d.kapha ?? 0} onChange={e=>setD({ kapha: Number(e.target.value) })}/>
          </Labeled>
          <Labeled label="Label">
            <input className="gw-input" value={label} readOnly />
          </Labeled>
        </div>
        {setTimeout(()=>setBoxState("dosha", {
          total: 3, count: countFilled(d as any, ["vata","pitta","kapha"]), done: Boolean((d.vata ?? 0) + (d.pitta ?? 0) + (d.kapha ?? 0) > 0)
        }), 0) && null}
      </Box>
    );
  }
  function SectionNotesP2() {
    return (
      <Box title="Free Notes (Page 2)" k="notesP2" draft={draft} setDraft={setDraft}>
        <textarea className="gw-input" rows={4} placeholder="Anything important for planning..."
          value={intake.notesPage2 || ""} onChange={e=>setIntake(p=>({ ...p, notesPage2: e.target.value }))} />
        {setTimeout(()=>setBoxState("notesP2", {
          total: 1, count: (intake.notesPage2 && intake.notesPage2.trim() ? 1 : 0),
          done: Boolean(intake.notesPage2 && intake.notesPage2.trim().length>0)
        }), 0) && null}
      </Box>
    );
  }
  function SectionReview() {
    const summary = {
      profile: intake.profile,
      household: intake.household,
      schedule: intake.schedule,
      anthropometrics: intake.anthropometrics,
      lifestyle: intake.lifestyle,
      health: intake.health,
      notesPage1: intake.notesPage1,
      notesPage2: intake.notesPage2,
    };
    const goPlan = () => {
      // For now, navigate to existing Health Plan page; serverless AI comes in Step E
      window.location.href = "/health-plan";
    };
    return (
      <Box title="Review & Finish" k="review" draft={draft} setDraft={setDraft}>
        <div className="text-sm">Quick summary (read-only):</div>
        <pre className="gw-tint" style={{ whiteSpace:"pre-wrap", padding:"0.75rem", borderRadius:"0.5rem", maxHeight:"260px", overflow:"auto" }}>
{JSON.stringify(summary, null, 2)}
        </pre>
        <div className="gw-row" style={{ justifyContent:"flex-end", gap:"0.5rem" }}>
          <button className="gw-btn" onClick={()=>alert("Saved ✔")}>Save</button>
          <button className="gw-btn" onClick={goPlan}>Generate Plan →</button>
        </div>
        {setTimeout(()=>setBoxState("review", {
          total: 1, count: 1, done: true
        }), 0) && null}
      </Box>
    );
  }

  // ---- Render root ----
  return (
    <div className="py-2">
      <div className="gw-tint mx-auto" style={{ maxWidth: 980 }}>
        <div className="gw-row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="text-xl">Health-Form 2.0 (Wizard)</h2>
          <div className="gw-badge">Account: {accountId}</div>
        </div>

        {/* Stepper */}
        <div className="gw-row" style={{ gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
          <button className={`gw-btn ${draft.page===1?'is-active':''}`} onClick={()=>setPage(1)}>Basics</button>
          <button className={`gw-btn ${draft.page===2?'is-active':''}`} onClick={()=>setPage(2)}>Health & Review</button>
        </div>

        {draft.page === 1 ? <Page1/> : <Page2/>}

        <div className="text-xs" style={{ marginTop: "0.75rem" }}>
          Page progress: {completed}/{total} sections marked saved.
        </div>
      </div>
    </div>
  );
}
