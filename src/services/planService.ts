// src/services/planService.ts
// Owner toggle + API helper for the AI Plan stub

const TOGGLE_KEY = 'glowell:aiPlan:on';

// --- Toggle helpers ---
export function getAiPlanEnabled(): boolean {
  try {
    return localStorage.getItem(TOGGLE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAiPlanEnabled(on: boolean): void {
  try {
    localStorage.setItem(TOGGLE_KEY, on ? '1' : '0');
  } catch {
    // ignore storage failures
  }
}

// --- API Helper ---
type IntakeSummary = Record<string, any>;
type Aggregates = {
  d7?: Record<string, any>;
  d14?: Record<string, any>;
  d30?: Record<string, any>;
};

export type PlanJson = {
  packs_applied: string[];
  hydration: Array<{ time: string; ml: number; note?: string }>;
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  movement: string[];
  tips: string[];
  dosha_notes: string;
  disclaimers: string[];
};

// Tries /api/plan first (if you later add a redirect in netlify.toml),
// then falls back to /.netlify/functions/plan (works out of the box).
async function postPlan(body: any): Promise<PlanJson> {
  const headers = { 'Content-Type': 'application/json' };

  // Try preferred path
  try {
    const r1 = await fetch('/api/plan', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (r1.ok) return (await r1.json()) as PlanJson;
  } catch {
    /* fallthrough */
  }

  // Fallback path (default Netlify Functions path)
  const r2 = await fetch('/.netlify/functions/plan', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!r2.ok) {
    throw new Error(`Plan API failed with status ${r2.status}`);
  }
  return (await r2.json()) as PlanJson;
}

export async function requestAiPlan(
  intakeSummary: IntakeSummary = {},
  aggregates: Aggregates = {}
): Promise<PlanJson> {
  const payload = { intakeSummary, aggregates };
  return postPlan(payload);
}
