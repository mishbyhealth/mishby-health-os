// src/utils/formPersistence.ts
// Draft helpers + debounced autosave (React hook). Additive; safe.

export function loadDraft<T = any>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveDraft<T = any>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

import { useEffect, useRef } from "react";

export function useAutosave<T>(key: string, value: T, delayMs = 600) {
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    // @ts-ignore
    timerRef.current = window.setTimeout(() => saveDraft(key, value), delayMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [key, value, delayMs]);
}
