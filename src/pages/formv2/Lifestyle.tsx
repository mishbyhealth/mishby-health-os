// src/pages/formv2/Lifestyle.tsx
// Lifestyle page with LOCAL AUTOSAVE (+ Owner Assist Mode to disable autofill per device)
// No changes required in the main container.

import React from "react";

const DRAFT_KEY = "glowell:draft:v2.2";
const ASSIST_KEY = "glowell:v2:assistMode";

const Lifestyle: React.FC<any> = ({ draft, editMode }) => {
  const d = draft || {};

  // Owner Assist Mode (same key as other pages)
  const [assistMode, setAssistMode] = React.useState<boolean>(() => {
    try { return localStorage.getItem(ASSIST_KEY) === "1"; } catch { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(ASSIST_KEY, assistMode ? "1" : "0"); } catch {}
  }, [assistMode]);
  const ac = (token: string) => (assistMode ? "off" : token);

  // --- read/write draft helpers ---
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

  // Autosave from the current form on every change
  const autosaveFromEvent = (e: React.SyntheticEvent<any>) => {
    // @ts-ignore
    const form: HTMLFormElement | null = e.currentTarget?.form || document.querySelector("form");
    if (!form) return;
    const fd = new FormData(form);
    const val = (k: string) => (fd.get(k) ?? "").toString().trim();

    writeDraft({
      workType: val("workType"),
      workDays: val("workDays"),
      meals: val("meals"),
      sleepHrs: val("sleepHrs"),
      wakeTime: val("wakeTime"),
      waterPerDay: val("waterPerDay"),
      // room to add more lifestyle fields later
    });
  };

  // Repopulate on mount (for uncontrolled inputs)
  React.useEffect(() => {
    const saved = readDraft();
    const setVal = (id: string, v: any) => {
      if (v === undefined || v === null) return;
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) el.value = String(v);
    };
    setVal("workType", saved.workType ?? d.workType);
    setVal("workDays", saved.workDays ?? d.workDays);
    setVal("meals", saved.meals ?? d.meals);
    setVal("sleepHrs", saved.sleepHrs ?? d.sleepHrs);
    setVal("wakeTime", saved.wakeTime ?? d.wakeTime);
    setVal("waterPerDay", saved.waterPerDay ?? d.waterPerDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Owner Assist toggle (device-only) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.9 }}>
        <input
          id="assistMode_life"
          type="checkbox"
          checked={assistMode}
          onChange={(e) => setAssistMode(e.currentTarget.checked)}
        />
        <label htmlFor="assistMode_life">
          <strong>Owner Assist Mode</strong> — disable browser autofill on this device
        </label>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        {/* Work type */}
        <label htmlFor="workType" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Work type</span>
          <input
            id="workType" name="workType" className="gw-input"
            defaultValue={d.workType || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="e.g., Desk job / Field work / Shift work"
          />
        </label>

        {/* Work days */}
        <label htmlFor="workDays" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Work days</span>
          <input
            id="workDays" name="workDays" className="gw-input"
            defaultValue={d.workDays || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="Mon–Fri / Rotational shifts"
          />
        </label>

        {/* Meals pattern */}
        <label htmlFor="meals" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Meals pattern</span>
          <input
            id="meals" name="meals" className="gw-input"
            defaultValue={d.meals || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="e.g., 3 meals + 1 snack"
          />
        </label>

        {/* Sleep hours */}
        <label htmlFor="sleepHrs" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Sleep (hrs)</span>
          <input
            id="sleepHrs" name="sleepHrs" className="gw-input"
            defaultValue={d.sleepHrs || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="e.g., 7.5"
          />
        </label>

        {/* Usual wake time */}
        <label htmlFor="wakeTime" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Usual wake time</span>
          <input
            id="wakeTime" name="wakeTime" className="gw-input"
            defaultValue={d.wakeTime || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="e.g., 06:30 AM"
          />
        </label>

        {/* Water per day */}
        <label htmlFor="waterPerDay" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Water per day (L)</span>
          <input
            id="waterPerDay" name="waterPerDay" className="gw-input"
            defaultValue={d.waterPerDay || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
            placeholder="e.g., 2.5"
          />
        </label>
      </div>
    </div>
  );
};

export default Lifestyle;
