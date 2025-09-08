// src/utils/owner.ts
// Shim helpers so pages can read owner/full-form state safely.

import { isOwnerActive } from "@/utils/mode";

const FULL_KEY = "glowell:fullForm";

/** Are owner tools currently unlocked? */
export function isOwner(): boolean {
  try {
    return isOwnerActive();
  } catch {
    return false;
  }
}

/** Read the Full Health-Form visibility flag. */
export function getFullForm(): boolean {
  try {
    return localStorage.getItem(FULL_KEY) === "1";
  } catch {
    return false;
  }
}

/** For legacy callers. */
export function isFullForm(): boolean {
  return getFullForm();
}

/** Update Full Health-Form flag + <html data-fullform>. */
export function setFullForm(on: boolean): void {
  try {
    localStorage.setItem(FULL_KEY, on ? "1" : "0");
    document.documentElement.setAttribute("data-fullform", on ? "1" : "0");
  } catch {
    /* no-op */
  }
}
