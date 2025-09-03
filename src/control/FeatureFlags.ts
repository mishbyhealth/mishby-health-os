/**
 * src/control/FeatureFlags.ts
 * ---------------------------
 * Central toggle system for features.
 * In development, we keep UI_V3 enabled so the MultiStepHealthForm is visible.
 * Other flags stay off until their phases are ready.
 */

const flags: Record<string, boolean> = {
  UI_V3: true,              // Form visible ✅
  NATURAL_ENGINES_V1: false,
  NAGANO_ENGINE_V1: false,
  EXPORTERS_V2: false,
  THEME_SWITCHER_PUBLIC: false,
};

/**
 * Check if a feature is enabled
 */
export function isEnabled(key: string): boolean {
  return !!flags[key];
}

/**
 * Update flags dynamically (for dev/testing)
 */
export function setFlags(next: Record<string, boolean>) {
  Object.assign(flags, next);
}
