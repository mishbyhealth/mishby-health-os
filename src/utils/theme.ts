// src/utils/theme.ts
export const THEMES = ["classic","mint","sky","lavender","sunset","forest","slate"] as const;
export type ThemeName = typeof THEMES[number];

const THEME_KEY = "glowell:theme";
const LOCK_KEY  = "glowell:lock";

export function loadTheme(): ThemeName {
  const v = localStorage.getItem(THEME_KEY);
  return (THEMES.includes(v as ThemeName) ? (v as ThemeName) : "classic");
}
export function saveTheme(t: ThemeName) {
  localStorage.setItem(THEME_KEY, t);
}
export function applyTheme(t: ThemeName) {
  document.documentElement.setAttribute("data-theme", t);
}

export function loadLock(): boolean {
  try { return localStorage.getItem(LOCK_KEY) === "1"; } catch { return false; }
}
export function saveLock(on: boolean) {
  localStorage.setItem(LOCK_KEY, on ? "1" : "0");
  document.documentElement.setAttribute("data-locked", on ? "1" : "0");
  window.dispatchEvent(new CustomEvent("glowell:lock-change", { detail: on }));
}
export function toggleLock(): boolean {
  const next = !loadLock();
  saveLock(next);
  return next;
}
