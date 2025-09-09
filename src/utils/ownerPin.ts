// src/utils/ownerPin.ts
const PIN_HASH_KEY = "glowell:owner:pinHash";
const UNLOCK_KEY = "glowell:owner:unlocked";
const MODE_KEY = "glowell:mode";

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function hasPin(): boolean {
  try { return !!localStorage.getItem(PIN_HASH_KEY); } catch { return false; }
}

export async function setPin(newPin: string) {
  const hash = await sha256(newPin);
  try { localStorage.setItem(PIN_HASH_KEY, hash); } catch {}
}

export function isUnlocked(): boolean {
  try { return sessionStorage.getItem(UNLOCK_KEY) === "1"; } catch { return false; }
}

export function lockOwner() {
  try {
    sessionStorage.removeItem(UNLOCK_KEY);
    localStorage.setItem(MODE_KEY, "user");
    document.documentElement.setAttribute("data-mode", "user");
  } catch {}
}

export async function unlockWithPin(pin: string): Promise<boolean> {
  try {
    const saved = localStorage.getItem(PIN_HASH_KEY);
    const hash = await sha256(pin);
    const ok = !!saved && saved === hash;
    if (ok) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      localStorage.setItem(MODE_KEY, "owner");
      document.documentElement.setAttribute("data-mode", "owner");
    }
    return ok;
  } catch {
    return false;
  }
}
