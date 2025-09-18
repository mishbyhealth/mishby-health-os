// src/services/planService.ts
// v17.7d-hotfix-2 — Back-compat exports: `getPlan`, `isAiPlanEnabled`, `setAiPlanEnabled`
// plus our v17.7d behavior (save compact plan to `glowell:lastPlan`).

import { saveLastPlan } from "@/utils/plan/saveLastPlan";

// ---------- Types (kept loose so callers don't break) ----------
export type PlanInput = {
  goals?: string;
  age?: number | string;
  gender?: string;
  [k: string]: any;
};

export type Plan = {
  id?: string;
  title?: string;
  summary?: string;
  steps?: Array<{ title?: string; detail?: string }>;
  [k: string]: any;
};

// ---------- Small helpers for AI Plan flag (back-compat) ----------
const AI_KEY = "glowell:aiPlanEnabled";

/** Read AI Plan flag from storage. */
export function isAiPlanEnabled(): boolean {
  try {
    return window.localStorage.getItem(AI_KEY) === "true";
  } catch {
    return false;
  }
}

/** Write AI Plan flag and notify listeners. */
export function setAiPlanEnabled(value: boolean): void {
  try {
    window.localStorage.setItem(AI_KEY, value ? "true" : "false");
    try {
      window.dispatchEvent(
        new CustomEvent("glowell:aiPlanEnabledChanged", { detail: { enabled: value } })
      );
    } catch {
      /* no-op */
    }
  } catch {
    /* no-op */
  }
}

// ---------- Env ----------
function isProd(): boolean {
  try {
    return (import.meta as any).env?.PROD === true;
  } catch {
    return false;
  }
}

// ---------- DEV MOCK ----------
async function mockGeneratePlan(input: PlanInput): Promise<Plan> {
  const g = (input?.goals ?? "").toString();
  const h = Array.from(g).reduce((a, c) => (a + c.charCodeAt(0)) % 997, 0);
  const id = `dev-${Date.now()}-${h}`;

  const plan: Plan = {
    id,
    title: g ? `Health Plan for: ${g.slice(0, 40)}` : "Your Personal Health Plan",
    summary:
      "This is a DEV mock plan. In production, the server will generate a tailored plan based on your inputs.",
    steps: [
      { title: "Hydration", detail: "Drink 7–8 glasses of water daily." },
      { title: "Movement", detail: "Walk 20–30 minutes, 5 days a week." },
      { title: "Sleep", detail: "Aim for 7–8 hours of consistent sleep." },
    ],
    source: "DEV_MOCK",
    createdAt: new Date().toISOString(),
  };

  // Save compact copy for /plans page
  saveLastPlan(plan);
  return plan;
}

// ---------- PROD API ----------
async function apiGeneratePlan(input: PlanInput): Promise<Plan> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });

  if (!res.ok) {
    throw new Error(`Plan API failed (${res.status})`);
  }

  const data = (await res.json()) as Plan;

  // Save compact copy for /plans page
  saveLastPlan(data);

  return data;
}

// ---------- Public API (stable) ----------
export async function generatePlan(input: PlanInput): Promise<Plan> {
  if (isProd()) return apiGeneratePlan(input);
  return mockGeneratePlan(input);
}

/**
 * Back-compat alias:
 * Some pages import { getPlan } from this module.
 * Keep that working by exporting `getPlan` mapped to `generatePlan`.
 */
export const getPlan = generatePlan;

// Default export with all public members (for any default imports)
export const planService = { generatePlan, getPlan, isAiPlanEnabled, setAiPlanEnabled };
export default planService;
