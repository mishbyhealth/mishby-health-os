// mho/plan/useGeneratePlan.ts
// Normalize → validate (AJV) → call engine.buildPlan/generate.
// Includes a tiny React hook wrapper, but safe to use as plain functions.

import { useCallback, useMemo } from "react";

// AJV + schema
import { makeAjv } from "../form/ajv";
import schema from "../form/healthForm.schema.json";

// Normalizer
import { normalizeProfile } from "../engine/normalize";

// Engine (signature may vary across branches; use conservative any)
import * as Engine from "../engine/index";

export interface GenerateResult {
  ok: boolean;
  normalized?: unknown;
  plan?: unknown;
  errors?: string[];
}

type AjvValidate = (data: unknown) => boolean & { errors?: any[] };

// Compile AJV validator once (module scope)
let _validator: AjvValidate | null = null;
function getValidator(): AjvValidate {
  if (_validator) return _validator;
  const ajv = makeAjv();
  _validator = ajv.compile(schema) as AjvValidate;
  return _validator!;
}

/** Plain function: normalize → validate → engine.build */
export async function generatePlan(profile: unknown): Promise<GenerateResult> {
  const normalized = normalizeProfile(profile);
  const validate = getValidator();
  const valid = validate(normalized);

  if (!valid) {
    const errs = (validate as any).errors || [];
    const msgs = errs.map((e: any) =>
      [e.instancePath || e.dataPath || "", e.message || "invalid"]
        .filter(Boolean)
        .join(" ")
    );
    return { ok: false, normalized, errors: msgs.length ? msgs : ["Validation failed"] };
  }

  try {
    const builder =
      (Engine as any).buildPlan ||
      (Engine as any).generate ||
      (Engine as any).default ||
      null;

    if (typeof builder !== "function") {
      return { ok: false, normalized, errors: ["Engine build function not found"] };
    }

    const maybe = builder(normalized);
    const plan =
      maybe && typeof (maybe as Promise<any>).then === "function"
        ? await (maybe as Promise<any>)
        : maybe;

    return { ok: true, normalized, plan };
  } catch (err: any) {
    return { ok: false, normalized, errors: [err?.message || String(err) || "Engine error"] };
  }
}

/** Minimal React hook wrapper */
export function useGeneratePlan() {
  const validate = useMemo(() => getValidator(), []);
  const normalize = useCallback((p: unknown) => normalizeProfile(p), []);
  const run = useCallback(async (p: unknown): Promise<GenerateResult> => generatePlan(p), []);
  return { validate, normalize, generate: run };
}

export default useGeneratePlan;
