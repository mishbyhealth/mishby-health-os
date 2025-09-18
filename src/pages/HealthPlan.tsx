// src/pages/HealthPlan.tsx — safe v14 restore (relative imports)
import React from "react";
import { getPlan, isAiPlanEnabled, setAiPlanEnabled, type PlanResponse } from "../services/planService";

const V2_DRAFT_KEYS = ["glowell:draft:v2.2", "glowell:draft:v2.1"];
const CLASSIC_DRAFT_KEYS = ["glowell:draft", "glowell:healthform"];

function readJson(key: string): any | null {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function loadIntake(): any {
  for (const k of V2_DRAFT_KEYS) { const j = readJson(k); if (j && Object.keys(j).length) return j; }
  for (const k of CLASSIC_DRAFT_KEYS) { const j = readJson(k); if (j && Object.keys(j).length) return j; }
  return {};
}
function isOwnerUnlocked(): boolean {
  try {
    return localStorage.getItem("glowell:ownerUnlocked") === "1" ||
           sessionStorage.getItem("glowell:ownerUnlocked") === "1";
  } catch { return false; }
}

export default function HealthPlan() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<PlanResponse | null>(null);
  const [intakePreview, setIntakePreview] = React.useState<string>("");

  React.useEffect(() => {
    const intake = loadIntake();
    const summary = {
      name: intake?.name || intake?.basics?.name || "",
      email: intake?.email || intake?.basics?.email || "",
      mobile: intake?.mobile || intake?.basics?.mobile || "",
      goal: intake?.primaryGoal || intake?.health?.primaryGoal || ""
    };
    setIntakePreview(JSON.stringify(summary, null, 2));
  }, []);

  async function generatePlan() {
    setLoading(true);
    setError(null);
    try {
      const intake = loadIntake();
      const res = await getPlan(intake);
      setPlan(res);
    } catch (e: any) {
      setError(e?.message || "Failed to get plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 980, margin: "24px auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Your Health Plan</h2>
        {isOwnerUnlocked() && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={isAiPlanEnabled()}
              onChange={(e) => setAiPlanEnabled(e.currentTarget.checked)}
            />
            AI Plan Enabled (owner)
          </label>
        )}
      </header>

      <section className="gw-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <h3 style={{ margin: 0 }}>Intake Summary</h3>
          <button className="gw-btn" onClick={generatePlan} disabled={loading}>
            {loading ? "Generating…" : plan ? "Regenerate" : "Generate Plan"}
          </button>
        </div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, margin: "8px 0 0 0", color: "var(--gw-muted,#555)" }}>
{intakePreview}
        </pre>
        {error && <div role="alert" style={{ color: "crimson", marginTop: 8, fontSize: 13 }}>{error}</div>}
      </section>

      {!plan ? (
        <div className="gw-card" style={{ padding: 16, color: "var(--gw-muted,#666)" }}>
          No plan yet. Click <strong>Generate Plan</strong> to create one.
        </div>
      ) : (
        <>
          {isOwnerUnlocked() && (
            <div style={{ marginBottom: 8, fontSize: 12, color: "var(--gw-muted,#666)" }}>
              <span className="gw-badge" style={{ marginRight: 8 }}>source: {plan.source}</span>
              <span className="gw-badge">at: {new Date(plan.generatedAt).toLocaleString()}</span>
            </div>
          )}

          <section className="gw-card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Hydration</h3>
            <div><strong>Target:</strong> {plan.hydration.targetLiters.toFixed(1)} L/day</div>
            <div><strong>Pulses:</strong> {plan.hydration.pulses.join(", ")}</div>
            {plan.hydration.tips?.length ? <ul style={{ margin: "6px 0 0 16px" }}>{plan.hydration.tips.map((t,i)=><li key={i}>{t}</li>)}</ul> : null}
          </section>

          <section className="gw-card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Meals</h3>
            <div><strong>Pattern:</strong> {plan.meals.pattern}</div>
            {plan.meals.tips?.length ? <ul style={{ margin: "6px 0 0 16px" }}>{plan.meals.tips.map((t,i)=><li key={i}>{t}</li>)}</ul> : null}
          </section>

          <section className="gw-card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Movement</h3>
            <ul style={{ margin: "6px 0 0 16px" }}>
              {plan.movement.plan.map((p,i)=><li key={i}><strong>{p.time}:</strong> {p.activity}</li>)}
            </ul>
            {plan.movement.tips?.length ? <ul style={{ margin: "6px 0 0 16px" }}>{plan.movement.tips.map((t,i)=><li key={i}>{t}</li>)}</ul> : null}
          </section>

          <section className="gw-card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>General Tips</h3>
            <ul style={{ margin: "6px 0 0 16px" }}>{plan.tips.map((t,i)=><li key={i}>{t}</li>)}</ul>
          </section>
        </>
      )}
    </div>
  );
}
