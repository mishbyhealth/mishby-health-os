// src/utils/theme.ts
export type Theme =
  | "classic" | "mint" | "sky" | "lavender" | "sunset" | "forest" | "slate";

export const THEMES: Theme[] = ["classic","mint","sky","lavender","sunset","forest","slate"];
const THEME_KEY = "glowell:theme";
const LOCK_KEY  = "glowell:lock";

export function loadTheme(): Theme {
  try { const t = localStorage.getItem(THEME_KEY) as Theme | null; if (t && THEMES.includes(t)) return t; } catch {}
  return "classic";
}
export function saveTheme(t: Theme){ try { localStorage.setItem(THEME_KEY, t); } catch {} }

export function applyTheme(t: Theme){
  document.documentElement.setAttribute("data-theme", t);
}

export function loadLock(): boolean {
  try {
    const env = (import.meta as any).env?.VITE_GLOWWELL_LOCK;
    if (env === "1") return true;
    const s = localStorage.getItem(LOCK_KEY);
    return s === "1";
  } catch { return false; }
}
export function saveLock(locked: boolean){
  try { localStorage.setItem(LOCK_KEY, locked ? "1" : "0"); } catch {}
  document.documentElement.setAttribute("data-locked", locked ? "1" : "0");
}
