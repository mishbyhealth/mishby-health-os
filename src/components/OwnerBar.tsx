// src/components/OwnerBar.tsx
import React, { useMemo, useState } from "react";

type Props = {
  owner: boolean;
  fullForm: boolean;
  onFullOn: () => void;
  onFullOff: () => void;
  onJumpProfile?: () => void;
  onJumpSchedule?: () => void;
  onJumpHealth?: () => void;
};

function getLockedFromDomOrStorage(): boolean {
  try {
    const attr = document.documentElement.getAttribute("data-locked");
    if (attr === "1") return true;
    const raw = localStorage.getItem("glowell:locked");
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
}

function setLockedEverywhere(next: boolean) {
  try {
    localStorage.setItem("glowell:locked", next ? "1" : "0");
  } catch {}
  try {
    document.documentElement.setAttribute("data-locked", next ? "1" : "0");
  } catch {}
}

export default function OwnerBar({
  owner,
  fullForm,
  onFullOn,
  onFullOff,
  onJumpProfile,
  onJumpSchedule,
  onJumpHealth,
}: Props) {
  if (!owner) return null;

  const initialLocked = useMemo(() => getLockedFromDomOrStorage(), []);
  const [locked, setLocked] = useState<boolean>(initialLocked);

  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    setLockedEverywhere(next);
  };

  return (
    <div
      className="gw-card"
      style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}
    >
      <span className="gw-badge">Owner Tools</span>
      <span className="gw-badge">{fullForm ? "Full Form: ON" : "Full Form: OFF"}</span>
      <span className={`gw-badge ${locked ? "is-active" : ""}`}>{locked ? "Locked" : "Unlocked"}</span>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          type="button"
          className="gw-btn"
          onClick={onFullOn}
          aria-pressed={fullForm}
          title="Show all drawers/sections"
        >
          Full ON
        </button>
        <button
          type="button"
          className="gw-btn"
          onClick={onFullOff}
          aria-pressed={!fullForm}
          title="Hide advanced drawers (keep Today & Labs)"
        >
          Full OFF
        </button>

        {/* Lock / Unlock */}
        <button
          type="button"
          className="gw-btn"
          onClick={toggleLock}
          title="Toggle read-only for the whole app"
        >
          {locked ? "Unlock" : "Lock"}
        </button>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
        <button type="button" className="gw-btn" onClick={onJumpProfile} title="Jump to Profile">
          Profile
        </button>
        <button type="button" className="gw-btn" onClick={onJumpSchedule} title="Jump to Schedule">
          Schedule
        </button>
        <button type="button" className="gw-btn" onClick={onJumpHealth} title="Jump to Health">
          Health
        </button>
      </div>
    </div>
  );
}
