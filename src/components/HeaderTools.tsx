// src/components/HeaderTools.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * HeaderTools (Owner-only, resilient) — v17.6
 * - Owner-only UI in header: "Owner Tools" label, Owner badge, AI Plan toggle, ⚙️ Settings
 * - Keeps mounted even when locked; hides via invisible stub so listeners keep running
 * - Detects unlock via localStorage + sessionStorage, events, tab visibility, gentle 1s polling
 * - NEW: Tiny status light that blinks ~700ms whenever AI Plan toggles (visual confirmation only)
 */

type HeaderToolsProps = {
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
};

function storGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v1 = window.localStorage.getItem(key);
    if (v1 != null) return v1;
    const v2 = window.sessionStorage?.getItem?.(key) ?? null;
    return v2;
  } catch {
    return null;
  }
}
function storSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function isTruthyToken(s: string) {
  const v = s.trim().toLowerCase();
  return (
    v === "1" || v === "true" || v === "yes" || v === "on" ||
    v === "unlock" || v === "unlocked" || v === "open"
  );
}
function isTruthyValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    if (isTruthyToken(v)) return true;
    try {
      const json = JSON.parse(v);
      if (json && typeof json === "object" && "unlocked" in json) return Boolean((json as any).unlocked);
    } catch {}
    return false;
  }
  if (typeof v === "object" && v !== null && "unlocked" in (v as any)) return Boolean((v as any).unlocked);
  return false;
}

function readOwnerUnlockedKnownKeys(): boolean {
  const known = [
    "glowell:ownerUnlocked",
    "glowell:owner:unlocked",
    "glowell:ownerState",
    "ownerUnlocked",
    "owner:unlocked",
    "glowell:lockOwnerMode",
  ];
  for (const k of known) {
    const v = storGet(k);
    if (isTruthyValue(v)) return true;
  }
  return false;
}
function readOwnerUnlockedScanAnyOwnerKey(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      if (k.toLowerCase().includes("owner")) {
        const v = storGet(k);
        if (isTruthyValue(v)) return true;
      }
    }
    if (window.sessionStorage) {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (!k) continue;
        if (k.toLowerCase().includes("owner")) {
          const v = storGet(k);
          if (isTruthyValue(v)) return true;
        }
      }
    }
  } catch {}
  return false;
}
function hasDevOverride(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("owner") === "1") return true;
    if ((window.location.hash || "").toLowerCase().includes("owner")) return true;
    if ((window as any).__GLOWELL_OWNER__ === true) return true;
  } catch {}
  return false;
}
function readOwnerUnlocked(): boolean {
  return readOwnerUnlockedKnownKeys() || readOwnerUnlockedScanAnyOwnerKey() || hasDevOverride();
}
function readAiEnabled(): boolean {
  return storGet("glowell:aiPlanEnabled") === "true";
}

export default function HeaderTools({
  className = "",
  compact = false,
  showLabel = true,
}: HeaderToolsProps) {
  const [ownerUnlocked, setOwnerUnlocked] = useState<boolean>(false);
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);

  // NEW: micro status light (blinks briefly on AI toggle)
  const [blink, setBlink] = useState<boolean>(false);
  const blinkTimer = useRef<number | null>(null);

  const navigate = useNavigate();

  const refresh = useMemo(
    () => () => {
      setOwnerUnlocked(readOwnerUnlocked());
      setAiEnabled(readAiEnabled());
    },
    []
  );

  useEffect(() => {
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (k.includes("owner") || k === "glowell:aiplanenabled") refresh();
    };
    window.addEventListener("storage", onStorage);

    const onHash = () => refresh();
    const onPop = () => refresh();
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onPop);

    const onOwnerChanged = () => refresh();
    window.addEventListener("glowell:ownerUnlockedChanged" as any, onOwnerChanged);
    window.addEventListener("glowell:owner:changed" as any, onOwnerChanged);

    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);

    const t = window.setInterval(refresh, 1000);

    (window as any).glowellDebugOwner = () => {
      const result = {
        ownerUnlocked: readOwnerUnlocked(),
        scanUnlocked: readOwnerUnlockedScanAnyOwnerKey(),
        devOverride: hasDevOverride(),
      };
      console.log("[GloWell] Owner debug:", result);
      return result;
    };

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("glowell:ownerUnlockedChanged" as any, onOwnerChanged);
      window.removeEventListener("glowell:owner:changed" as any, onOwnerChanged);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(t);
      try { delete (window as any).glowellDebugOwner; } catch {}
      if (blinkTimer.current) window.clearTimeout(blinkTimer.current);
    };
  }, [refresh]);

  const handleToggleAI = () => {
    const next = !aiEnabled;
    setAiEnabled(next);
    storSet("glowell:aiPlanEnabled", next ? "true" : "false");
    try {
      window.dispatchEvent(new CustomEvent("glowell:aiPlanEnabledChanged", { detail: { enabled: next } }));
    } catch {}

    // Trigger micro-blink for ~700ms
    setBlink(true);
    if (blinkTimer.current) window.clearTimeout(blinkTimer.current);
    blinkTimer.current = window.setTimeout(() => setBlink(false), 700);
  };

  const goSettings = () => {
    try { navigate("/settings"); } catch { window.location.href = "/settings"; }
  };

  const pad = compact ? "px-2 py-1" : "px-3 py-1.5";
  const gap = compact ? "gap-2" : "gap-3";
  const text = compact ? "text-xs" : "text-sm";
  const tooltipText = aiEnabled
    ? "AI Plan is ON — auto-suggests plan tweaks. Click to turn OFF."
    : "AI Plan is OFF — no auto-suggestions. Click to turn ON.";

  // Keep mounted even when locked → render hidden placeholder
  if (!ownerUnlocked) {
    return <span data-owner-tools="hidden" style={{ display: "none" }} />;
  }

  return (
    <div className={`flex items-center ${gap} ${className}`} aria-label="Header tools (Owner)">
      {/* Owner-only text hint */}
      {showLabel && (
        <span className={`mr-2 ${text} text-gray-500 select-none`} aria-live="polite">
          Owner Tools
        </span>
      )}

      {/* Owner badge */}
      <div
        className={`inline-flex items-center ${gap} rounded-full border ${pad} ${text}`}
        title="Owner: Unlocked"
      >
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden="true" />
        <span className="font-medium">Owner: Unlocked</span>
      </div>

      {/* AI Plan toggle */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleToggleAI}
          className={`inline-flex items-center ${gap} rounded-full border ${pad} ${text} transition hover:bg-gray-50`}
          aria-pressed={aiEnabled}
          aria-describedby="ai-plan-tooltip"
          aria-label="Toggle AI Plan"
          title={tooltipText}
        >
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              aiEnabled ? "bg-blue-500" : "bg-gray-300"
            }`}
            aria-hidden="true"
          />
          <span className="font-medium">AI Plan: {aiEnabled ? "ON" : "OFF"}</span>
          <span className="ml-1 inline-block border rounded-full leading-none px-1 text-[10px]">
            i
          </span>
        </button>

        {/* Tooltip */}
        <div
          id="ai-plan-tooltip"
          role="tooltip"
          className="pointer-events-none absolute -top-2 right-0 translate-y-[-100%] opacity-0
                     group-hover:opacity-100 group-hover:translate-y-[-110%]
                     group-focus-within:opacity-100 group-focus-within:translate-y-[-110%]
                     transition shadow-md rounded-md border bg-white px-2 py-1 text-xs w-max max-w-[18rem]"
        >
          {tooltipText}
        </div>
      </div>

      {/* Settings shortcut */}
      <button
        type="button"
        onClick={goSettings}
        className={`inline-flex items-center ${gap} rounded-full border ${pad} ${text} transition hover:bg-gray-50`}
        aria-label="Open Settings"
        title="Open Settings"
      >
        <span className="font-semibold" aria-hidden="true">⚙️</span>
        <span className="font-medium">Settings</span>
      </button>

      {/* NEW: Micro status light — owner-only visual confirmation */}
      <span
        aria-hidden="true"
        className={`ml-2 inline-block h-2.5 w-2.5 rounded-full transition
          ${blink ? (aiEnabled ? "bg-blue-500 scale-110" : "bg-gray-400 scale-110") : "bg-transparent scale-100"}`}
        title={blink ? (aiEnabled ? "AI Plan toggled ON" : "AI Plan toggled OFF") : ""}
      />
    </div>
  );
}
