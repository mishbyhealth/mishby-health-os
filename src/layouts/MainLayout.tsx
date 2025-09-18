// src/layouts/MainLayout.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "@/styles/shell.css"; // theme-aware shell variables & global rules
import SideNav from "@/components/SideNav";
import HeaderTools from "@/components/HeaderTools";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";
import OwnerLoginModal from "@/components/OwnerLoginModal";
import ThemeSwitch from "@/components/ThemeSwitch";

/**
 * MainLayout — v18.5.6
 * - Uses CSS variables (--shell-*) so colors follow the active theme.
 * - Syncs documentElement.dataset.theme from localStorage key 'glowell:theme'
 * - NEW: Adds data-route="<route-key>" on <main> so CSS can target a specific page.
 */

const OWNER_KEY = "glowell:ownerUnlocked";
const MAINT_KEY = "glowell:maintenance";
const THEME_KEY = "glowell:theme"; // assumed ThemeSwitch storage key

function lsGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function isOwnerUnlocked(): boolean {
  const v = (lsGet(OWNER_KEY) || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "unlocked";
}
function isMaintOn(): boolean {
  const v = (lsGet(MAINT_KEY) || "").trim().toLowerCase();
  return v === "on" || v === "true" || v === "1" || v === "yes";
}
function ensureThemeDataset() {
  const t = (lsGet(THEME_KEY) || "").trim();
  if (!t) return;
  const lc = t.toLowerCase();
  if (document.documentElement.dataset.theme !== lc) {
    document.documentElement.dataset.theme = lc;
  }
}

export default function MainLayout() {
  const [owner, setOwner] = useState(false);
  const [maintOn, setMaintOn] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const location = useLocation();

  const refreshOwnerMaint = useMemo(
    () => () => {
      setOwner(isOwnerUnlocked());
      setMaintOn(isMaintOn());
    },
    []
  );

  useEffect(() => {
    // initial sync for theme dataset (so shell vars pick the right palette)
    ensureThemeDataset();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (k === OWNER_KEY.toLowerCase() || k === MAINT_KEY.toLowerCase()) refreshOwnerMaint();
      if (k === THEME_KEY.toLowerCase()) ensureThemeDataset();
    };
    const onOwnerEvt = () => refreshOwnerMaint();
    const onMaintEvt = () => refreshOwnerMaint();

    window.addEventListener("storage", onStorage);
    window.addEventListener("glowell:ownerUnlockedChanged" as any, onOwnerEvt);
    window.addEventListener("glowell:maintenanceChanged" as any, onMaintEvt);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("glowell:ownerUnlockedChanged" as any, onOwnerEvt);
      window.removeEventListener("glowell:maintenanceChanged" as any, onMaintEvt);
    };
  }, [refreshOwnerMaint]);

  const toggleMaint = () => {
    const next = !maintOn;
    try { window.localStorage.setItem(MAINT_KEY, next ? "on" : "off"); } catch {}
    try { window.dispatchEvent(new CustomEvent("glowell:maintenanceChanged", { detail: { active: next } })); } catch {}
    setMaintOn(next);
  };

  // route key for CSS targeting (e.g., "health-form", "form-v2", "today", "home")
  const routeKey = (() => {
    let p = location.pathname || "/";
    // strip trailing slashes
    p = p.replace(/\/+$/, "");
    // get first segment
    const seg = p.split("/").filter(Boolean)[0] || "home";
    return seg.toLowerCase();
  })();

  return (
    // Page wrapper: background + text from variables
    <div className="min-h-screen flex bg-[var(--shell-bg)] text-[var(--shell-text)]">
      <SideNav />

      <div className="flex-1 flex flex-col">
        {/* Header uses theme variables */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--shell-header)] border-b border-[var(--shell-border)]">
          {/* Left: ThemeSwitch + Owner login */}
          <div className="flex items-center gap-2">
            <ThemeSwitch />
            {!owner && (
              <button
                type="button"
                onClick={() => setOwnerModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm border-[var(--shell-border)] hover:bg-white/50"
                aria-label="Open owner login"
                title="Owner login"
              >
                <span aria-hidden="true">👤</span>
                <span className="font-medium">Owner</span>
              </button>
            )}
          </div>

          {/* Right: owner quick maintenance + other header tools */}
          <div className="flex items-center gap-2">
            {owner ? (
              <button
                type="button"
                onClick={toggleMaint}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm border-[var(--shell-border)] hover:bg-white/50"
                aria-label="Toggle maintenance mode"
              >
                <span aria-hidden="true">🔒</span>
                <span className="font-medium">{maintOn ? "Update ON" : "Update OFF"}</span>
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-500/80" />
              </button>
            ) : null}

            <HeaderTools />
          </div>
        </div>

        {/* Route outlet */}
        <main className="flex-1" data-route={routeKey}>
          <Outlet />
        </main>
      </div>

      <MaintenanceOverlay />
      <OwnerLoginModal open={ownerModalOpen} onClose={() => setOwnerModalOpen(false)} />
    </div>
  );
}
