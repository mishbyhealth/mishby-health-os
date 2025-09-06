import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Owner + Full Form controls (persisted via localStorage)
import { isOwner, isFullForm, setFullForm, getFullForm } from "@/utils/owner";
import OwnerBar from "@/components/OwnerBar";

// ---------------------------
// Storage Keys (v2 schema)
// ---------------------------
const KEY_INTAKE = "glowell:intake.v2";
const KEY_TODAY = "glowell:daily";
const KEY_LABS = "glowell:labs";

// ---------------------------
// Types (kept simple & permissive)
// ---------------------------
type Sex = "Male" | "Female" | "Other" | "";

type DoshaMix = {
  vata: number; // 1–10
  pitta: number;
  kapha: number;
  label?: string; // computed label like "Pitta-Vata"
};

type ProfileDrawer = {
  name: string;
  dob: string; // or empty if using age
  age?: number | "";
  sex: Sex;
  heightCm?: number | "";
  weightKg?: number | "";
  locationState?: string;
  locationCity?: string;
  timezone?: string;
  dietType?: "Vegetarian" | "Vegan" | "All-eater" | "Egg-only" | "";
  cuisine?: string;
  allergies?: string;
  intolerances?: string;
  preferences?: string;
  archetype?: string; // Student, Desk, Field, Shift, Homemaker, etc.
};

type ScheduleDrawer = {
  workDays?: string;
  workTimes?: string;
  wakeTime?: string;
  sleepTime?: string;
  mealAnchors?: {
    breakfast?: string;
    lunch?: string;
    snack?: string;
    dinner?: string;
  };
  activityWindows?: string;
};

type HealthDrawer = {
  conditions: string[];
  currentMeds?: string;
  wellbeing?: {
    mood?: number; // 1–10
    stress?: number; // 1–10
    sleepQuality?: number; // 1–10
  };
  dosha?: DoshaMix;
  labAnchors?: string;
};

type TodayLog = {
  date: string; // YYYY-MM-DD
  symptoms: string[];
  notes?: string;
  steps?: number | "";
  mood?: number | "";
  stress?: number | "";
  sleepHours?: number | "";
  sleepQuality?: number | "";
};

type LabRecord = {
  date: string;
  a1c?: number | "";
  fpg?: number | "";
  ppg?: number | "";
  ldl?: number | "";
  hdl?: number | "";
  tg?: number | "";
  tsh?: number | "";
  ft4?: number | "";
  creatinine?: number | "";
  egfr?: number | "";
  vitD?: number | "";
  vitB12?: number | "";
};

type IntakeV2 = {
  profile: ProfileDrawer;
  schedule: ScheduleDrawer;
  health: HealthDrawer;
};

// ---------------------------
// Constants
// ---------------------------
const TOP_CONCERNS: string[] = [
  "Headache",
  "Back pain",
  "Knee pain",
  "Acidity",
  "Bloating",
  "Constipation",
  "Cough",
  "Cold",
  "Fatigue",
  "Breathlessness",
  "Palpitations",
  "Poor sleep",
  "Low mood",
  "Stress",
];

const CONDITIONS_GRID: string[] = [
  "Hypertension",
  "Diabetes",
  "Thyroid",
  "PCOS/PCOD",
  "GERD/Acidity",
  "Asthma",
  "Allergic rhinitis",
  "Anemia",
  "Chronic pain",
  "Obesity/Overweight",
  "Underweight",
  "Hyperlipidemia",
  "Kidney stone history",
  "Migraine",
  "Depression/Anxiety",
];

const CONTEXT_TOGGLES: string[] = [
  "Smoker",
  "Former Smoker",
  "Non-Smoker",
  "Alcohol (rare)",
  "Alcohol (moderate)",
  "Alcohol (frequent)",
  "Sedentary",
  "Active",
  "Heavy labor",
  "Student",
  "Job (Desk)",
  "Job (Field)",
  "Home-maker",
  "Shift work",
  "Travel days",
  "Sleep schedule issues",
  "Fasting/Religious",
  "Vegetarian",
  "Vegan",
  "All-eater",
  "Egg-only",
  "Caffeine high",
  "Caffeine low",
  "Hydration low",
  "Hydration high",
];

// ---------------------------
// Helpers
// ---------------------------
function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function computeDoshaLabel(d: DoshaMix): string {
  const pairs: Array<[string, number]> = [
    ["Vata", d.vata],
    ["Pitta", d.pitta],
    ["Kapha", d.kapha],
  ];
  pairs.sort((a, b) => b[1] - a[1]);
  const [a, b] = pairs;
  return Math.abs(a[1] - b[1]) <= 1 ? `${a[0]}-${b[0]}` : a[0];
}

// Normalize/migrate any older/partial shapes from localStorage
function normalizeIntake(raw: Partial<IntakeV2> | undefined): IntakeV2 {
  const profile: ProfileDrawer = {
    name: raw?.profile?.name ?? "",
    dob: raw?.profile?.dob ?? "",
    age: raw?.profile?.age ?? "",
    sex: (raw?.profile?.sex as Sex) ?? "",
    heightCm: raw?.profile?.heightCm ?? "",
    weightKg: raw?.profile?.weightKg ?? "",
    locationState: raw?.profile?.locationState ?? "",
    locationCity: raw?.profile?.locationCity ?? "",
    timezone: raw?.profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    dietType: (raw?.profile?.dietType as any) ?? "",
    cuisine: raw?.profile?.cuisine ?? "",
    allergies: raw?.profile?.allergies ?? "",
    intolerances: raw?.profile?.intolerances ?? "",
    preferences: raw?.profile?.preferences ?? "",
    archetype: raw?.profile?.archetype ?? "",
  };

  const schedule: ScheduleDrawer = {
    workDays: raw?.schedule?.workDays ?? "",
    workTimes: raw?.schedule?.workTimes ?? "",
    wakeTime: raw?.schedule?.wakeTime ?? "",
    sleepTime: raw?.schedule?.sleepTime ?? "",
    mealAnchors: {
      breakfast: raw?.schedule?.mealAnchors?.breakfast ?? "",
      lunch: raw?.schedule?.mealAnchors?.lunch ?? "",
      snack: raw?.schedule?.mealAnchors?.snack ?? "",
      dinner: raw?.schedule?.mealAnchors?.dinner ?? "",
    },
    activityWindows: raw?.schedule?.activityWindows ?? "",
  };

  const d: DoshaMix = {
    vata: raw?.health?.dosha?.vata ?? 5,
    pitta: raw?.health?.dosha?.pitta ?? 5,
    kapha: raw?.health?.dosha?.kapha ?? 5,
  };
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

function normalizeToday(raw: Partial<TodayLog> | undefined): TodayLog {
  return {
    date: raw?.date ?? todayISO(),
    symptoms: Array.isArray(raw?.symptoms) ? (raw!.symptoms as string[]) : [],
    notes: raw?.notes ?? "",
    steps: raw?.steps ?? "",
    mood: raw?.mood ?? "",
    stress: raw?.stress ?? "",
    sleepHours: raw?.sleepHours ?? "",
    sleepQuality: raw?.sleepQuality ?? "",
  };
}

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
    <button
      type="button"
      className={`gw-badge ${active ? "is-active" : ""}`}
      onClick={onClick}
      title={label}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="gw-row" style={{ gap: "0.75rem" }}>{children}</div>;
}

function Col({ children, w = "1" }: { children: React.ReactNode; w?: "1" | "2" | "3" | "4" }) {
  const width = w === "1" ? "100%" : w === "2" ? "calc(50% - 0.375rem)" : w === "3" ? "calc(33.333% - 0.5rem)" : "calc(25% - 0.5625rem)";
  return <div style={{ width, minWidth: "260px" }}>{children}</div>;
}

function LabeledInput(props: {
  label: string;
  type?: string;
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="gw-label">
      <span>{props.label}</span>
      <input
        className="gw-input"
        type={props.type ?? "text"}
        value={props.value ?? ""}
        onChange={(e) =>
          props.onChange(
            props.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value
          )
        }
        placeholder={props.placeholder}
        min={props.min}
        max={props.max}
        step={props.step}
      />
    </label>
  );
}

function Slider(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="gw-label">
      <span>
        {props.label}: <b>{props.value}</b>
      </span>
      <input
        className="gw-input"
        type="range"
        min={1}
        max={10}
        step={1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

// ---------------------------
// Main Page
// ---------------------------
export default function HealthForm() {
  const navigate = useNavigate();

  // Ensure owner variable exists before any JSX uses it (prevents crash)
  const owner = useMemo(() => {
    try {
      return isOwner();
    } catch {
      return true;
    }
  }, []);

  // Read Full Form flag safely
  const initialFullForm = useMemo<boolean>(() => {
    try {
      if (typeof getFullForm === "function") return !!getFullForm();
      return !!isFullForm();
    } catch {
      return true;
    }
  }, []);
  const [fullForm, setFullFormState] = useState<boolean>(initialFullForm);

  // Persist whenever toggled
  useEffect(() => {
    try {
      setFullForm(!!fullForm);
    } catch {
      // ignore
    }
  }, [fullForm]);

  // Load & normalize intake/today/labs
  const [intake, setIntake] = useState<IntakeV2>(() =>
    normalizeIntake(loadJSON<Partial<IntakeV2>>(KEY_INTAKE, {}))
  );
  const [today, setToday] = useState<TodayLog>(() =>
    normalizeToday(loadJSON<Partial<TodayLog>>(KEY_TODAY, {}))
  );
  const [labs, setLabs] = useState<LabRecord[]>(() => {
    const raw = loadJSON<any>(KEY_LABS, []);
    return Array.isArray(raw) ? raw : [];
  });

  // One-time migration: if old storage had missing arrays/objects, save normalized back
  useEffect(() => {
    saveJSON(KEY_INTAKE, intake);
    saveJSON(KEY_TODAY, today);
    saveJSON(KEY_LABS, labs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once after initial normalize

  // Derived safe arrays (avoid `.includes` on undefined)
  const conditions = intake.health?.conditions ?? [];
  const symptoms = today.symptoms ?? [];

  // Sync dosha label when sliders change
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

  // Persistors
  const saveIntake = () => saveJSON(KEY_INTAKE, intake);
  const saveToday = () => saveJSON(KEY_TODAY, today);
  const saveLabs = () => saveJSON(KEY_LABS, labs);

  // Context flags (local-only for now)
  const [contextFlags, setContextFlags] = useState<string[]>([]);
  const toggleContext = (label: string) => {
    setContextFlags((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));
  };

  // Toggles with guards
  const toggleSymptom = (label: string) => {
    setToday((prev) => {
      const current = Array.isArray(prev.symptoms) ? prev.symptoms : [];
      const on = current.includes(label);
      const next = on ? current.filter((x) => x !== label) : [...current, label];
      return { ...prev, symptoms: next };
    });
  };

  const toggleCondition = (label: string) => {
    setIntake((prev) => {
      const current = Array.isArray(prev.health?.conditions) ? prev.health!.conditions! : [];
      const on = current.includes(label);
      const next = on ? current.filter((x) => x !== label) : [...current, label];
      return {
        ...prev,
        health: {
          ...(prev.health || { conditions: [] }),
          conditions: next,
          currentMeds: prev.health?.currentMeds ?? "",
          wellbeing: prev.health?.wellbeing ?? { mood: 5, stress: 5, sleepQuality: 5 },
          dosha: prev.health?.dosha ?? { vata: 5, pitta: 5, kapha: 5, label: "Pitta-Vata" },
          labAnchors: prev.health?.labAnchors ?? "A1c, FPG/PPG, Lipids, Thyroid, BP@home",
        },
      };
    });
  };

  // Labs add row
  const blankLab: LabRecord = {
    date: todayISO(),
    a1c: "",
    fpg: "",
    ppg: "",
    ldl: "",
    hdl: "",
    tg: "",
    tsh: "",
    ft4: "",
    creatinine: "",
    egfr: "",
    vitD: "",
    vitB12: "",
  };

  const addLab = () => setLabs((prev) => [...prev, { ...blankLab }]);

  // OwnerBar handlers
  const handleFullOn = () => setFullFormState(true);
  const handleFullOff = () => setFullFormState(false);

  // Navigate to Plan
  const openPlan = () => navigate("/health-plan");

  return (
    <div className="gw-page">
      <div className="gw-tint">
        <div className="gw-row" style={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 className="text-xl">Health Intake</h2>
          <div>
            <button className="gw-btn" onClick={saveIntake} title="Save Intake">
              Save
            </button>
            <button className="gw-btn" onClick={openPlan} style={{ marginLeft: "0.5rem" }}>
              Generate Plan
            </button>
          </div>
        </div>

        {/* OwnerBar under title (owner-only) */}
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

        {/* TODAY — always visible */}
        <SectionCard title="Today (Quick Log)">
          <Row>
            <Col w="2">
              <LabeledInput
                label="Date"
                type="date"
                value={today.date}
                onChange={(v) => setToday((p) => ({ ...p, date: v }))}
              />
            </Col>
            <Col w="2">
              <LabeledInput
                label="Steps"
                type="number"
                value={today.steps ?? ""}
                onChange={(v) => setToday((p) => ({ ...p, steps: v }))}
                min={0}
              />
            </Col>
          </Row>

          <Row>
            <Col w="2">
              <LabeledInput
                label="Notes"
                type="text"
                value={today.notes ?? ""}
                onChange={(v) => setToday((p) => ({ ...p, notes: v }))}
                placeholder="Short note for today…"
              />
            </Col>
            <Col w="2">
              <Row>
                <Col>
                  <LabeledInput
                    label="Sleep (hours)"
                    type="number"
                    value={today.sleepHours ?? ""}
                    onChange={(v) => setToday((p) => ({ ...p, sleepHours: v }))}
                    min={0}
                    step={0.5}
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Sleep Quality (1–10)"
                    type="number"
                    value={today.sleepQuality ?? ""}
                    onChange={(v) => setToday((p) => ({ ...p, sleepQuality: v }))}
                    min={1}
                    max={10}
                  />
                </Col>
              </Row>
            </Col>
          </Row>

          <div style={{ marginTop: "0.5rem" }}>
            <div className="gw-label"><span>Symptoms (tap to toggle)</span></div>
            <div className="gw-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              {TOP_CONCERNS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={(symptoms).includes(c)}
                  onClick={() => toggleSymptom(c)}
                />
              ))}
            </div>
          </div>

          <Row>
            <Col w="2">
              <LabeledInput
                label="Mood (1–10)"
                type="number"
                value={today.mood ?? ""}
                onChange={(v) => setToday((p) => ({ ...p, mood: v }))}
                min={1}
                max={10}
              />
            </Col>
            <Col w="2">
              <LabeledInput
                label="Stress (1–10)"
                type="number"
                value={today.stress ?? ""}
                onChange={(v) => setToday((p) => ({ ...p, stress: v }))}
                min={1}
                max={10}
              />
            </Col>
          </Row>

          <div style={{ marginTop: "0.5rem" }}>
            <button className="gw-btn" onClick={saveToday}>Save Today</button>
          </div>
        </SectionCard>

        {/* PERIODIC LABS — always visible */}
        <SectionCard
          title="Periodic Labs"
          right={
            <button className="gw-btn" onClick={addLab} title="Add Lab Row">
              + Add
            </button>
          }
        >
          {labs.length === 0 && (
            <div className="gw-tint" style={{ padding: "0.75rem", borderRadius: "0.5rem" }}>
              No lab records yet. Click “+ Add” to add your first entry.
            </div>
          )}

          {labs.map((r, idx) => (
            <div key={idx} className="gw-card" style={{ marginBottom: "0.75rem" }}>
              <Row>
                <Col>
                  <LabeledInput
                    label="Date"
                    type="date"
                    value={r.date}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], date: v };
                        return copy;
                      })
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="HbA1c (%)"
                    type="number"
                    value={r.a1c ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], a1c: v };
                        return copy;
                      })
                    }
                    step={0.1}
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="FPG (mg/dL)"
                    type="number"
                    value={r.fpg ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], fpg: v };
                        return copy;
                      })
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="PPG (mg/dL)"
                    type="number"
                    value={r.ppg ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], ppg: v };
                        return copy;
                      })
                    }
                  />
                </Col>
              </Row>

              <Row>
                <Col>
                  <LabeledInput
                    label="LDL"
                    type="number"
                    value={r.ldl ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], ldl: v };
                        return copy;
                      })
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="HDL"
                    type="number"
                    value={r.hdl ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], hdl: v };
                        return copy;
                      })
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Triglycerides"
                    type="number"
                    value={r.tg ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], tg: v };
                        return copy;
                      })
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Creatinine"
                    type="number"
                    value={r.creatinine ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], creatinine: v };
                        return copy;
                      })
                    }
                    step={0.1}
                  />
                </Col>
              </Row>

              <Row>
                <Col>
                  <LabeledInput
                    label="eGFR"
                    type="number"
                    value={r.egfr ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], egfr: v };
                        return copy;
                      })
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="TSH"
                    type="number"
                    value={r.tsh ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], tsh: v };
                        return copy;
                      })
                    }
                    step={0.01}
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="FT4"
                    type="number"
                    value={r.ft4 ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], ft4: v };
                        return copy;
                      })
                    }
                    step={0.01}
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Vitamin D"
                    type="number"
                    value={r.vitD ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], vitD: v };
                        return copy;
                      })
                    }
                  />
                </Col>
              </Row>

              <Row>
                <Col>
                  <LabeledInput
                    label="Vitamin B12"
                    type="number"
                    value={r.vitB12 ?? ""}
                    onChange={(v) =>
                      setLabs((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], vitB12: v };
                        return copy;
                      })
                    }
                  />
                </Col>
              </Row>
            </div>
          ))}

          <div>
            <button className="gw-btn" onClick={saveLabs}>Save Labs</button>
          </div>
        </SectionCard>

        {/* ADVANCED DRAWERS (visible only when fullForm === true) */}
        {fullForm && (
          <>
            <SectionCard title="Profile" right={<span className="gw-badge">Owner View</span>}>
              <div id="section-profile" />
              <Row>
                <Col w="2">
                  <LabeledInput
                    label="Name"
                    value={intake.profile.name}
                    onChange={(v) => setIntake((p) => ({ ...p, profile: { ...p.profile, name: v } }))}
                  />
                </Col>
                <Col w="2">
                  <LabeledInput
                    label="DOB"
                    type="date"
                    value={intake.profile.dob}
                    onChange={(v) => setIntake((p) => ({ ...p, profile: { ...p.profile, dob: v } }))}
                  />
                </Col>
              </Row>

              <Row>
                <Col>
                  <LabeledInput
                    label="Age"
                    type="number"
                    value={intake.profile.age ?? ""}
                    onChange={(v) => setIntake((p) => ({ ...p, profile: { ...p.profile, age: v } }))}
                    min={0}
                    max={120}
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Sex"
                    value={intake.profile.sex}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, sex: v as Sex } }))
                    }
                    placeholder="Male / Female / Other"
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Height (cm)"
                    type="number"
                    value={intake.profile.heightCm ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, heightCm: v } }))
                    }
                    min={0}
                    step={0.5}
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Weight (kg)"
                    type="number"
                    value={intake.profile.weightKg ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, weightKg: v } }))
                    }
                    min={0}
                    step={0.1}
                  />
                </Col>
              </Row>

              <Row>
                <Col>
                  <LabeledInput
                    label="State"
                    value={intake.profile.locationState ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, locationState: v } }))
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="City"
                    value={intake.profile.locationCity ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, locationCity: v } }))
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Timezone"
                    value={intake.profile.timezone ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, timezone: v } }))
                    }
                  />
                </Col>
              </Row>

              <Row>
                <Col>
                  <LabeledInput
                    label="Diet Type"
                    value={intake.profile.dietType ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, dietType: v } }))
                    }
                    placeholder="Vegetarian / Vegan / All-eater / Egg-only"
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Cuisine"
                    value={intake.profile.cuisine ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, cuisine: v } }))
                    }
                    placeholder="e.g., Gujarati, South Indian, North Indian…"
                  />
                </Col>
              </Row>

              <Row>
                <Col>
                  <LabeledInput
                    label="Allergies"
                    value={intake.profile.allergies ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, allergies: v } }))
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Intolerances"
                    value={intake.profile.intolerances ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, intolerances: v } }))
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Preferences"
                    value={intake.profile.preferences ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, preferences: v } }))
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Archetype"
                    value={intake.profile.archetype ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, profile: { ...p.profile, archetype: v } }))
                    }
                    placeholder="Student / Desk / Field / Shift / Homemaker…"
                  />
                </Col>
              </Row>

              <div style={{ marginTop: "0.5rem" }}>
                <button className="gw-btn" onClick={saveIntake}>Save Profile</button>
              </div>
            </SectionCard>

            <SectionCard title="Schedule" right={<span className="gw-badge">Owner View</span>}>
              <div id="section-schedule" />
              <Row>
                <Col>
                  <LabeledInput
                    label="Work Days"
                    value={intake.schedule.workDays ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, schedule: { ...p.schedule, workDays: v } }))
                    }
                    placeholder="e.g., Mon–Fri"
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Work Times"
                    value={intake.schedule.workTimes ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, schedule: { ...p.schedule, workTimes: v } }))
                    }
                    placeholder="e.g., 10:00–18:00"
                  />
                </Col>
              </Row>

              <Row>
                <Col>
                  <LabeledInput
                    label="Wake Time"
                    type="time"
                    value={intake.schedule.wakeTime ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, schedule: { ...p.schedule, wakeTime: v } }))
                    }
                  />
                </Col>
                <Col>
                  <LabeledInput
                    label="Sleep Time"
                    type="time"
                    value={intake.schedule.sleepTime ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, schedule: { ...p.schedule, sleepTime: v } }))
                    }
                  />
                </Col>
              </Row>

              <SectionCard title="Meal Anchors">
                <Row>
                  <Col>
                    <LabeledInput
                      label="Breakfast"
                      type="time"
                      value={intake.schedule.mealAnchors?.breakfast ?? ""}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          schedule: {
                            ...p.schedule,
                            mealAnchors: { ...p.schedule.mealAnchors, breakfast: v },
                          },
                        }))
                      }
                    />
                  </Col>
                  <Col>
                    <LabeledInput
                      label="Lunch"
                      type="time"
                      value={intake.schedule.mealAnchors?.lunch ?? ""}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          schedule: {
                            ...p.schedule,
                            mealAnchors: { ...p.schedule.mealAnchors, lunch: v },
                          },
                        }))
                      }
                    />
                  </Col>
                  <Col>
                    <LabeledInput
                      label="Snack"
                      type="time"
                      value={intake.schedule.mealAnchors?.snack ?? ""}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          schedule: {
                            ...p.schedule,
                            mealAnchors: { ...p.schedule.mealAnchors, snack: v },
                          },
                        }))
                      }
                    />
                  </Col>
                  <Col>
                    <LabeledInput
                      label="Dinner"
                      type="time"
                      value={intake.schedule.mealAnchors?.dinner ?? ""}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          schedule: {
                            ...p.schedule,
                            mealAnchors: { ...p.schedule.mealAnchors, dinner: v },
                          },
                        }))
                      }
                    />
                  </Col>
                </Row>
              </SectionCard>

              <Row>
                <Col w="2">
                  <LabeledInput
                    label="Activity Windows"
                    value={intake.schedule.activityWindows ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({
                        ...p,
                        schedule: { ...p.schedule, activityWindows: v },
                      }))
                    }
                    placeholder="e.g., 07:00–07:20, 17:30–18:00"
                  />
                </Col>
              </Row>

              <div style={{ marginTop: "0.5rem" }}>
                <button className="gw-btn" onClick={saveIntake}>Save Schedule</button>
              </div>
            </SectionCard>

            <SectionCard title="Health (Conditions, Wellbeing, Dosha)" right={<span className="gw-badge">Owner View</span>}>
              <div id="section-health" />
              {/* Conditions */}
              <div className="gw-label"><span>Conditions (non-diagnostic tags)</span></div>
              <div className="gw-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                {CONDITIONS_GRID.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={(conditions).includes(c)}
                    onClick={() => toggleCondition(c)}
                  />
                ))}
              </div>

              {/* Context toggles */}
              <div style={{ marginTop: "0.75rem" }} />
              <div className="gw-label"><span>Context (lifestyle & risks)</span></div>
              <div className="gw-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                {CONTEXT_TOGGLES.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={contextFlags.includes(c)}
                    onClick={() => toggleContext(c)}
                  />
                ))}
              </div>

              {/* Current meds */}
              <Row>
                <Col w="2">
                  <LabeledInput
                    label="Current Meds / Doses (optional)"
                    value={intake.health?.currentMeds ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, health: { ...(p.health || { conditions: [] }), currentMeds: v } }))
                    }
                    placeholder="e.g., Metformin 500mg OD"
                  />
                </Col>
              </Row>

              {/* Wellbeing sliders */}
              <SectionCard title="Wellbeing (1–10)">
                <Row>
                  <Col>
                    <LabeledInput
                      label="Mood"
                      type="number"
                      value={intake.health?.wellbeing?.mood ?? 5}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          health: {
                            ...(p.health || { conditions: [] }),
                            wellbeing: { ...(p.health?.wellbeing || {}), mood: v },
                          },
                        }))
                      }
                      min={1}
                      max={10}
                    />
                  </Col>
                  <Col>
                    <LabeledInput
                      label="Stress"
                      type="number"
                      value={intake.health?.wellbeing?.stress ?? 5}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          health: {
                            ...(p.health || { conditions: [] }),
                            wellbeing: { ...(p.health?.wellbeing || {}), stress: v },
                          },
                        }))
                      }
                      min={1}
                      max={10}
                    />
                  </Col>
                  <Col>
                    <LabeledInput
                      label="Sleep Quality"
                      type="number"
                      value={intake.health?.wellbeing?.sleepQuality ?? 5}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          health: {
                            ...(p.health || { conditions: [] }),
                            wellbeing: { ...(p.health?.wellbeing || {}), sleepQuality: v },
                          },
                        }))
                      }
                      min={1}
                      max={10}
                    />
                  </Col>
                </Row>
              </SectionCard>

              {/* Dosha sliders */}
              <SectionCard title={`Ayurveda Dosha Profile ${intake.health?.dosha?.label ? `— ${intake.health.dosha.label}` : ""}`}>
                <Row>
                  <Col>
                    <Slider
                      label="Vata"
                      value={intake.health?.dosha?.vata ?? 5}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          health: { ...(p.health || { conditions: [] }), dosha: { ...(p.health?.dosha || { pitta: 5, kapha: 5, vata: 5 }), vata: v } },
                        }))
                      }
                    />
                  </Col>
                  <Col>
                    <Slider
                      label="Pitta"
                      value={intake.health?.dosha?.pitta ?? 5}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          health: { ...(p.health || { conditions: [] }), dosha: { ...(p.health?.dosha || { vata: 5, kapha: 5, pitta: 5 }), pitta: v } },
                        }))
                      }
                    />
                  </Col>
                  <Col>
                    <Slider
                      label="Kapha"
                      value={intake.health?.dosha?.kapha ?? 5}
                      onChange={(v) =>
                        setIntake((p) => ({
                          ...p,
                          health: { ...(p.health || { conditions: [] }), dosha: { ...(p.health?.dosha || { vata: 5, pitta: 5, kapha: 5 }), kapha: v } },
                        }))
                      }
                    />
                  </Col>
                </Row>
              </SectionCard>

              {/* Lab anchors */}
              <Row>
                <Col w="2">
                  <LabeledInput
                    label="Lab Anchors You Track"
                    value={intake.health?.labAnchors ?? ""}
                    onChange={(v) =>
                      setIntake((p) => ({ ...p, health: { ...(p.health || { conditions: [] }), labAnchors: v } }))
                    }
                    placeholder="e.g., A1c, FPG/PPG, Lipids, Thyroid, BP@home"
                  />
                </Col>
              </Row>

              <div style={{ marginTop: "0.5rem" }}>
                <button className="gw-btn" onClick={saveIntake}>Save Health</button>
              </div>
            </SectionCard>
          </>
        )}

        {/* Footer actions */}
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
