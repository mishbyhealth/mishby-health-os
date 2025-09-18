// src/components/MaintenanceOverlay.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * MaintenanceOverlay — v18.0
 * - Shows a full-screen overlay when maintenance is active.
 * - Key: glowell:maintenance  (values: "on" | "true" | "1" → active)
 * - Owner-only control: when Owner is unlocked, shows a button to END update.
 * - Listens to storage/visibility/custom events; also checks every 1s (gentle).
 */

const MAINT_KEY = "glowell:maintenance";
const OWNER_KEY = "glowell:ownerUnlocked";

function storGet(key: string): string | null {
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? window.sessionStorage?.getItem?.(key) ?? null : v;
  } catch {
    return null;
  }
}
function storSet(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch {}
}
function isOn(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "on" || s === "true" || s === "1" || s === "yes";
  }
  if (typeof v === "number") return v === 1;
  if (typeof v === "boolean") return v;
  return false;
}
function isOwnerUnlocked(): boolean {
  const v = storGet(OWNER_KEY);
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "unlocked";
}

export default function MaintenanceOverlay() {
  const [active, setActive] = useState<boolean>(false);
  const [owner, setOwner] = useState<boolean>(false);

  const refresh = useMemo(
    () => () => {
      setActive(isOn(storGet(MAINT_KEY)));
      setOwner(isOwnerUnlocked());
    },
    []
  );

  useEffect(() => {
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (k === MAINT_KEY.toLowerCase() || k === OWNER_KEY.toLowerCase()) refresh();
    };
    const onVis = () => document.visibilityState === "visible" && refresh();
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("glowell:maintenanceChanged" as any, onCustom);
    window.addEventListener("glowell:ownerUnlockedChanged" as any, onCustom);

    // gentle heartbeat
    const t = window.setInterval(refresh, 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("glowell:maintenanceChanged" as any, onCustom);
      window.removeEventListener("glowell:ownerUnlockedChanged" as any, onCustom);
      window.clearInterval(t);
    };
  }, [refresh]);

  if (!active) return null;

  const endUpdate = () => {
    storSet(MAINT_KEY, "off");
    try {
      window.dispatchEvent(new CustomEvent("glowell:maintenanceChanged", { detail: { active: false } }));
    } catch {}
    refresh();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backdropFilter: "blur(3px)" }}
    >
      {/* dark translucent backdrop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" />

      {/* card */}
      <div className="relative z-10 max-w-lg mx-4 rounded-2xl bg-white shadow-xl border p-6 text-center pointer-events-auto">
        <div className="text-2xl font-semibold mb-2">Sorry for interruption</div>
        <div className="text-gray-700 mb-4">
          Update is running. Please check back in a few minutes.
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
          <span>Maintenance Mode</span>
        </div>

        {owner ? (
          <button
            type="button"
            onClick={endUpdate}
            className="mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
            aria-label="End maintenance and unlock app"
            title="End maintenance and unlock app"
          >
            ✅ End update (unlock app)
          </button>
        ) : null}
      </div>
    </div>
  );
}
