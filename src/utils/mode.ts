// src/utils/mode.ts
// GloWell — Mode helpers (owner gate + mode persistence + change events)

export type Mode = "user" | "owner";

const MODE_KEY = "glowell:mode";
const OWNER_OK_KEY = "glowell:owner:ok";
const OWNER_PIN_KEY = "glowell:owner:pin"; // optional: let owner set/override locally

// Default passcode (you can override at runtime):
//   1) window.GLOWELL_OWNER_PIN = "your-secret";
//   2) or set localStorage['glowell:owner:pin'] = "your-secret";
const DEFAULT_OWNER_PIN = "MUKUL1973";

declare global {
  interface Window {
    GLOWELL_OWNER_PIN?: string;
  }
}

export function getMode(): Mode {
  const v = (localStorage.getItem(MODE_KEY) || "user").toLowerCase();
  return v === "owner" ? "owner" : "user";
}

export function setMode(next: Mode) {
  localStorage.setItem(MODE_KEY, next);
  document.documentElement.setAttribute("data-mode", next);
  window.dispatchEvent(new CustomEvent("glowell:modechange", { detail: next }));
}

export function bootMode() {
  const mode = getMode();
  document.documentElement.setAttribute("data-mode", mode);
}

export function isOwnerActive(): boolean {
  return getMode() === "owner" && localStorage.getItem(OWNER_OK_KEY) === "1";
}

export function ownerLogout() {
  // keep mode if you want, but revoke owner-ok so privileged panes hide immediately
  localStorage.removeItem(OWNER_OK_KEY);
  window.dispatchEvent(new CustomEvent("glowell:ownerauthchange", { detail: false }));
}

export async function requestOwner(): Promise<boolean> {
  const pinFromWindow = typeof window !== "undefined" ? window.GLOWELL_OWNER_PIN : undefined;
  const pinFromLS = localStorage.getItem(OWNER_PIN_KEY) || undefined;
  const expected = pinFromWindow || pinFromLS || DEFAULT_OWNER_PIN;

  // Simple prompt flow; later we can replace with a styled modal
  const input = typeof window !== "undefined" ? window.prompt("Enter Owner Passcode") : null;
  if (!input) return false;

  if (input === expected) {
    localStorage.setItem(OWNER_OK_KEY, "1");
    window.dispatchEvent(new CustomEvent("glowell:ownerauthchange", { detail: true }));
    return true;
  }

  alert("Incorrect passcode.");
  return false;
}

/**
 * Switch to target mode with owner gate if needed.
 * Returns true if mode switched, else false.
 */
export async function switchMode(target: Mode): Promise<boolean> {
  const current = getMode();
  if (current === target) return true;

  if (target === "owner") {
    const ok = await requestOwner();
    if (!ok) return false;
  } else {
    // leaving owner mode revokes owner-ok
    ownerLogout();
  }

  setMode(target);
  return true;
}
