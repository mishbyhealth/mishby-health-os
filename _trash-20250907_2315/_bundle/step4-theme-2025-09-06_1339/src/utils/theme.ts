// src/utils/theme.ts
// Single source of truth for theme + owner lock
export type Theme =
  | "classic"
  | "mint"
  | "sky"
  | "lavender"
  | "sunset"
  | "forest"
  | "slate";

export const THEMES: Theme[] = [
  "classic",
  "mint",
  "sky",
  "lavender",
  "sunset",
  "forest",
  "slate",
];

const THEME_KEY = "glowell:theme";
const LOCK_KEY = "glowell:lock";

/** Read persisted theme; fallback classic */
export function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY) as Theme | null;
    if (t && THEMES.includes(t)) return t;
  } catch {}
  return "classic";
}

export function saveTheme(t: Theme) {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {}
}

/** Apply theme by setting [data-theme] on <html> */
export function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t);
}

/** Next theme name in the cycle */
export function nextTheme(t: Theme): Theme {
  const i = THEMES.indexOf(t);
  const j = (i < 0 ? 0 : i + 1) % THEMES.length;
  return THEMES[j];
}

/** Environment default for lock (Vite) */
function envLockDefault(): boolean {
  try {
    const v = (import.meta as any)?.env?.VITE_GLOWWELL_LOCK;
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

/** Load lock: localStorage wins; else env default */
export function loadLock(): boolean {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === "1" || v === "true") return true;
    if (v === "0" || v === "false") return false;
  } catch {}
  return envLockDefault();
}

/** Persist + apply lock flag to <html data-locked="0|1"> */
export function saveLock(locked: boolean) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {}
  const root = document.documentElement;
  root.setAttribute("data-locked", locked ? "1" : "0");
}

/** Boot helper: apply both theme & lock once */
export function bootThemeAndLock() {
  const t = loadTheme();
  applyTheme(t);
  const locked = loadLock();
  document.documentElement.setAttribute("data-locked", locked ? "1" : "0");
}
