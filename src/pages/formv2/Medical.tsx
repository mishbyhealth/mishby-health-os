// src/pages/formv2/Medical.tsx
// Medical page with LOCAL AUTOSAVE + Owner Assist Mode (disable autofill per device).
// No changes needed in the main container.

import React from "react";

const DRAFT_KEY = "glowell:draft:v2.2";
const ASSIST_KEY = "glowell:v2:assistMode";

const Medical: React.FC<any> = ({ draft, editMode }) => {
  const d = draft || {};

  // Owner Assist Mode (shared with other pages; remembered per device)
  const [assistMode, setAssistMode] = React.useState<boolean>(() => {
    try { return localStorage.getItem(ASSIST_KEY) === "1"; } catch { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(ASSIST_KEY, assistMode ? "1" : "0"); } catch {}
  }, [assistMode]);
  const ac = (token: string) => (assistMode ? "off" : token);

  // ---- read/write draft helpers ----
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

  // Autosave from current form on every change
  const autosaveFromEvent = (e: React.SyntheticEvent<any>) => {
    // @ts-ignore
    const form: HTMLFormElement | null = e.currentTarget?.form || document.querySelector("form");
    if (!form) return;
    const fd = new FormData(form);
    const val = (k: string) => (fd.get(k) ?? "").toString().trim();

    writeDraft({
      concerns: val("concerns"),
      meds: val("meds"),
      allergies: val("allergies"),
      notes: val("notes"),
    });
  };

  // Repopulate on mount (uncontrolled inputs)
  React.useEffect(() => {
    const saved = readDraft();
    const setVal = (id: string, v: any) => {
      if (v === undefined || v === null) return;
      const el = document.getElementById(id) as HTMLTextAreaElement | HTMLInputElement | null;
      if (el) el.value = String(v);
    };
    setVal("concerns", saved.concerns ?? d.concerns);
    setVal("meds", saved.meds ?? d.meds);
    setVal("allergies", saved.allergies ?? d.allergies);
    setVal("notes", saved.notes ?? d.notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Owner Assist toggle (device-only) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.9 }}>
        <input
          id="assistMode_med"
          type="checkbox"
          checked={assistMode}
          onChange={(e) => setAssistMode(e.currentTarget.checked)}
        />
        <label htmlFor="assistMode_med">
          <strong>Owner Assist Mode</strong> — disable browser autofill on this device
        </label>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        {/* Concerns / symptoms */}
        <label htmlFor="concerns" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Concerns / symptoms</span>
          <textarea
            id="concerns" name="concerns" className="gw-input" rows={5}
            defaultValue={d.concerns || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="e.g., headache 2 weeks, acidity after meals, knee pain L>R"
          />
        </label>

        {/* Medicines (if any) */}
        <label htmlFor="meds" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Medicines (if any)</span>
          <textarea
            id="meds" name="meds" className="gw-input" rows={5}
            defaultValue={d.meds || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="e.g., Metformin 500 mg OD, Vitamin D weekly"
          />
        </label>

        {/* Allergies */}
        <label htmlFor="allergies" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Allergies</span>
          <textarea
            id="allergies" name="allergies" className="gw-input" rows={3}
            defaultValue={d.allergies || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="e.g., penicillin rash, peanut allergy"
          />
        </label>

        {/* Notes (optional) */}
        <label htmlFor="notes" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Notes (optional)</span>
          <textarea
            id="notes" name="notes" className="gw-input" rows={3}
            defaultValue={d.notes || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="Any extra info to share"
          />
        </label>
      </div>
    </div>
  );
};

export default Medical;
