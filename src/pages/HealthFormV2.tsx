// src/pages/HealthFormV2.tsx — V2.9
// Adds a 5th tab "Review" that loads ./formv2/Review.tsx if present.
// Everything else unchanged: autosave, Edit/Save/Back, bold borders, small-page architecture.

import React from "react";

const DRAFT_KEY = "glowell:draft:v2.2"; // keep stable

// ---------------- Types ----------------
type Sex = "Male" | "Female" | "Other" | "";
type DietType = "Vegan" | "Vegetarian" | "Eggetarian" | "Non-Vegetarian" | "All Eater" | "";
type MaritalStatus = "Bachelor" | "Married" | "Unmarried" | "Widow" | "Divorce" | "Other" | "";
type OccCategory = "Students" | "Employed" | "Business" | "Skilled" | "Non-working & Others" | "";
type PageKey = "General" | "Identity" | "Lifestyle" | "Medical" | "Review";

const PAGES: PageKey[] = ["General", "Identity", "Lifestyle", "Medical", "Review"];

// Bold page border colors
const PAGE_BORDER: Record<PageKey, string> = {
  General: "#059669",   // teal-green
  Identity: "#2563eb",  // blue
  Lifestyle: "#ea580c", // orange
  Medical: "#db2777",   // pink
  Review:  "#7c3aed",   // violet
};

// Display labels
const PAGE_LABEL: Record<PageKey, string> = {
  General: "General",
  Identity: "Identity",
  Lifestyle: "Lifestyle",
  Medical: "Medical",
  Review:  "Review",
};

type Draft = {
  // Essentials
  name?: string; mobile?: string; email?: string; timezone?: string;
  dob?: string; age?: string; heightCm?: string; weightKg?: string;

  // Derived
  ageYears?: number; ageMonths?: number; ageDays?: number;
  bmi?: number; bmiCategory?: string;

  // Identity
  sex?: Sex; dietType?: DietType; maritalStatus?: MaritalStatus;
  statusOther?: string; careDuties?: string;

  // Occupation
  occupationCategory?: OccCategory; occupationRole?: string; occupationOther?: string;
  occupationCategory2?: OccCategory; occupationRole2?: string; occupationOther2?: string;

  // Lifestyle
  workType?: string; workDays?: string; meals?: string;
  sleepHrs?: string; wakeTime?: string; waterPerDay?: string;

  // Medical
  concerns?: string; meds?: string; allergies?: string; notes?: string;
};

// ---------------- Draft helpers ----------------
function loadDraft(): Draft {
  try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) return JSON.parse(raw); } catch {}
  return {};
}
function saveDraft(d: Draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {}
}

// ---------------- Validation ----------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10,15}$/;
const DOB_RE = /^(?:\d{2}[-/.]\d{2}[-/.]\d{4}|\d{4}[-/.]\d{2}[-/.]\d{2})$/;

type Errors = Partial<Record<"name" | "email" | "mobile" | "dob", string>>;

// ---------------- Derived calculations (container) ----------------
function parseDob(str?: string) {
  if (!str) return null;
  const s = str.replace(/[/.]/g, "-").trim();
  let y=0,m=0,d=0;
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) { const [dd,mm,yyyy] = s.split("-").map(Number); d=dd; m=mm; y=yyyy; }
  else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [yyyy,mm,dd] = s.split("-").map(Number); y=yyyy; m=mm; d=dd; }
  else return null;
  const date = new Date(y, m-1, d);
  return isNaN(date.getTime()) ? null : date;
}
function computeAge(dobStr?: string) {
  const dob = parseDob(dobStr); if (!dob) return null;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();
  if (days < 0) { const pm = new Date(now.getFullYear(), now.getMonth(), 0); days += pm.getDate(); months -= 1; }
  if (months < 0) { months += 12; years -= 1; }
  if (years < 0) return null;
  return { years, months, days };
}
function computeBmi(heightCmStr?: string, weightKgStr?: string) {
  const h = Number(heightCmStr), w = Number(weightKgStr);
  if (!h || !w) return null; const m = h/100; if (!m) return null;
  const bmi = Math.round((w/(m*m))*10)/10;
  let cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obesity";
  return { bmi, bmiCategory: cat };
}

// ---------------- Occupation Roles ----------------
const OCC_ROLES: Record<Exclude<OccCategory, "">, string[]> = {
  Students: [
    "School Student","College Undergraduate","Postgraduate",
    "Research Scholar / PhD","Vocational / ITI Student","Coaching / Entrance Prep",
    "Part-time Working Student","Other",
  ],
  Employed: [
    "Government Employee","Private Sector Employee","Doctor","Nurse",
    "Teacher / Professor","Engineer","Software / IT Professional","Lawyer",
    "Accountant","Bank Employee","Sales / Marketing Executive",
    "Army / Defence Personnel","Police Officer","Pilot",
    "Flight Attendant","President","Prime Minister",
    "Cabinet Minister","Chief Minister","MLA","Other",
  ],
  Business: ["Businessman / Entrepreneur","Shopkeeper / Retailer","Farmer / Cultivator","Fisherman","Other"],
  Skilled: [
    "Agricultural Labourer","Construction Worker","Driver (Taxi / Truck / Auto)","Electrician","Plumber",
    "Carpenter","Mason","Security Guard","Tailor","Factory / Industrial Worker","Delivery Person",
    "Artist / Craftsman","Domestic Helper","Other",
  ],
  "Non-working & Others": ["Homemaker","Unemployed","Retired","Priest / Religious Worker","Other"],
};

// ---------------- External page loader (Vite) ----------------
const pageModules = import.meta.glob("./formv2/*.tsx");

type PageProps = {
  draft: Draft;
  editMode: boolean;
  onBlurDerived: () => void;
  occCat?: OccCategory; setOccCat?: (c: OccCategory) => void;
  occCat2?: OccCategory; setOccCat2?: (c: OccCategory) => void;
  showSecondaryRole?: boolean; setShowSecondaryRole?: (b: boolean) => void;
  OCC_ROLES?: typeof OCC_ROLES;
};

function modPath(name: string) {
  const wanted = `./formv2/${name}.tsx`;
  return Object.prototype.hasOwnProperty.call(pageModules, wanted) ? wanted : null;
}

// ---------------- UI atoms ----------------
const Card: React.FC<{ title?: string; border?: string; children: React.ReactNode }> = ({ title, border, children }) => (
  <div className="card" style={{ padding: 16, marginBottom: 16, background: "transparent", border: `3px solid ${border || "var(--shell-border,#1f2937)"}`, borderRadius: 10 }}>
    {title ? <h3 style={{ marginTop: 0 }}>{title}</h3> : null}
    {children}
  </div>
);

// ---------------- Fallback minimal pages (unchanged from earlier, shortened) ----
const Row: React.FC<{ columns?: number; children: React.ReactNode }> = ({ columns = 2, children }) => (
  <div style={{ display: "grid", gap: 12, gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>{children}</div>
);
const Labeled: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: "grid", gap: 6 }}><span className="gw-label">{label}</span>{children}</label>
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => <input {...p} className={"gw-input " + (p.className ?? "")} />;
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (p) => <textarea {...p} className={"gw-input " + (p.className ?? "")} />;

function FallbackGeneral({ draft: d, editMode, onBlurDerived }: PageProps) {
  return (
    <Row columns={2}>
      <Labeled label="Name"><Input id="name" name="name" required defaultValue={d.name || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Mobile"><Input id="mobile" name="mobile" inputMode="numeric" pattern="[0-9]*" required defaultValue={d.mobile || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Email"><Input id="email" name="email" type="email" required defaultValue={d.email || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Timezone"><Input id="timezone" name="timezone" defaultValue={d.timezone || "Asia/Kolkata"} disabled={!editMode} /></Labeled>
      <Labeled label="DOB"><Input id="dob" name="dob" placeholder="dd-mm-yyyy / dd/mm/yyyy / yyyy-mm-dd" required defaultValue={d.dob || ""} disabled={!editMode} onBlur={onBlurDerived} /></Labeled>
      <Labeled label="Age (auto)"><div id="gw-age-display" style={{ padding:"8px 10px", border:"1px solid var(--shell-border,#1f2937)", borderRadius:6, background:"#fff" }} /></Labeled>
      <Labeled label="Height (cm)"><Input id="heightCm" name="heightCm" inputMode="numeric" pattern="[0-9]*" defaultValue={d.heightCm || ""} disabled={!editMode} onBlur={onBlurDerived} /></Labeled>
      <Labeled label="Weight (kg)"><Input id="weightKg" name="weightKg" inputMode="numeric" pattern="[0-9]*" defaultValue={d.weightKg || ""} disabled={!editMode} onBlur={onBlurDerived} /></Labeled>
      <Labeled label="BMI (auto)"><div id="gw-bmi-display" style={{ padding:"8px 10px", border:"1px solid var(--shell-border,#1f2937)", borderRadius:6, background:"#fff" }} /></Labeled>
    </Row>
  );
}
function FallbackIdentity({ draft: d, editMode }: PageProps) {
  return (
    <Row columns={2}>
      <Labeled label="Sex"><select id="sex" name="sex" className="gw-input" defaultValue={d.sex || ""} disabled={!editMode}><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select></Labeled>
      <Labeled label="Diet Type"><select id="dietType" name="dietType" className="gw-input" defaultValue={d.dietType || ""} disabled={!editMode}><option value="">—</option><option>Vegan</option><option>Vegetarian</option><option>Eggetarian</option><option>Non-Vegetarian</option><option>All Eater</option></select></Labeled>
      <Labeled label="Status (Marital)"><select id="maritalStatus" name="maritalStatus" className="gw-input" defaultValue={d.maritalStatus || ""} disabled={!editMode}><option value="">—</option><option>Bachelor</option><option>Married</option><option>Unmarried</option><option>Widow</option><option>Divorce</option><option>Other</option></select></Labeled>
      <Labeled label="If Status = Other"><Input id="statusOther" name="statusOther" defaultValue={d.statusOther || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Care duties"><Input id="careDuties" name="careDuties" defaultValue={d.careDuties || ""} disabled={!editMode} /></Labeled>
    </Row>
  );
}
function FallbackLifestyle({ draft: d, editMode }: PageProps) {
  return (
    <Row columns={2}>
      <Labeled label="Work type"><Input id="workType" name="workType" defaultValue={d.workType || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Work days"><Input id="workDays" name="workDays" defaultValue={d.workDays || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Meals pattern"><Input id="meals" name="meals" defaultValue={d.meals || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Sleep (hrs)"><Input id="sleepHrs" name="sleepHrs" defaultValue={d.sleepHrs || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Usual wake time"><Input id="wakeTime" name="wakeTime" defaultValue={d.wakeTime || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Water per day (L)"><Input id="waterPerDay" name="waterPerDay" defaultValue={d.waterPerDay || ""} disabled={!editMode} /></Labeled>
    </Row>
  );
}
function FallbackMedical({ draft: d, editMode }: PageProps) {
  return (
    <Row columns={2}>
      <Labeled label="Concerns / symptoms"><Textarea id="concerns" name="concerns" rows={3} defaultValue={d.concerns || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Medicines (if any)"><Textarea id="meds" name="meds" rows={3} defaultValue={d.meds || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Allergies"><Textarea id="allergies" name="allergies" rows={2} defaultValue={d.allergies || ""} disabled={!editMode} /></Labeled>
      <Labeled label="Notes (optional)"><Textarea id="notes" name="notes" rows={3} defaultValue={d.notes || ""} disabled={!editMode} /></Labeled>
    </Row>
  );
}
function FallbackReview() {
  const d = loadDraft();
  return (
    <div style={{ display:"grid", gap:12 }}>
      <div style={{ fontWeight:700 }}>Review (read-only fallback)</div>
      <pre style={{ background:"#fff", padding:12, border:"1px solid #e5e7eb", borderRadius:6, overflow:"auto" }}>
        {JSON.stringify(d, null, 2)}
      </pre>
      <div style={{ color:"#6b7280" }}>Create <code>src/pages/formv2/Review.tsx</code> for full Review & Submit.</div>
    </div>
  );
}

// ---------------- Main Component (Container) ----------------
export default function HealthFormV2() {
  const [active, setActive] = React.useState<PageKey>("General");
  const [editMode, setEditMode] = React.useState<boolean>(true);
  const [ageText, setAgeText] = React.useState<string>("");
  const [bmiText, setBmiText] = React.useState<string>("");

  const [occCat, setOccCat] = React.useState<OccCategory>("Students");
  const [occCat2, setOccCat2] = React.useState<OccCategory>("");
  const [showSecondaryRole, setShowSecondaryRole] = React.useState<boolean>(false);

  const [errors, setErrors] = React.useState<Errors>({});
  const [savedTick, setSavedTick] = React.useState<string>("");

  const draftRef = React.useRef<Draft>(loadDraft());
  const formRef = React.useRef<HTMLFormElement | null>(null);

  React.useEffect(() => {
    const d = draftRef.current;
    setOccCat((d.occupationCategory as OccCategory) || "Students");
    setOccCat2((d.occupationCategory2 as OccCategory) || "");
    setShowSecondaryRole(!!d.occupationCategory2);
    if (d.ageYears !== undefined && d.ageMonths !== undefined && d.ageDays !== undefined) {
      setAgeText(`Age: ${d.ageYears}y ${d.ageMonths}m ${d.ageDays}d`);
    }
    if (d.bmi) setBmiText(`BMI: ${d.bmi}${d.bmiCategory ? ` (${d.bmiCategory})` : ""}`);
  }, []);

  function getValuesFromForm(): Draft {
    const fd = new FormData(formRef.current || undefined);
    const val = (k: string) => (fd.get(k) ?? "").toString().trim();
    return {
      name: val("name"), mobile: val("mobile"), email: val("email"),
      timezone: val("timezone") || "Asia/Kolkata",
      dob: val("dob"), age: val("age"), heightCm: val("heightCm"), weightKg: val("weightKg"),
      sex: (val("sex") as Sex) || "", dietType: (val("dietType") as DietType) || "",
      maritalStatus: (val("maritalStatus") as MaritalStatus) || "",
      statusOther: val("statusOther"), careDuties: val("careDuties"),
      occupationCategory: (val("occupationCategory") as OccCategory) || "",
      occupationRole: val("occupationRole"), occupationOther: val("occupationOther"),
      occupationCategory2: (val("occupationCategory2") as OccCategory) || "",
      occupationRole2: val("occupationRole2"), occupationOther2: val("occupationOther2"),
      workType: val("workType"), workDays: val("workDays"), meals: val("meals"),
      sleepHrs: val("sleepHrs"), wakeTime: val("wakeTime"), waterPerDay: val("waterPerDay"),
      concerns: val("concerns"), meds: val("meds"), allergies: val("allergies"), notes: val("notes"),
    };
  }

  function computeDerived(next: Draft) {
    const age = computeAge(next.dob);
    if (age) { next.ageYears = age.years; next.ageMonths = age.months; next.ageDays = age.days; setAgeText(`Age: ${age.years}y ${age.months}m ${age.days}d`); }
    else { next.ageYears = next.ageMonths = next.ageDays = undefined; setAgeText(""); }
    const bmi = computeBmi(next.heightCm, next.weightKg);
    if (bmi) { next.bmi = bmi.bmi; next.bmiCategory = bmi.bmiCategory; setBmiText(`BMI: ${bmi.bmi} (${bmi.bmiCategory})`); }
    else { next.bmi = undefined; next.bmiCategory = undefined; setBmiText(""); }
  }

  function saveWithTick() { setSavedTick("Saved ✓"); setTimeout(() => setSavedTick(""), 1200); }

  function handleSavePage() {
    const base = getValuesFromForm();
    const next = { ...draftRef.current, ...base };
    computeDerived(next);
    draftRef.current = next; saveDraft(draftRef.current);
    setEditMode(false); saveWithTick();
    const aBox = document.getElementById("gw-age-display"); if (aBox) aBox.textContent = ageText || "—";
    const bBox = document.getElementById("gw-bmi-display"); if (bBox) bBox.textContent = bmiText || "—";
  }

  function handleAutoSaveOnSwitch(nextPage: PageKey) {
    // Always save current form state before switching (even if not in edit mode)
    const base = getValuesFromForm();
    const next = { ...draftRef.current, ...base };
    computeDerived(next);
    draftRef.current = next; saveDraft(draftRef.current);
    setActive(nextPage); setEditMode(false); saveWithTick();
  }

  function handleBack() {
    const idx = PAGES.indexOf(active);
    if (idx > 0) handleAutoSaveOnSwitch(PAGES[idx - 1]);
  }

  function handleBlurDerived() {
    const base = getValuesFromForm();
    const next = { ...draftRef.current, ...base };
    computeDerived(next); draftRef.current = next; saveDraft(draftRef.current); saveWithTick();
    const aBox = document.getElementById("gw-age-display"); if (aBox) aBox.textContent = ageText || "—";
    const bBox = document.getElementById("gw-bmi-display"); if (bBox) bBox.textContent = bmiText || "—";
  }

  function validateGeneral(d: Draft): Errors {
    const e: Errors = {};
    if (!d.name) e.name = "Name is required.";
    if (!d.email) e.email = "Email is required.";
    else if (!EMAIL_RE.test(d.email)) e.email = "Enter a valid email address.";
    if (!d.mobile) e.mobile = "Mobile is required.";
    else if (!MOBILE_RE.test(d.mobile)) e.mobile = "Use 10–15 digits.";
    if (!d.dob) e.dob = "DOB is required.";
    else if (!DOB_RE.test(d.dob)) e.dob = "Use dd-mm-yyyy / dd/mm/yyyy / yyyy-mm-dd";
    return e;
  }

  // ------------- External page resolution -------------
  function useExternalPage(name: string) {
    const path = modPath(name);
    const Comp = React.useMemo(() => {
      if (!path) return null;
      // @ts-ignore
      const loader = pageModules[path] as () => Promise<{ default: React.FC<PageProps> }>;
      return React.lazy(loader);
    }, [path]);
    return Comp;
  }
  const ExtGeneral = useExternalPage("General");
  const ExtIdentity = useExternalPage("Identity");
  const ExtLifestyle = useExternalPage("Lifestyle");
  const ExtMedical = useExternalPage("Medical");
  const ExtReview = useExternalPage("Review");

  const d = draftRef.current;

  function renderGeneral() {
    const props: PageProps = { draft: d, editMode, onBlurDerived: handleBlurDerived };
    return ExtGeneral ? (
      <React.Suspense fallback={<FallbackGeneral {...props} />}>
        <ExtGeneral {...props} />
      </React.Suspense>
    ) : <FallbackGeneral {...props} />;
  }
  function renderIdentity() {
    const props: PageProps = { draft: d, editMode, occCat, setOccCat, occCat2, setOccCat2, showSecondaryRole, setShowSecondaryRole, OCC_ROLES };
    return ExtIdentity ? (
      <React.Suspense fallback={<FallbackIdentity {...props} />}>
        <ExtIdentity {...props} />
      </React.Suspense>
    ) : <FallbackIdentity {...props} />;
  }
  function renderLifestyle() {
    const props: PageProps = { draft: d, editMode, onBlurDerived: handleBlurDerived };
    return ExtLifestyle ? (
      <React.Suspense fallback={<FallbackLifestyle {...props} />}>
        <ExtLifestyle {...props} />
      </React.Suspense>
    ) : <FallbackLifestyle {...props} />;
  }
  function renderMedical() {
    const props: PageProps = { draft: d, editMode };
    return ExtMedical ? (
      <React.Suspense fallback={<FallbackMedical {...props} />}>
        <ExtMedical {...props} />
      </React.Suspense>
    ) : <FallbackMedical {...props} />;
  }
  function renderReview() {
    // Provide extra props for Review page
    const props: any = {
      draft: d,
      setActive, // allow Review to send users back to a page to edit
      PAGES, PAGE_LABEL,
      onSaveNow: () => handleSavePage(),
    };
    return ExtReview ? (
      <React.Suspense fallback={<FallbackReview />}>
        <ExtReview {...props} />
      </React.Suspense>
    ) : <FallbackReview />;
  }

  function renderPage() {
    switch (active) {
      case "General": return renderGeneral();
      case "Identity": return renderIdentity();
      case "Lifestyle": return renderLifestyle();
      case "Medical": return renderMedical();
      case "Review": return renderReview();
    }
  }

  // ------------- Top buttons + action bar -------------
  return (
    <div className="container" style={{ maxWidth: 980, margin: "24px auto" }}>
      <h2>Form V2</h2>

      {/* Top page buttons */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        {PAGES.map((p) => (
          <button
            key={p}
            type="button"
            className="gw-btn"
            onClick={() => handleAutoSaveOnSwitch(p)}
            style={{ background:"#fff", border:`3px solid ${PAGE_BORDER[p]}`, fontWeight: (p==="Review"||p==="General"||p==="Identity"||p==="Lifestyle"||p==="Medical") && p===p ? 800 : 600 }}
          >
            {PAGE_LABEL[p]}
          </button>
        ))}
        <div style={{ marginLeft: "auto", color: "#16a34a", fontWeight: 600 }}>{savedTick}</div>
      </div>

      {/* Action bar */}
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <button type="button" className="gw-btn" onClick={handleBack} disabled={PAGES.indexOf(active)===0}>Back</button>
        <button type="button" className="gw-btn" onClick={() => setEditMode(true)} disabled={editMode}>Edit</button>
        <button
          type="button" className="gw-btn"
          onClick={() => {
            if (active === "General") {
              const dNow = { ...draftRef.current, ...getValuesFromForm() };
              const v = validateGeneral(dNow); if (Object.keys(v).length) { return; }
            }
            handleSavePage();
          }}
        >Save</button>
      </div>

      {/* Page content with bold colored border */}
      <form id="gw-formv2-form" ref={formRef} noValidate>
        <Card border={PAGE_BORDER[active]}>
          {renderPage()}
        </Card>

        {/* Bottom sticky Save */}
        <div style={{ display:"flex", gap:8, position:"sticky", bottom:0, padding:"8px 0", background:"var(--page-bg, #f8fafc)" }}>
          <button type="button" className="gw-btn" onClick={handleBack} disabled={PAGES.indexOf(active)===0}>Back</button>
          <button type="button" className="gw-btn" onClick={() => setEditMode(true)} disabled={editMode}>Edit</button>
          <button
            type="button" className="gw-btn"
            onClick={() => {
              if (active === "General") {
                const dNow = { ...draftRef.current, ...getValuesFromForm() };
                const v = validateGeneral(dNow); if (Object.keys(v).length) { return; }
              }
              handleSavePage();
            }}
          >Save</button>
        </div>
      </form>
    </div>
  );
}
