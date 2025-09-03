/**
 * ComplianceGuard2 — Non-clinical safety filter
 * - Scrubs medical claims, prescriptions, dosages, and risky language
 * - Appends a visible, universal wellness disclaimer
 * - Returns sanitized plan + list of violations
 *
 * Self-contained types here to avoid external deps in Phase 0.
 */

export type Plan = {
  hydration?: string[];
  movement?: string[];
  meals?: string[];
  tips?: string[];
  disclaimer?: string;
  meta?: { generatedAt?: string; source?: string };
};

export type GuardViolation = {
  section: keyof Plan | 'general';
  text: string;
  reason: string;
  suggestion?: string;
};

export type GuardResult = {
  safePlan: Plan;
  violations: GuardViolation[];
};

const BANNED_PATTERNS: { re: RegExp; reason: string; suggestion?: string }[] = [
  { re: /\b(prescribe|prescription|rx)\b/i, reason: 'No prescriptions allowed', suggestion: 'Use neutral wellness guidance' },
  { re: /\b(diagnose|diagnosis|prognosis)\b/i, reason: 'No medical diagnosis', suggestion: 'Use “general wellbeing signal” wording' },
  { re: /\b(treat|cure|heal)\b/i, reason: 'No treatment/claims', suggestion: 'Use “support”, “may help”, “general tip”' },
  { re: /\b(antibiotic|statin|metformin|insulin|ssri|steroid|ace inhibitor)\b/i, reason: 'No medicines', suggestion: 'Do not mention drug names' },
  { re: /\b(dose|dosage|tablet|capsule|pill|injection|mg|mcg|ml)\b/i, reason: 'No dosing language', suggestion: 'Avoid units and dosing' },
  { re: /\b(emergency|critical|severe|acute)\b/i, reason: 'Avoid alarming clinical severity terms' },
];

const DEFAULT_DISCLAIMER =
  'This is neutral, non-clinical wellness content. It is not medical advice, diagnosis, or treatment. ' +
  'For any symptoms or conditions, consult a licensed healthcare professional.';

// ---- helpers

function sanitizeLine(line: string, violations: GuardViolation[], section: keyof Plan | 'general'): string {
  let out = line;
  for (const rule of BANNED_PATTERNS) {
    if (rule.re.test(out)) {
      violations.push({ section, text: line, reason: rule.reason, suggestion: rule.suggestion });
      out = out.replace(rule.re, '[redacted]');
    }
  }
  // soften absolute claims
  out = out.replace(/\b(guarantees?|will|certainly|100%)\b/gi, 'may');
  return out.trim();
}

function sanitizeBlock(block: string[] | undefined, key: keyof Plan, violations: GuardViolation[]): string[] | undefined {
  if (!block) return block;
  return block.map((line) => sanitizeLine(line, violations, key)).filter(Boolean);
}

function appendDisclaimer(plan: Plan): Plan {
  const existing = (plan.disclaimer || '').trim();
  const merged = existing
    ? `${existing} ${DEFAULT_DISCLAIMER}`
    : DEFAULT_DISCLAIMER;
  return { ...plan, disclaimer: merged };
}

// ---- main API

export function runComplianceGuard2(plan: Plan): GuardResult {
  const violations: GuardViolation[] = [];

  const safePlan: Plan = {
    hydration: sanitizeBlock(plan.hydration, 'hydration', violations),
    movement: sanitizeBlock(plan.movement, 'movement', violations),
    meals: sanitizeBlock(plan.meals, 'meals', violations),
    tips: sanitizeBlock(plan.tips, 'tips', violations),
    meta: plan.meta || { generatedAt: new Date().toISOString(), source: 'ComplianceGuard2' },
  };

  const withDisclaimer = appendDisclaimer(safePlan);
  return { safePlan: withDisclaimer, violations };
}

/** Throw if any hard violation should block display/export (Phase 0 = always allow, only redact). */
export function assertCompliantOrThrow(_result: GuardResult): void {
  // In Phase 0 we do not block — only redaction + disclaimer.
  return;
}

/** Utility: convenience wrapper */
export function guardAndGet(plan: Plan): Plan {
  const res = runComplianceGuard2(plan);
  assertCompliantOrThrow(res);
  return res.safePlan;
}
