// src/utils/ownerPin.ts — tiny owner PIN helper

const PIN_KEY = "glowell:ownerPin";
const UNLOCK_KEY = "glowell:ownerUnlocked";

export function getOwnerPin(): string {
  try {
    const v = localStorage.getItem(PIN_KEY);
    return v && v.length >= 4 ? v : "2468";
  } catch { return "2468"; }
}

export function setOwnerPin(newPin: string): boolean {
  const pin = String(newPin || "").trim();
  if (pin.length < 4) return false;
  try { localStorage.setItem(PIN_KEY, pin); return true; } catch { return false; }
}

export function isOwnerUnlocked(): boolean {
  try {
    return (
      sessionStorage.getItem(UNLOCK_KEY) === "1" ||
      localStorage.getItem(UNLOCK_KEY) === "1"
    );
  } catch { return false; }
}

export function unlockWithPin(inputPin: string): boolean {
  const ok = String(inputPin || "").trim() === getOwnerPin();
  try { if (ok) sessionStorage.setItem(UNLOCK_KEY, "1"); } catch {}
  return ok;
}

export function lockOwner(): void {
  try {
    sessionStorage.removeItem(UNLOCK_KEY);
    localStorage.removeItem(UNLOCK_KEY);
  } catch {}
}
