// src/utils/plan/saveLastPlan.ts

/**
 * saveLastPlan
 * Writes a compact snapshot of the plan into localStorage key: "glowell:lastPlan".
 *
 * - Keeps storage key STABLE as per project guardrails.
 * - Emits a lightweight CustomEvent("glowell:lastPlanChanged") for any listeners.
 *
 * Technical (Hindi):
 * - localStorage: ब्राउज़र की छोटी स्टोरेज, key-value format में
 * - Snapshot: प्लान का छोटा सार (id, title, summary) ताकि Plans पेज fast लोड हो
 */

const LAST_PLAN_KEY = "glowell:lastPlan";

export type CompactPlan = {
  id?: string;
  title?: string;
  summary?: string;
  // Allow any extra fields your app already stores (additive, not restrictive)
  [k: string]: any;
};

function toCompact(plan: any): CompactPlan {
  if (!plan || typeof plan !== "object") return {};
  const compact: CompactPlan = {
    id: plan.id ?? plan.planId ?? plan.uuid ?? undefined,
    title: plan.title ?? plan.name ?? "Your Plan",
    summary: plan.summary ?? plan.overview ?? plan.desc ?? "",
  };
  // Copy-through known lightweight extras if present (safe + additive)
  for (const k of ["updatedAt", "createdAt", "tags", "score"]) {
    if (k in plan) compact[k] = plan[k];
  }
  return compact;
}

export function saveLastPlan(plan: any) {
  try {
    const compact = toCompact(plan);
    const json = JSON.stringify(compact);
    window.localStorage.setItem(LAST_PLAN_KEY, json);

    // Notify anybody interested (e.g., Plans page in future)
    try {
      window.dispatchEvent(
        new CustomEvent("glowell:lastPlanChanged", { detail: { key: LAST_PLAN_KEY, plan: compact } })
      );
    } catch {
      /* no-op */
    }
  } catch {
    // If localStorage is full or JSON fails, we fail silently by design (non-blocking)
  }
}
