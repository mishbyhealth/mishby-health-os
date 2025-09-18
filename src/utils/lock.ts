// src/utils/lock.ts  (compat API: initLockFromStorage, isLocked, setLocked)
const KEY = "glowell:lock";
type Listener = (locked: boolean) => void;
let listeners: Listener[] = [];

export function isLocked(): boolean {
  try { return localStorage.getItem(KEY) === "true"; } catch { return false; }
}

export function setLocked(v: boolean): void {
  try { localStorage.setItem(KEY, v ? "true" : "false"); } catch {}
  try { document.documentElement.setAttribute("data-maintenance", v ? "true" : "false"); } catch {}
  listeners.forEach(fn => { try { fn(v); } catch {} });
}

// backward-compat export
export function initLockFromStorage(): void {
  setLocked(isLocked());
}

export function onLockChange(fn: Listener): () => void {
  listeners.push(fn);
  return () => { listeners = listeners.filter(f => f !== fn); };
}

try {
  window.addEventListener("storage", (e) => { if (e.key === KEY) initLockFromStorage(); });
  initLockFromStorage();
} catch {}
