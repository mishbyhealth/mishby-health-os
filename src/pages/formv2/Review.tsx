// src/pages/formv2/Review.tsx
// Review & Submit page + Export / Import / New (clear). Now also displays Address block.

import React from "react";

const DRAFT_KEY = "glowell:draft:v2.2";

// download helper
function download(filename: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const Review: React.FC<any> = ({ draft, setActive, PAGES, PAGE_LABEL, onSaveNow }) => {
  const d = (draft || {}) as Record<string, any>;

  const pairs = (items: [string, any][]) =>
    items.map(([k, v]) => (
      <div key={k} style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:8 }}>
        <div style={{ color:"#374151", fontWeight:600 }}>{k}</div>
        <div style={{ color:"#111827" }}>{(v ?? "—").toString()}</div>
      </div>
    ));

  const saveSnapshot = (payload: any) => {
    try {
      const ts = new Date().toISOString();
      localStorage.setItem(`glowell:submitted:${ts}`, JSON.stringify(payload));
    } catch {}
  };

  // Export
  const handleExport = () => {
    try {
      onSaveNow && onSaveNow();
      const raw = localStorage.getItem(DRAFT_KEY);
      const latest = raw ? JSON.parse(raw) : d;
      const filename = `glowell_draft_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      download(filename, JSON.stringify(latest, null, 2));
      alert("Exported current form to JSON.");
    } catch { alert("Could not export. Please try again."); }
  };

  // Import
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const handleImportClick = () => fileRef.current?.click();
  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result || "{}"));
        if (obj && !Array.isArray(obj) && (obj.name !== undefined || obj.email !== undefined || obj.mobile !== undefined)) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(obj));
          alert("Imported successfully. Your form has been filled from the file.");
          setActive && setActive("General");
        } else { alert("Invalid file format. Please select a valid GloWell JSON export."); }
      } catch { alert("Could not read the file. Make sure it is a valid JSON export."); }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // New (clear)
  const handleNewClear = () => {
    const sure = confirm("This will clear the current form (unsent data). Submitted snapshots remain saved. Continue?");
    if (!sure) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({}));
      alert("Form cleared. You can start fresh.");
      setActive && setActive("General");
    } catch { alert("Could not clear. Please try again."); }
  };

  // Submit
  const handleSubmit = () => {
    if (!d.name || !d.email || !d.mobile || !d.dob) {
      alert("Please complete General page (Name, Email, Mobile, DOB).");
      setActive && setActive("General");
      return;
    }
    onSaveNow && onSaveNow();
    let latest = d;
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) latest = JSON.parse(raw); } catch {}
    saveSnapshot({ ...latest, submittedAt: new Date().toISOString() });
    alert("Submitted! Your data is ready for processing to generate the health plan.");
  };

  return (
    <div style={{ display:"grid", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:18, fontWeight:800 }}>Review your details</div>
        <div style={{ display:"flex", gap:8 }}>
          <button type="button" className="gw-btn" onClick={handleExport}>Export (JSON)</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display:"none" }} onChange={handleImportFile} />
          <button type="button" className="gw-btn" onClick={handleImportClick}>Import (JSON)</button>
          <button type="button" className="gw-btn" onClick={handleNewClear}>New (Clear)</button>
        </div>
      </div>

      {/* General */}
      <section style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontWeight:700 }}>General</div>
          <button type="button" className="gw-btn" onClick={() => setActive && setActive("General")}>Edit</button>
        </div>
        {pairs([
          ["Name", d.name], ["Mobile", d.mobile], ["Email", d.email], ["Timezone", d.timezone],
          ["DOB", d.dob], ["Age (auto)", d.ageYears !== undefined ? `${d.ageYears}y ${d.ageMonths}m ${d.ageDays}d` : "—"],
          ["Height (cm)", d.heightCm], ["Weight (kg)", d.weightKg],
          ["BMI (auto)", d.bmi !== undefined ? `${d.bmi} (${d.bmiCategory || ""})` : "—"],
        ])}

        <div style={{ height:8 }} />

        {/* Address rows */}
        <div style={{ fontWeight:700, marginBottom:6 }}>Address</div>
        {pairs([
          ["Address Line 1", d.addrLine1],
          ["Address Line 2", d.addrLine2],
          ["City / Town", d.cityTown],
          ["District", d.district],
          ["State / Province", d.state],
          ["Country", d.country],
          ["PIN / Postal Code", d.postalCode],
        ])}
      </section>

      {/* Identity */}
      <section style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontWeight:700 }}>Identity</div>
          <button type="button" className="gw-btn" onClick={() => setActive && setActive("Identity")}>Edit</button>
        </div>
        {pairs([
          ["Sex", d.sex], ["Diet Type", d.dietType], ["Marital Status", d.maritalStatus],
          ["Status Other", d.statusOther], ["Care duties", d.careDuties],
          ["Occupation Category", d.occupationCategory], ["Occupation Role", d.occupationRole], ["Occupation Other", d.occupationOther],
          ["Secondary Category", d.occupationCategory2], ["Secondary Role", d.occupationRole2], ["Secondary Other", d.occupationOther2],
        ])}
      </section>

      {/* Lifestyle */}
      <section style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontWeight:700 }}>Lifestyle</div>
          <button type="button" className="gw-btn" onClick={() => setActive && setActive("Lifestyle")}>Edit</button>
        </div>
        {pairs([
          ["Work type", d.workType], ["Work days", d.workDays], ["Meals pattern", d.meals],
          ["Sleep (hrs)", d.sleepHrs], ["Usual wake time", d.wakeTime], ["Water per day (L)", d.waterPerDay],
        ])}
      </section>

      {/* Medical */}
      <section style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontWeight:700 }}>Medical</div>
          <button type="button" className="gw-btn" onClick={() => setActive && setActive("Medical")}>Edit</button>
        </div>
        {pairs([
          ["Concerns / symptoms", d.concerns],
          ["Medicines", d.meds],
          ["Allergies", d.allergies],
          ["Notes", d.notes],
        ])}
      </section>

      {/* Submit */}
      <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:8 }}>
        <button type="button" className="gw-btn" onClick={() => setActive && setActive("General")}>Back to General</button>
        <button type="button" className="gw-btn" onClick={handleSubmit} style={{ borderWidth:3, borderColor:"#7c3aed" }}>
          Submit (Finalize)
        </button>
      </div>
    </div>
  );
};

export default Review;
