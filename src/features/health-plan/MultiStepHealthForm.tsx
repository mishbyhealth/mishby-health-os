import React from "react";

/**
 * MultiStepHealthForm (V4)
 * - Implements your "Health App Feature Extraction (Generic) – 1. HEALTH INTAKE FORM"
 * - Returns a structured intake object via onComplete(intake)
 * - Neutral, non-clinical. Validations are gentle and UI is simple, wide, and readable.
 */

type Sex = "male" | "female" | "other";
type DetailLevel = "basic" | "standard" | "advanced";
type ActivityLevel = "light" | "moderate";

type ProfileBasics = {
  age: number | "";
  sex: Sex | "";
  height_cm: number | ""; // Accept cm only in form; unit toggles can be added later
  weight_kg: number | ""; // Accept kg only in form; unit toggles can be added later
};

type ContactLocale = {
  timezone: string;
  language?: string;
  region_state?: string;
};

type DiagnosedCondition = {
  system: string; // e.g., "Renal", "Cardiac", "Endocrine", "Urology", "GI"
  condition: string; // e.g., "CKD", "Hypertension", "Diabetes", "Prostate symptoms"
  stage?: string; // e.g., "CKD-3", "NYHA-II", "control:moderate"
};

type RecentLabs = {
  potassium_mmol_L?: number | "";
  sodium_mmol_L?: number | "";
  creatinine_mg_dL?: number | "";
  eGFR?: number | "";
  fasting_glucose_mg_dL?: number | "";
  A1c_percent?: number | "";
  LDL?: number | "";
  BP_avg_systolic?: number | "";
  BP_avg_diastolic?: number | "";
};

type Medications = {
  classes: string[]; // e.g., ACEi/ARB, diuretics, beta-blocker, CCB, statin, insulin/Orals, alpha-blocker
  notes?: string;
};

type Allergies = {
  items: string[];
  notes?: string;
};

type DietaryPattern = {
  pattern: string[]; // veg, lacto-veg, eggetarian, non-veg, vegan, jain, swaminarayan, etc.
  religious_rules?: string[];
  fasting_practices?: string[];
  dislikes?: string[];
};

type FoodEnvironment = {
  cuisine_pref: string[]; // e.g., Gujarati, South Indian, Punjabi, Rajasthani, Maharashtrian, Bengali, International
  budget_level?: "low" | "mid" | "high";
  cook_skill?: "beginner" | "intermediate" | "advanced";
  prep_time_min_per_meal?: number | "";
};

type ActivityTolerance = {
  level?: ActivityLevel | "";
  step_goal?: number | "";
  posture_issues?: string[]; // e.g., knee pain, back pain, balance issues
};

type HydrationGuidance = {
  fluid_cap_L_per_day?: number | ""; // physician-advised
};

type TimeWindow = { start: string; end: string };
type DailyTimeWindows = {
  wake_time?: string;
  sleep_time?: string;
  meal_windows?: TimeWindow[]; // optional per-meal time ranges
  work_slots?: TimeWindow[];
  prayer_slots?: string[]; // simple HH:mm entries
};

type MonitoringDevices = string[]; // e.g., home BP, glucose meter, weight scale

type PlanPreference = {
  detail_level?: DetailLevel | "";
  veg_only?: boolean;
  spice_tolerance?: number | ""; // 0–10
};

type IntakeV4 = {
  profile_basics: ProfileBasics;
  contact_locale: ContactLocale;
  diagnosed_conditions: DiagnosedCondition[];
  diagnosed_conditions_free_text?: string;
  recent_labs?: RecentLabs;
  medications?: Medications;
  allergies?: Allergies;
  dietary_pattern?: DietaryPattern;
  food_environment?: FoodEnvironment;
  activity_tolerance?: ActivityTolerance;
  hydration_guidance?: HydrationGuidance;
  daily_time_windows?: DailyTimeWindows;
  monitoring_devices?: MonitoringDevices;
  plan_preference?: PlanPreference;
  meals_per_day: number; // 2–6
  meal_times: string[]; // HH:mm x meals_per_day
};

export default function MultiStepHealthForm({
  onComplete,
}: {
  onComplete: (intake: IntakeV4) => void;
}) {
  const [step, setStep] = React.useState<number>(1);

  const [profile, setProfile] = React.useState<ProfileBasics>({
    age: "",
    sex: "",
    height_cm: "",
    weight_kg: "",
  });

  const [locale, setLocale] = React.useState<ContactLocale>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    language: "en",
    region_state: "",
  });

  const [conditions, setConditions] = React.useState<DiagnosedCondition[]>([]);
  const [conditionsFree, setConditionsFree] = React.useState<string>("");

  const [labs, setLabs] = React.useState<RecentLabs>({});

  const [meds, setMeds] = React.useState<Medications>({ classes: [], notes: "" });
  const [allergies, setAllergies] = React.useState<Allergies>({ items: [], notes: "" });

  const [diet, setDiet] = React.useState<DietaryPattern>({
    pattern: [],
    religious_rules: [],
    fasting_practices: [],
    dislikes: [],
  });

  const [env, setEnv] = React.useState<FoodEnvironment>({
    cuisine_pref: [],
    budget_level: "mid",
    cook_skill: "beginner",
    prep_time_min_per_meal: 30,
  });

  const [activity, setActivity] = React.useState<ActivityTolerance>({
    level: "light",
    step_goal: 4000,
    posture_issues: [],
  });

  const [hydration, setHydration] = React.useState<HydrationGuidance>({
    fluid_cap_L_per_day: "",
  });

  const [windows, setWindows] = React.useState<DailyTimeWindows>({
    wake_time: "06:30",
    sleep_time: "22:30",
    meal_windows: [],
    work_slots: [],
    prayer_slots: [],
  });

  const [devices, setDevices] = React.useState<MonitoringDevices>([]);

  const [pref, setPref] = React.useState<PlanPreference>({
    detail_level: "standard",
    veg_only: false,
    spice_tolerance: 5,
  });

  const [mealsPerDay, setMealsPerDay] = React.useState<number>(3);
  const [mealTimes, setMealTimes] = React.useState<string[]>(["08:00", "13:00", "19:30"]);

  // --- Helpers ---
  const addCondition = () =>
    setConditions((prev) => [...prev, { system: "", condition: "", stage: "" }]);

  const updateCondition = (idx: number, patch: Partial<DiagnosedCondition>) =>
    setConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const removeCondition = (idx: number) =>
    setConditions((prev) => prev.filter((_, i) => i !== idx));

  const changeMealsPerDay = (n: number) => {
    const clamped = Math.min(6, Math.max(2, n));
    setMealsPerDay(clamped);
    setMealTimes((prev) => {
      const next = [...prev];
      if (clamped > next.length) {
        while (next.length < clamped) next.push("12:00");
      } else if (clamped < next.length) {
        next.length = clamped;
      }
      return next;
    });
  };

  const setMealTimeAt = (idx: number, v: string) =>
    setMealTimes((prev) => prev.map((t, i) => (i === idx ? v : t)));

  // --- Validation ---
  const basicValid =
    typeof profile.age === "number" &&
    profile.age >= 1 &&
    profile.age <= 120 &&
    (profile.sex === "male" || profile.sex === "female" || profile.sex === "other") &&
    typeof profile.height_cm === "number" &&
    profile.height_cm >= 50 &&
    profile.height_cm <= 250 &&
    typeof profile.weight_kg === "number" &&
    profile.weight_kg >= 10 &&
    profile.weight_kg <= 300 &&
    !!locale.timezone;

  const handleSubmit = () => {
    if (!basicValid) return alert("Please complete Profile Basics correctly.");

    const intake: IntakeV4 = {
      profile_basics: profile as Required<ProfileBasics>,
      contact_locale: locale,
      diagnosed_conditions: conditions.filter((c) => c.system && c.condition),
      diagnosed_conditions_free_text: conditionsFree || undefined,
      recent_labs: labs,
      medications: meds.classes.length || meds.notes ? meds : undefined,
      allergies: allergies.items.length || allergies.notes ? allergies : undefined,
      dietary_pattern: diet,
      food_environment: env,
      activity_tolerance: activity,
      hydration_guidance: hydration,
      daily_time_windows: windows,
      monitoring_devices: devices,
      plan_preference: pref,
      meals_per_day: mealsPerDay,
      meal_times: mealTimes,
    };

    onComplete(intake);
  };

  // --- Simple step layout ---
  const next = () => setStep((s) => Math.min(10, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="space-y-6">
      <Progress step={step} total={10} />

      {step === 1 && (
        <Card title="Profile Basics (Required)">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              label="Age (years)"
              value={profile.age}
              onChange={(v) => setProfile({ ...profile, age: v })}
              min={1}
              max={120}
              required
            />
            <Select
              label="Sex"
              value={profile.sex}
              onChange={(v) => setProfile({ ...profile, sex: v as Sex })}
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ]}
              required
            />
            <NumberInput
              label="Height (cm)"
              value={profile.height_cm}
              onChange={(v) => setProfile({ ...profile, height_cm: v })}
              min={50}
              max={250}
              required
            />
            <NumberInput
              label="Weight (kg)"
              value={profile.weight_kg}
              onChange={(v) => setProfile({ ...profile, weight_kg: v })}
              min={10}
              max={300}
              required
            />
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="Contact & Locale">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Timezone"
              value={locale.timezone}
              onChange={(v) => setLocale({ ...locale, timezone: v })}
              required
            />
            <Input
              label="Language"
              value={locale.language || ""}
              onChange={(v) => setLocale({ ...locale, language: v })}
            />
            <Input
              label="Region / State"
              value={locale.region_state || ""}
              onChange={(v) => setLocale({ ...locale, region_state: v })}
            />
          </div>
          <p className="mt-2 text-xs opacity-70">Auto-detected timezone can be edited.</p>
        </Card>
      )}

      {step === 3 && (
        <Card title="Diagnosed Conditions & Staging">
          <div className="space-y-3">
            {conditions.map((c, idx) => (
              <div key={idx} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-3">
                <Input
                  label="Organ System (e.g., Renal, Cardiac)"
                  value={c.system}
                  onChange={(v) => updateCondition(idx, { system: v })}
                />
                <Input
                  label="Condition (e.g., CKD, Hypertension)"
                  value={c.condition}
                  onChange={(v) => updateCondition(idx, { condition: v })}
                />
                <Input
                  label="Stage / Class (e.g., CKD-3, NYHA-II)"
                  value={c.stage || ""}
                  onChange={(v) => updateCondition(idx, { stage: v })}
                />
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1 text-xs"
                    onClick={() => removeCondition(idx)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm"
              onClick={addCondition}
            >
              + Add Condition
            </button>

            <Textarea
              label="Free-text notes (optional)"
              value={conditionsFree}
              onChange={setConditionsFree}
              placeholder="Any additional context"
            />
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card title="Recent Labs (last 30–90 days) — Optional">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput label="Potassium (mmol/L)" value={labs.potassium_mmol_L ?? ""} onChange={(v) => setLabs({ ...labs, potassium_mmol_L: v })} />
            <NumberInput label="Sodium (mmol/L)" value={labs.sodium_mmol_L ?? ""} onChange={(v) => setLabs({ ...labs, sodium_mmol_L: v })} />
            <NumberInput label="Creatinine (mg/dL)" value={labs.creatinine_mg_dL ?? ""} onChange={(v) => setLabs({ ...labs, creatinine_mg_dL: v })} />
            <NumberInput label="eGFR" value={labs.eGFR ?? ""} onChange={(v) => setLabs({ ...labs, eGFR: v })} />
            <NumberInput label="Fasting Glucose (mg/dL)" value={labs.fasting_glucose_mg_dL ?? ""} onChange={(v) => setLabs({ ...labs, fasting_glucose_mg_dL: v })} />
            <NumberInput label="A1c (%)" value={labs.A1c_percent ?? ""} onChange={(v) => setLabs({ ...labs, A1c_percent: v })} />
            <NumberInput label="LDL" value={labs.LDL ?? ""} onChange={(v) => setLabs({ ...labs, LDL: v })} />
            <NumberInput label="BP Avg Systolic" value={labs.BP_avg_systolic ?? ""} onChange={(v) => setLabs({ ...labs, BP_avg_systolic: v })} />
            <NumberInput label="BP Avg Diastolic" value={labs.BP_avg_diastolic ?? ""} onChange={(v) => setLabs({ ...labs, BP_avg_diastolic: v })} />
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card title="Medications & Allergies — Optional">
          <TagMulti
            label="Medication Classes"
            value={meds.classes}
            onChange={(arr) => setMeds({ ...meds, classes: arr })}
            placeholder="e.g., ACEi/ARB, diuretics, beta-blocker"
          />
          <Textarea
            label="Medication notes (brand/dose/time) — optional"
            value={meds.notes || ""}
            onChange={(v) => setMeds({ ...meds, notes: v })}
          />
          <TagMulti
            label="Allergies / Intolerances"
            value={allergies.items}
            onChange={(arr) => setAllergies({ ...allergies, items: arr })}
            placeholder="e.g., peanut, lactose, gluten"
          />
          <Textarea
            label="Allergy notes (optional)"
            value={allergies.notes || ""}
            onChange={(v) => setAllergies({ ...allergies, notes: v })}
          />
        </Card>
      )}

      {step === 6 && (
        <Card title="Dietary Pattern & Food Environment — Optional">
          <TagMulti
            label="Dietary pattern"
            value={diet.pattern || []}
            onChange={(arr) => setDiet({ ...diet, pattern: arr })}
            placeholder="veg, lacto-veg, eggetarian, non-veg, vegan, jain, swaminarayan"
          />
          <TagMulti
            label="Religious/Cultural rules (optional)"
            value={diet.religious_rules || []}
            onChange={(arr) => setDiet({ ...diet, religious_rules: arr })}
            placeholder="e.g., no onion/garlic, sattvic"
          />
          <TagMulti
            label="Fasting practices (optional)"
            value={diet.fasting_practices || []}
            onChange={(arr) => setDiet({ ...diet, fasting_practices: arr })}
            placeholder="e.g., Ekadashi, Navratri"
          />
          <TagMulti
            label="Disliked foods (optional)"
            value={diet.dislikes || []}
            onChange={(arr) => setDiet({ ...diet, dislikes: arr })}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TagMulti
              label="Cuisine preferences"
              value={env.cuisine_pref}
              onChange={(arr) => setEnv({ ...env, cuisine_pref: arr })}
              placeholder="Gujarati, South Indian, Punjabi, etc."
            />
            <Select
              label="Budget"
              value={env.budget_level || "mid"}
              onChange={(v) => setEnv({ ...env, budget_level: v as "low" | "mid" | "high" })}
              options={[
                { label: "Low", value: "low" },
                { label: "Mid", value: "mid" },
                { label: "High", value: "high" },
              ]}
            />
            <Select
              label="Cooking skill"
              value={env.cook_skill || "beginner"}
              onChange={(v) => setEnv({ ...env, cook_skill: v as "beginner" | "intermediate" | "advanced" })}
              options={[
                { label: "Beginner", value: "beginner" },
                { label: "Intermediate", value: "intermediate" },
                { label: "Advanced", value: "advanced" },
              ]}
            />
            <NumberInput
              label="Prep time per meal (min)"
              value={env.prep_time_min_per_meal ?? ""}
              onChange={(v) => setEnv({ ...env, prep_time_min_per_meal: v })}
              min={0}
              max={240}
            />
          </div>
        </Card>
      )}

      {step === 7 && (
        <Card title="Activity & Hydration — Optional">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Activity tolerance"
              value={activity.level || ""}
              onChange={(v) => setActivity({ ...activity, level: v as ActivityLevel })}
              options={[
                { label: "Light", value: "light" },
                { label: "Moderate", value: "moderate" },
              ]}
            />
            <NumberInput
              label="Step goal (per day)"
              value={activity.step_goal ?? ""}
              onChange={(v) => setActivity({ ...activity, step_goal: v })}
              min={500}
              max={30000}
            />
            <TagMulti
              label="Posture issues (optional)"
              value={activity.posture_issues || []}
              onChange={(arr) => setActivity({ ...activity, posture_issues: arr })}
              placeholder="e.g., knee pain, back pain"
            />
          </div>

          <NumberInput
            label="Physician-advised fluid cap (L/day)"
            value={hydration.fluid_cap_L_per_day ?? ""}
            onChange={(v) => setHydration({ fluid_cap_L_per_day: v })}
            min={0.5}
            max={5}
          />
        </Card>
      )}

      {step === 8 && (
        <Card title="Daily Time Windows & Monitoring — Optional">
          <div className="grid gap-4 sm:grid-cols-2">
            <TimeInput
              label="Wake time"
              value={windows.wake_time || ""}
              onChange={(v) => setWindows({ ...windows, wake_time: v })}
            />
            <TimeInput
              label="Sleep time"
              value={windows.sleep_time || ""}
              onChange={(v) => setWindows({ ...windows, sleep_time: v })}
            />
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Meal windows (optional)</h4>
            <MealWindowsEditor
              windows={windows.meal_windows || []}
              setWindows={(list) => setWindows({ ...windows, meal_windows: list })}
            />
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Work slots (optional)</h4>
            <TimeRangeList
              value={windows.work_slots || []}
              onChange={(list) => setWindows({ ...windows, work_slots: list })}
            />
          </div>

          <TagMulti
            label="Prayer slots (HH:mm, optional)"
            value={windows.prayer_slots || []}
            onChange={(arr) => setWindows({ ...windows, prayer_slots: arr })}
            placeholder="e.g., 06:00, 18:30"
          />

          <TagMulti
            label="Monitoring devices"
            value={devices}
            onChange={setDevices}
            placeholder="home BP, glucose meter, weight scale"
          />
        </Card>
      )}

      {step === 9 && (
        <Card title="Plan Preferences & Meals">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Detail level"
              value={pref.detail_level || "standard"}
              onChange={(v) => setPref({ ...pref, detail_level: v as DetailLevel })}
              options={[
                { label: "Basic", value: "basic" },
                { label: "Standard", value: "standard" },
                { label: "Advanced", value: "advanced" },
              ]}
            />
            <Checkbox
              label="Veg-only"
              checked={!!pref.veg_only}
              onChange={(v) => setPref({ ...pref, veg_only: v })}
            />
            <NumberInput
              label="Spice tolerance (0–10)"
              value={pref.spice_tolerance ?? ""}
              onChange={(v) => setPref({ ...pref, spice_tolerance: v })}
              min={0}
              max={10}
            />
          </div>

          <div className="mt-4">
            <NumberInput
              label="Meals per day (2–6)"
              value={mealsPerDay}
              onChange={(v) => changeMealsPerDay(Number(v || 0))}
              min={2}
              max={6}
              required
            />
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: mealsPerDay }).map((_, i) => (
                <TimeInput
                  key={i}
                  label={`Meal ${i + 1} time (24h)`}
                  value={mealTimes[i] || "12:00"}
                  onChange={(v) => setMealTimeAt(i, v)}
                />
              ))}
            </div>
            <p className="mt-2 text-xs opacity-70">
              Times use 24-hour format (e.g., 07:30, 14:15).
            </p>
          </div>
        </Card>
      )}

      {step === 10 && (
        <Card title="Review & Submit">
          <p className="text-sm opacity-80">
            Review your entries and submit to generate a neutral daily/weekly plan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Age: {profile.age || "-"}</Badge>
            <Badge>Sex: {profile.sex || "-"}</Badge>
            <Badge>Height: {profile.height_cm || "-"} cm</Badge>
            <Badge>Weight: {profile.weight_kg || "-"} kg</Badge>
            <Badge>TZ: {locale.timezone || "-"}</Badge>
            <Badge>Meals/day: {mealsPerDay}</Badge>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          className="rounded-xl border px-4 py-2 disabled:opacity-50"
          disabled={step === 1}
        >
          Back
        </button>
        {step < 10 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-xl border px-4 py-2"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl border px-4 py-2"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Small UI primitives (no external deps) ---------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 p-4 md:p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-sm font-medium">Step {step} of {total}</span>
        <span className="text-sm">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-2" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}{required ? " *" : ""}</span>
      <input
        className="w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  required,
}: {
  label: string;
  value: number | "" | undefined;
  onChange: (v: number | "") => void;
  min?: number;
  max?: number;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}{required ? " *" : ""}</span>
      <input
        type="number"
        className="w-full rounded-xl border px-3 py-2"
        value={value ?? ""}
        onChange={(e) => {
          const s = e.target.value;
          onChange(s === "" ? "" : Number(s));
        }}
        min={min}
        max={max}
      />
    </label>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        type="time"
        className="w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string | number | readonly string[] | undefined;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}{required ? " *" : ""}</span>
      <select
        className="w-full rounded-xl border px-3 py-2"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <textarea
        className="min-h-[80px] w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TagMulti({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (arr: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = React.useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setInput("");
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  return (
    <div>
      <div className="mb-1 text-sm font-medium">{label}</div>
      <div className="flex flex-wrap gap-2">
        {value.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            {v}
            <button onClick={() => remove(i)} aria-label="remove" className="opacity-60">✕</button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
        />
        <button type="button" onClick={add} className="rounded-xl border px-3 py-2 text-sm">
          Add
        </button>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs">{children}</span>;
}

function TimeRangeList({
  value,
  onChange,
}: {
  value: TimeWindow[];
  onChange: (list: TimeWindow[]) => void;
}) {
  const add = () => onChange([...(value || []), { start: "09:00", end: "17:00" }]);
  const update = (idx: number, key: "start" | "end", v: string) =>
    onChange(value.map((tw, i) => (i === idx ? { ...tw, [key]: v } : tw)));
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      {(value || []).map((tw, i) => (
        <div key={i} className="grid items-end gap-3 sm:grid-cols-3">
          <TimeInput label="Start" value={tw.start} onChange={(v) => update(i, "start", v)} />
          <TimeInput label="End" value={tw.end} onChange={(v) => update(i, "end", v)} />
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={add}>
        + Add slot
      </button>
    </div>
  );
}

function MealWindowsEditor({
  windows,
  setWindows,
}: {
  windows: TimeWindow[];
  setWindows: (list: TimeWindow[]) => void;
}) {
  return <TimeRangeList value={windows} onChange={setWindows} />;
}
