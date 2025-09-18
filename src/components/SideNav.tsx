// src/components/SideNav.tsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

/**
 * SideNav — v18.5
 * - Uses theme variables for background/border/text so it follows selected theme.
 * - Keeps the visibility rule for Settings (ownerUnlocked || deviceTrusted).
 */

const OWNER_UNLOCK_KEY = "glowell:ownerUnlocked";
const OWNER_DEVICE_KEY = "glowell:ownerDeviceTrusted";

function lsGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function isTruthy(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes" || s === "on" || s === "unlocked";
  }
  return false;
}
function isOwnerUnlocked(): boolean {
  return isTruthy(lsGet(OWNER_UNLOCK_KEY));
}
function isOwnerDeviceTrusted(): boolean {
  const v = (lsGet(OWNER_DEVICE_KEY) || "").trim();
  return v === "1";
}

type Item = { to: string; label: string; icon?: React.ReactNode; hideWhenLocked?: boolean };

const TOP_ITEMS: Item[] = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/health-form", label: "Health Form", icon: "📝" },
  { to: "/form-v2", label: "Form V2", icon: "🧩" },
  { to: "/today", label: "Today Tracker", icon: "📅" },
  { to: "/health-plan", label: "Health Plan", icon: "❤️" },
  { to: "/plans", label: "Plans", icon: "🗂️" },
];

const BOTTOM_ITEMS: Item[] = [
  { to: "/settings", label: "Settings", icon: "⚙️", hideWhenLocked: true },
  { to: "/subscription", label: "Subscription", icon: "💳" },
  { to: "/donate", label: "Donate", icon: "🎁" },
  { to: "/about", label: "About", icon: "ℹ️" },
  { to: "/terms", label: "Terms & Conditions", icon: "📜" },
  { to: "/_ping", label: "_ping", icon: "📶" },
];

function SideLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-md px-3 py-2 transition",
          "text-[var(--shell-text)]/85 hover:bg-white/50",
          isActive ? "bg-white/70 font-medium" : "",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function SideNav() {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [trusted, setTrusted] = useState<boolean>(false);

  const refresh = useMemo(
    () => () => {
      setUnlocked(isOwnerUnlocked());
      setTrusted(isOwnerDeviceTrusted());
    },
    []
  );

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (k === OWNER_UNLOCK_KEY.toLowerCase() || k === OWNER_DEVICE_KEY.toLowerCase()) refresh();
    };
    const onOwnerChanged = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener("glowell:ownerUnlockedChanged" as any, onOwnerChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("glowell:ownerUnlockedChanged" as any, onOwnerChanged);
    };
  }, [refresh]);

  const canSeeSettings = unlocked || trusted;

  return (
    <aside
      className={[
        "w-56 shrink-0 border-r",
        "bg-[var(--shell-sidenav)] border-[var(--shell-border)]",
      ].join(" ")}
    >
      <div className="p-3 text-lg font-semibold text-[var(--shell-text)]">GloWell</div>

      <nav className="px-2 space-y-1">
        {TOP_ITEMS.map((it) => (
          <SideLink key={it.to} to={it.to}>
            {it.icon ? <span aria-hidden="true">{it.icon}</span> : null}
            <span>{it.label}</span>
          </SideLink>
        ))}
      </nav>

      <div className="my-3 border-t border-[var(--shell-border)]" />

      <nav className="px-2 space-y-1 pb-4">
        {BOTTOM_ITEMS.map((it) => {
          if (it.to === "/settings" && !canSeeSettings) return null;
          return (
            <SideLink key={it.to} to={it.to}>
              {it.icon ? <span aria-hidden="true">{it.icon}</span> : null}
              <span>{it.label}</span>
            </SideLink>
          );
        })}
      </nav>
    </aside>
  );
}
