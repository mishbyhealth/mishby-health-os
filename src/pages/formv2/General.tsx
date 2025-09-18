// src/pages/formv2/General.tsx
// General page with Address block + LOCAL AUTOSAVE + Owner Assist Mode (disable autofill per device)
// Self-contained Age/BMI display. No main-file changes required.

import React from "react";

const DRAFT_KEY = "glowell:draft:v2.2";
const ASSIST_KEY = "glowell:v2:assistMode";

const General: React.FC<any> = ({ draft, editMode }) => {
  const d = draft || {};

  // Owner Assist Mode (device-only toggle to stop browser autofill popups)
  const [assistMode, setAssistMode] = React.useState<boolean>(() => {
    try { return localStorage.getItem(ASSIST_KEY) === "1"; } catch { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(ASSIST_KEY, assistMode ? "1" : "0"); } catch {}
  }, [assistMode]);
  const ac = (token: string) => (assistMode ? "off" : token);

  // ---- Derived (Age/BMI) kept inside this page ----
  const [ageText, setAgeText] = React.useState<string>("");
  const [bmiText, setBmiText] = React.useState<string>("");

  const parseDob = (str?: string) => {
    if (!str) return null;
    const s = String(str).replace(/[/.]/g, "-").trim();
    let y=0,m=0,dd=0;
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) { const [d1,d2,d3]=s.split("-").map(Number); dd=d1;m=d2;y=d3; }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y1,m1,d1]=s.split("-").map(Number); y=y1;m=m1;dd=d1; }
    else return null;
    const dt = new Date(y, m-1, dd);
    return isNaN(dt.getTime()) ? null : dt;
  };
  const computeAge = (dobStr?: string) => {
    const dob = parseDob(dobStr); if (!dob) return null;
    const now = new Date();
    let y = now.getFullYear() - dob.getFullYear();
    let m = now.getMonth() - dob.getMonth();
    let d2 = now.getDate() - dob.getDate();
    if (d2 < 0) { const pm = new Date(now.getFullYear(), now.getMonth(), 0); d2 += pm.getDate(); m -= 1; }
    if (m < 0) { m += 12; y -= 1; }
    if (y < 0) return null;
    return { y, m, d2 };
  };
  const computeBmi = (hStr?: string, wStr?: string) => {
    const h = Number(hStr), w = Number(wStr);
    if (!h || !w) return null;
    const m = h/100; if (!m) return null;
    const bmi = Math.round((w/(m*m))*10)/10;
    let cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obesity";
    return { bmi, cat };
  };

  // ---- Local draft (autosave) helpers ----
  const readDraft = () => {
    try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  };
  const writeDraft = (partial: any) => {
    try {
      const cur = readDraft();
      const next = { ...cur, ...partial };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch {}
  };

  // Read initial + show derived if present
  React.useEffect(() => {
    const saved = readDraft();
    const pick = <T,>(k: string, fallback: T) => (saved[k] ?? d[k] ?? fallback);

    const a = computeAge(pick("dob", ""));
    if (a) setAgeText(`Age: ${a.y}y ${a.m}m ${a.d2}d`);

    const b = computeBmi(pick("heightCm", ""), pick("weightKg", ""));
    if (b) setBmiText(`BMI: ${b.bmi} (${b.cat})`);

    // Imperatively repopulate uncontrolled inputs from saved draft (so Save दबाए बिना भी data लौट आए)
    const setVal = (id: string, v: any) => {
      if (v === undefined || v === null) return;
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) el.value = String(v);
    };
    setVal("name", pick("name",""));
    setVal("mobile", pick("mobile",""));
    setVal("email", pick("email",""));
    setVal("timezone", pick("timezone","Asia/Kolkata"));
    setVal("dob", pick("dob",""));
    setVal("heightCm", pick("heightCm",""));
    setVal("weightKg", pick("weightKg",""));
    // Address
    setVal("addrLine1", pick("addrLine1",""));
    setVal("addrLine2", pick("addrLine2",""));
    setVal("cityTown", pick("cityTown",""));
    setVal("district", pick("district",""));
    setVal("state", pick("state",""));
    setVal("country", pick("country","India"));
    setVal("postalCode", pick("postalCode",""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute derived when relevant fields blur; also autosave whole section
  const onBlurDerived = () => {
    const form = (document.getElementById("gw-formv2-form") as HTMLFormElement) || undefined;
    const fd = form ? new FormData(form) : undefined;
    const val = (k: string) => (fd?.get(k) ?? "").toString().trim();

    const a = computeAge(val("dob"));
    setAgeText(a ? `Age: ${a.y}y ${a.m}m ${a.d2}d` : "");

    const b = computeBmi(val("heightCm"), val("weightKg"));
    setBmiText(b ? `BMI: ${b.bmi} (${b.cat})` : "");

    // also save all General fields
    autosaveFromForm();
  };

  // Autosave from current form (call onChange of inputs)
  const autosaveFromForm = () => {
    const form = (document.getElementById("gw-formv2-form") as HTMLFormElement) || undefined;
    if (!form) return;
    const fd = new FormData(form);
    const val = (k: string) => (fd.get(k) ?? "").toString().trim();

    writeDraft({
      name: val("name"),
      mobile: val("mobile"),
      email: val("email"),
      timezone: val("timezone") || "Asia/Kolkata",
      dob: val("dob"),
      heightCm: val("heightCm"),
      weightKg: val("weightKg"),
      // Address fields
      addrLine1: val("addrLine1"),
      addrLine2: val("addrLine2"),
      cityTown: val("cityTown"),
      district: val("district"),
      state: val("state"),
      country: val("country") || "India",
      postalCode: val("postalCode"),
    });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Owner Assist toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.9 }}>
        <input id="assistMode" type="checkbox" checked={assistMode} onChange={(e) => setAssistMode(e.currentTarget.checked)} />
        <label htmlFor="assistMode">
          <strong>Owner Assist Mode</strong> — disable browser autofill on this device
          <span style={{ marginLeft: 8, color: "#555" }}> (अपनी जानकारी auto-fill न दिखे)</span>
        </label>
      </div>

      {/* Basics */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        {/* Name */}
        <label htmlFor="name" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Name <span aria-hidden="true" style={{ color: "crimson" }}>*</span></span>
          <input id="name" name="name" className="gw-input" required defaultValue={d.name || ""} disabled={!editMode}
                 autoComplete={ac("name")} onChange={autosaveFromForm} />
        </label>

        {/* Mobile */}
        <label htmlFor="mobile" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Mobile <span aria-hidden="true" style={{ color: "crimson" }}>*</span></span>
          <input id="mobile" name="mobile" className="gw-input" inputMode="numeric" pattern="[0-9]*" required
                 defaultValue={d.mobile || ""} disabled={!editMode} autoComplete={ac("tel")}
                 onChange={autosaveFromForm} />
        </label>

        {/* Email */}
        <label htmlFor="email" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Email <span aria-hidden="true" style={{ color: "crimson" }}>*</span></span>
          <input id="email" name="email" className="gw-input" type="email" required
                 defaultValue={d.email || ""} disabled={!editMode} autoComplete={ac("email")}
                 onChange={autosaveFromForm} />
        </label>

        {/* Timezone */}
        <label htmlFor="timezone" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Timezone</span>
          <input id="timezone" name="timezone" className="gw-input"
                 defaultValue={d.timezone || "Asia/Kolkata"} disabled={!editMode} autoComplete={ac("off")}
                 onChange={autosaveFromForm} />
        </label>

        {/* DOB */}
        <label htmlFor="dob" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">DOB <span aria-hidden="true" style={{ color: "crimson" }}>*</span></span>
          <input id="dob" name="dob" className="gw-input"
                 placeholder="dd-mm-yyyy / dd/mm/yyyy / yyyy-mm-dd" required
                 defaultValue={d.dob || ""} disabled={!editMode} autoComplete={ac("bday")}
                 onBlur={onBlurDerived} onChange={autosaveFromForm} />
        </label>

        {/* Age (auto) */}
        <label style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Age (auto)</span>
          <div aria-live="polite" style={{ padding:"8px 10px", border:"1px solid var(--shell-border,#1f2937)", borderRadius:6, background:"#fff" }}>
            {ageText || "—"}
          </div>
        </label>

        {/* Height */}
        <label htmlFor="heightCm" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Height (cm)</span>
          <input id="heightCm" name="heightCm" className="gw-input" inputMode="numeric" pattern="[0-9]*"
                 placeholder="e.g., 165" defaultValue={d.heightCm || ""} disabled={!editMode}
                 autoComplete={ac("off")} onBlur={onBlurDerived} onChange={autosaveFromForm} />
        </label>

        {/* Weight */}
        <label htmlFor="weightKg" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Weight (kg)</span>
          <input id="weightKg" name="weightKg" className="gw-input" inputMode="numeric" pattern="[0-9]*"
                 placeholder="e.g., 64" defaultValue={d.weightKg || ""} disabled={!editMode}
                 autoComplete={ac("off")} onBlur={onBlurDerived} onChange={autosaveFromForm} />
        </label>

        {/* BMI (auto) */}
        <label style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">BMI (auto)</span>
          <div aria-live="polite" style={{ padding:"8px 10px", border:"1px solid var(--shell-border,#1f2937)", borderRadius:6, background:"#fff" }}>
            {bmiText || "—"}
          </div>
        </label>
      </div>

      {/* Address block */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Address</div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
          {/* Line 1 */}
          <label htmlFor="addrLine1" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">Address Line 1</span>
            <input id="addrLine1" name="addrLine1" className="gw-input"
                   placeholder="House/Flat, Street" defaultValue={d.addrLine1 || ""} disabled={!editMode}
                   autoComplete={ac("address-line1")} onChange={autosaveFromForm} />
          </label>

          {/* Line 2 */}
          <label htmlFor="addrLine2" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">Address Line 2 (Landmark)</span>
            <input id="addrLine2" name="addrLine2" className="gw-input"
                   placeholder="Landmark (optional)" defaultValue={d.addrLine2 || ""} disabled={!editMode}
                   autoComplete={ac("address-line2")} onChange={autosaveFromForm} />
          </label>

          {/* City / Town */}
          <label htmlFor="cityTown" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">City / Town</span>
            <input id="cityTown" name="cityTown" className="gw-input"
                   defaultValue={d.cityTown || ""} disabled={!editMode}
                   autoComplete={ac("address-level2")} onChange={autosaveFromForm} />
          </label>

          {/* District */}
          <label htmlFor="district" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">District</span>
            <input id="district" name="district" className="gw-input"
                   defaultValue={d.district || ""} disabled={!editMode}
                   autoComplete={ac("off")} onChange={autosaveFromForm} />
          </label>

          {/* State */}
          <label htmlFor="state" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">State / Province</span>
            <input id="state" name="state" className="gw-input"
                   defaultValue={d.state || ""} disabled={!editMode}
                   autoComplete={ac("address-level1")} onChange={autosaveFromForm} />
          </label>

          {/* Country */}
          <label htmlFor="country" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">Country</span>
            <input id="country" name="country" className="gw-input"
                   defaultValue={d.country || "India"} disabled={!editMode}
                   autoComplete={ac("country-name")} onChange={autosaveFromForm} />
          </label>

          {/* PIN / Postal Code */}
          <label htmlFor="postalCode" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">PIN / Postal Code</span>
            <input id="postalCode" name="postalCode" className="gw-input"
                   inputMode="numeric" pattern="[0-9]*"
                   defaultValue={d.postalCode || ""} disabled={!editMode}
                   autoComplete={ac("postal-code")} onChange={autosaveFromForm} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default General;
