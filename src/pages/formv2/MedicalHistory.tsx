import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * GloWell — FormV2: Medical History (Lite, local only)
 *
 * Scope:
 *  - chronic conditions
 *  - past surgeries / hospitalizations (with year)
 *  - significant past illnesses
 *  - family history
 *  - vaccinations
 *  - women’s history (optional)
 *  - lifestyle risks (tobacco/alcohol)
 *  - last known labs
 *
 * Storage (unchanged):
 *  - Autosave to localStorage key: "glowell:draft:v2.2"
 *  - Merge under draft.medicalHistory (no new keys introduced)
 *
 * Notes:
 *  - NO Shell/MainLayout import here. Route-level layout wraps this page.
 */

const DRAFT_KEY = "glowell:draft:v2.2";

type SurgeryEntry = {
  procedure: string;
  year: string; // keep as free text: "YYYY"
  notes?: string;
};

type LifestyleRisks = {
  tobacco: {
    uses: boolean;
    type?: "smoking" | "chewing" | "occasionally" | "other" | "";
    amountPerDay?: string;
    years?: string;
  };
  alcohol: {
    uses: boolean;
    frequency?: "rare" | "weekly" | "daily" | "occasionally" | "";
    unitsPerWeek?: string;
  };
};

type MedicalHistoryDraft = {
  chronicConditions: string[];
  pastSurgeries: SurgeryEntry[];
  pastIllnesses: string;
  familyHistory: string;
  vaccinations: string;
  womensHistory?: string;
  lifestyleRisks: LifestyleRisks;
  lastKnownLabs: string;
};

type DraftShape = {
  medicalHistory?: MedicalHistoryDraft;
  // other pages' data stays here unmodified
};

/* ---------- utils ---------- */

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return (JSON.parse(raw) ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function loadDraft(): DraftShape {
  return safeParse<DraftShape>(localStorage.getItem(DRAFT_KEY), {});
}

function saveDraft(next: DraftShape) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
}

/** Debounced autosave with “first render” guard */
function useAutosave<T>(value: T, onSave: (v: T) => void, delay = 500) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => onSave(value), delay);
    return () => clearTimeout(t);
  }, [value, onSave, delay]);
}

/* ---------- initial data ---------- */

const initialRisks: LifestyleRisks = {
  tobacco: { uses: false, type: "", amountPerDay: "", years: "" },
  alcohol: { uses: false, frequency: "", unitsPerWeek: "" },
};

const initialHistory: MedicalHistoryDraft = {
  chronicConditions: [],
  pastSurgeries: [],
  pastIllnesses: "",
  familyHistory: "",
  vaccinations: "",
  womensHistory: "",
  lifestyleRisks: initialRisks,
  lastKnownLabs: "",
};

const allCommonChronics = [
  "Hypertension",
  "Diabetes",
  "Thyroid Disorder",
  "CKD / Kidney Disease",
  "Heart Disease",
  "Asthma / COPD",
  "Arthritis",
  "Migraine",
  "Anemia",
  "High Cholesterol",
  "PCOS/PCOD",
  "Other",
];

/* ---------- page ---------- */

export default function MedicalHistory() {
  // seed from existing draft
  const draft = useMemo(loadDraft, []);
  const [state, setState] = useState<MedicalHistoryDraft>(
    draft.medicalHistory ?? initialHistory
  );

  // autosave (merge under draft.medicalHistory only)
  useAutosave(state, (v) => {
    const curr = loadDraft();
    saveDraft({ ...curr, medicalHistory: v });
  });

  /* helpers */

  const toggleChronic = (item: string) => {
    setState((s) => {
      const set = new Set(s.chronicConditions);
      set.has(item) ? set.delete(item) : set.add(item);
      return { ...s, chronicConditions: Array.from(set) };
    });
  };

  const addSurgery = () => {
    setState((s) => ({
      ...s,
      pastSurgeries: [...s.pastSurgeries, { procedure: "", year: "" }],
    }));
  };

  const updateSurgery = (idx: number, patch: Partial<SurgeryEntry>) => {
    setState((s) => {
      const list = [...s.pastSurgeries];
      list[idx] = { ...list[idx], ...patch };
      return { ...s, pastSurgeries: list };
    });
  };

  const removeSurgery = (idx: number) => {
    setState((s) => ({
      ...s,
      pastSurgeries: s.pastSurgeries.filter((_, i) => i !== idx),
    }));
  };

  /* render */

  return (
    <div className="p-4 md:p-6">
      <div className="p-4 md:p-6 border-l-4 rounded-md shadow-sm border-green-600 bg-white">
        <h1 className="text-2xl font-semibold mb-1">Medical History</h1>
        <p className="text-sm mb-4">
          Fill only what you know now. You can edit later. (Auto-saved locally)
        </p>

        {/* Chronic Conditions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Chronic Conditions (Long-term)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {allCommonChronics.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state.chronicConditions.includes(c)}
                  onChange={() => toggleChronic(c)}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Past Surgeries / Hospitalizations */}
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Past Surgeries / Hospitalizations
            </h2>
            <button
              className="px-3 py-1 rounded-md border text-sm"
              type="button"
              onClick={addSurgery}
            >
              + Add
            </button>
          </div>

          {state.pastSurgeries.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No entries yet.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {state.pastSurgeries.map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md border bg-gray-50 flex flex-col gap-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs">Procedure / Reason</label>
                      <input
                        className="w-full p-2 border rounded"
                        placeholder="e.g., Appendectomy"
                        value={row.procedure}
                        onChange={(e) =>
                          updateSurgery(idx, { procedure: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs">Year</label>
                      <input
                        className="w-full p-2 border rounded"
                        placeholder="YYYY"
                        value={row.year}
                        onChange={(e) =>
                          updateSurgery(idx, { year: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs">Notes (optional)</label>
                      <input
                        className="w-full p-2 border rounded"
                        placeholder="Any important details"
                        value={row.notes ?? ""}
                        onChange={(e) =>
                          updateSurgery(idx, { notes: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      className="px-2 py-1 text-sm rounded border"
                      type="button"
                      onClick={() => removeSurgery(idx)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Significant Past Illnesses */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Significant Past Illnesses</h2>
          <textarea
            className="w-full p-2 border rounded mt-1 min-h-[80px]"
            placeholder="e.g., Dengue (2019); Jaundice (childhood)…"
            value={state.pastIllnesses}
            onChange={(e) =>
              setState((s) => ({ ...s, pastIllnesses: e.target.value }))
            }
          />
        </section>

        {/* Family History */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Family History</h2>
          <textarea
            className="w-full p-2 border rounded mt-1 min-h-[80px]"
            placeholder="e.g., Father: Hypertension; Mother: Diabetes"
            value={state.familyHistory}
            onChange={(e) =>
              setState((s) => ({ ...s, familyHistory: e.target.value }))
            }
          />
        </section>

        {/* Vaccinations */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Vaccinations</h2>
          <textarea
            className="w-full p-2 border rounded mt-1 min-h-[80px]"
            placeholder="e.g., Tetanus (2023), Flu (2024), COVID booster (2024)…"
            value={state.vaccinations}
            onChange={(e) =>
              setState((s) => ({ ...s, vaccinations: e.target.value }))
            }
          />
        </section>

        {/* Women’s History (optional) */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Women’s History (if applicable)</h2>
          <textarea
            className="w-full p-2 border rounded mt-1 min-h-[80px]"
            placeholder="e.g., Menstrual health notes, pregnancies, menopause status…"
            value={state.womensHistory ?? ""}
            onChange={(e) =>
              setState((s) => ({ ...s, womensHistory: e.target.value }))
            }
          />
        </section>

        {/* Lifestyle Risks */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Lifestyle Risks</h2>

          <div className="p-3 border rounded mb-3">
            <h3 className="font-medium mb-2">Tobacco</h3>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input
                type="checkbox"
                checked={state.lifestyleRisks.tobacco.uses}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    lifestyleRisks: {
                      ...s.lifestyleRisks,
                      tobacco: {
                        ...s.lifestyleRisks.tobacco,
                        uses: e.target.checked,
                      },
                    },
                  }))
                }
              />
              Uses tobacco
            </label>

            {state.lifestyleRisks.tobacco.uses && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs">Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={state.lifestyleRisks.tobacco.type ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        lifestyleRisks: {
                          ...s.lifestyleRisks,
                          tobacco: {
                            ...s.lifestyleRisks.tobacco,
                            type: e.target.value as any,
                          },
                        },
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="smoking">Smoking</option>
                    <option value="chewing">Chewing</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs">Amount per day</label>
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="e.g., 3–4"
                    value={state.lifestyleRisks.tobacco.amountPerDay ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        lifestyleRisks: {
                          ...s.lifestyleRisks,
                          tobacco: {
                            ...s.lifestyleRisks.tobacco,
                            amountPerDay: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs">Years</label>
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="e.g., 10"
                    value={state.lifestyleRisks.tobacco.years ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        lifestyleRisks: {
                          ...s.lifestyleRisks,
                          tobacco: {
                            ...s.lifestyleRisks.tobacco,
                            years: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border rounded">
            <h3 className="font-medium mb-2">Alcohol</h3>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input
                type="checkbox"
                checked={state.lifestyleRisks.alcohol.uses}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    lifestyleRisks: {
                      ...s.lifestyleRisks,
                      alcohol: {
                        ...s.lifestyleRisks.alcohol,
                        uses: e.target.checked,
                      },
                    },
                  }))
                }
              />
              Uses alcohol
            </label>

            {state.lifestyleRisks.alcohol.uses && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs">Frequency</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={state.lifestyleRisks.alcohol.frequency ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        lifestyleRisks: {
                          ...s.lifestyleRisks,
                          alcohol: {
                            ...s.lifestyleRisks.alcohol,
                            frequency: e.target.value as any,
                          },
                        },
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="rare">Rare</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="occasionally">Occasionally</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs">Units / Week</label>
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="e.g., 2–3"
                    value={state.lifestyleRisks.alcohol.unitsPerWeek ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        lifestyleRisks: {
                          ...s.lifestyleRisks,
                          alcohol: {
                            ...s.lifestyleRisks.alcohol,
                            unitsPerWeek: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Last Known Labs */}
        <section className="mb-2">
          <h2 className="text-lg font-semibold">Last Known Labs</h2>
          <textarea
            className="w-full p-2 border rounded mt-1 min-h-[100px]"
            placeholder="e.g., HBA1c 7.2% (Aug 2025); Creatinine 1.3; LDL 120; Vit D 24…"
            value={state.lastKnownLabs}
            onChange={(e) =>
              setState((s) => ({ ...s, lastKnownLabs: e.target.value }))
            }
          />
          <p className="text-xs text-gray-600 mt-1">
            Tip: Paste values exactly as seen in reports. You can refine later.
          </p>
        </section>
      </div>
    </div>
  );
}
