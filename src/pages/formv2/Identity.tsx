// src/pages/formv2/Identity.tsx
// Identity + Occupation page with LOCAL AUTOSAVE and Owner Assist Mode (disable autofill).
// No main file changes.

import React from "react";

const DRAFT_KEY = "glowell:draft:v2.2";
const ASSIST_KEY = "glowell:v2:assistMode";

type OccCategory = "Students" | "Employed" | "Business" | "Skilled" | "Non-working & Others" | "";

const Identity: React.FC<any> = ({
  draft,
  editMode,
  occCat,
  setOccCat,
  occCat2,
  setOccCat2,
  showSecondaryRole,
  setShowSecondaryRole,
  OCC_ROLES,
}) => {
  const d = draft || {};
  const [assistMode, setAssistMode] = React.useState<boolean>(() => {
    try { return localStorage.getItem(ASSIST_KEY) === "1"; } catch { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(ASSIST_KEY, assistMode ? "1" : "0"); } catch {}
  }, [assistMode]);
  const ac = (token: string) => (assistMode ? "off" : token);

  // read/write draft
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

  // collect + autosave
  const autosaveFromEvent = (e: React.SyntheticEvent<any>) => {
    // @ts-ignore
    const form: HTMLFormElement | null = e.currentTarget?.form || document.querySelector("form");
    if (!form) return;
    const fd = new FormData(form);
    const val = (k: string) => (fd.get(k) ?? "").toString().trim();

    writeDraft({
      sex: val("sex"),
      dietType: val("dietType"),
      maritalStatus: val("maritalStatus"),
      statusOther: val("statusOther"),
      careDuties: val("careDuties"),
      occupationCategory: (val("occupationCategory") as OccCategory) || "",
      occupationRole: val("occupationRole"),
      occupationOther: val("occupationOther"),
      occupationCategory2: (val("occupationCategory2") as OccCategory) || "",
      occupationRole2: val("occupationRole2"),
      occupationOther2: val("occupationOther2"),
    });
  };

  // repopulate on mount
  React.useEffect(() => {
    const saved = readDraft();
    if (saved.occupationCategory && setOccCat) setOccCat(saved.occupationCategory);
    if (saved.occupationCategory2 && setOccCat2) setOccCat2(saved.occupationCategory2);
    if (typeof saved.occupationCategory2 === "string" && setShowSecondaryRole) {
      setShowSecondaryRole(!!saved.occupationCategory2);
    }
    const setVal = (id: string, v: any) => {
      if (v === undefined || v === null) return;
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (el) el.value = String(v);
    };
    setVal("sex", saved.sex ?? d.sex);
    setVal("dietType", saved.dietType ?? d.dietType);
    setVal("maritalStatus", saved.maritalStatus ?? d.maritalStatus);
    setVal("statusOther", saved.statusOther ?? d.statusOther);
    setVal("careDuties", saved.careDuties ?? d.careDuties);
    setVal("occupationCategory", saved.occupationCategory ?? d.occupationCategory ?? "Students");
    setTimeout(() => {
      setVal("occupationRole", saved.occupationRole ?? d.occupationRole);
      setVal("occupationOther", saved.occupationOther ?? d.occupationOther);
      setVal("occupationCategory2", saved.occupationCategory2 ?? d.occupationCategory2 ?? "");
      setVal("occupationRole2", saved.occupationRole2 ?? d.occupationRole2);
      setVal("occupationOther2", saved.occupationOther2 ?? d.occupationOther2);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rolesPrimary: string[] =
    occCat && OCC_ROLES && OCC_ROLES[occCat] ? OCC_ROLES[occCat] : OCC_ROLES?.["Students"] || [];
  const rolesSecondary: string[] =
    occCat2 && OCC_ROLES && OCC_ROLES[occCat2] ? OCC_ROLES[occCat2] : [];

  const onChangeCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOccCat && setOccCat(e.currentTarget.value);
    autosaveFromEvent(e);
  };
  const onChangeCategory2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOccCat2 && setOccCat2(e.currentTarget.value);
    autosaveFromEvent(e);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Owner Assist toggle (same as General; device-only) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.9 }}>
        <input
          id="assistMode_identity"
          type="checkbox"
          checked={assistMode}
          onChange={(e) => setAssistMode(e.currentTarget.checked)}
        />
        <label htmlFor="assistMode_identity">
          <strong>Owner Assist Mode</strong> — disable browser autofill on this device
        </label>
      </div>

      {/* Identity block */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        {/* Sex */}
        <label htmlFor="sex" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Sex</span>
          <select
            id="sex" name="sex" className="gw-input"
            defaultValue={d.sex || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
          >
            <option value="">—</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </label>

        {/* Diet Type */}
        <label htmlFor="dietType" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Diet Type</span>
          <select
            id="dietType" name="dietType" className="gw-input"
            defaultValue={d.dietType || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
          >
            <option value="">—</option>
            <option>Vegan</option>
            <option>Vegetarian</option>
            <option>Eggetarian</option>
            <option>Non-Vegetarian</option>
            <option>All Eater</option>
          </select>
        </label>

        {/* Marital Status */}
        <label htmlFor="maritalStatus" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Status (Marital)</span>
          <select
            id="maritalStatus" name="maritalStatus" className="gw-input"
            defaultValue={d.maritalStatus || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
          >
            <option value="">—</option>
            <option>Bachelor</option>
            <option>Married</option>
            <option>Unmarried</option>
            <option>Widow</option>
            <option>Divorce</option>
            <option>Other</option>
          </select>
        </label>

        {/* If Status = Other */}
        <label htmlFor="statusOther" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">If Status = Other, write here</span>
          <input
            id="statusOther" name="statusOther" className="gw-input"
            defaultValue={d.statusOther || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
          />
        </label>

        {/* Care duties */}
        <label htmlFor="careDuties" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Care duties (dependents, elders)</span>
          <input
            id="careDuties" name="careDuties" className="gw-input"
            defaultValue={d.careDuties || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            placeholder="e.g., 2 kids (5y, 9y) / elderly parent / none"
            autoComplete={ac("off")}
          />
        </label>
      </div>

      {/* Occupation block */}
      <h4 style={{ margin: "8px 0 0 0" }}>Occupation</h4>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        {/* Primary Category */}
        <label htmlFor="occupationCategory" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Category</span>
          <select
            id="occupationCategory" name="occupationCategory" className="gw-input"
            defaultValue={d.occupationCategory || "Students"} disabled={!editMode}
            onChange={onChangeCategory}
            autoComplete={ac("off")}
          >
            <option>Students</option>
            <option>Employed</option>
            <option>Business</option>
            <option>Skilled</option>
            <option>Non-working & Others</option>
          </select>
        </label>

        {/* Primary Role */}
        <label htmlFor="occupationRole" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">Role</span>
          <select
            key={occCat || "Students"}
            id="occupationRole" name="occupationRole" className="gw-input"
            defaultValue={d.occupationRole || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
          >
            <option value="">—</option>
            {(occCat && OCC_ROLES && OCC_ROLES[occCat] ? OCC_ROLES[occCat] : OCC_ROLES?.["Students"] || []).map(
              (r: string) => <option key={r}>{r}</option>
            )}
          </select>
        </label>

        {/* Primary Other */}
        <label htmlFor="occupationOther" style={{ display: "grid", gap: 6 }}>
          <span className="gw-label">If Role = Other, write here</span>
          <input
            id="occupationOther" name="occupationOther" className="gw-input"
            defaultValue={d.occupationOther || ""} disabled={!editMode}
            onChange={autosaveFromEvent}
            autoComplete={ac("off")}
          />
        </label>
      </div>

      {/* Secondary role toggle */}
      <div style={{ marginTop: 4, marginBottom: 4 }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            defaultChecked={!!showSecondaryRole}
            disabled={!editMode}
            onChange={(e) => {
              setShowSecondaryRole && setShowSecondaryRole(e.currentTarget.checked);
              autosaveFromEvent(e as any);
            }}
          />
          <span>Add secondary role (optional)</span>
        </label>
      </div>

      {/* Secondary role block */}
      {showSecondaryRole ? (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
          {/* Secondary Category */}
          <label htmlFor="occupationCategory2" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">Secondary Category</span>
            <select
              id="occupationCategory2" name="occupationCategory2" className="gw-input"
              defaultValue={d.occupationCategory2 || ""} disabled={!editMode}
              onChange={onChangeCategory2}
              autoComplete={ac("off")}
            >
              <option value="">—</option>
              <option>Students</option>
              <option>Employed</option>
              <option>Business</option>
              <option>Skilled</option>
              <option>Non-working & Others</option>
            </select>
          </label>

          {/* Secondary Role */}
          <label htmlFor="occupationRole2" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">Secondary Role</span>
            <select
              key={occCat2 || "none"}
              id="occupationRole2" name="occupationRole2" className="gw-input"
              defaultValue={d.occupationRole2 || ""} disabled={!editMode}
              onChange={autosaveFromEvent}
              autoComplete={ac("off")}
            >
              <option value="">—</option>
              {(occCat2 && OCC_ROLES && OCC_ROLES[occCat2] ? OCC_ROLES[occCat2] : []).map((r: string) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>

          {/* Secondary Other */}
          <label htmlFor="occupationOther2" style={{ display: "grid", gap: 6 }}>
            <span className="gw-label">If Secondary Role = Other, write here</span>
            <input
              id="occupationOther2" name="occupationOther2" className="gw-input"
              defaultValue={d.occupationOther2 || ""} disabled={!editMode}
              onChange={autosaveFromEvent}
              autoComplete={ac("off")}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
};

export default Identity;
