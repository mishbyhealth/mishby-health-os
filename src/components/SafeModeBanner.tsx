// src/components/SafeModeBanner.tsx  (no pink crash bar; only small safe/maintenance bar)
import React from "react";

const SAFE_KEY = "glowell:safe-boot";
const CRASH_KEY = "glowell:last-crash";

function isSafeActive() {
  try {
    const ls = window.localStorage.getItem(SAFE_KEY) === "true";
    const h = window.location.hash || "";
    return ls || h.includes("#safe");
  } catch { return false; }
}
function isMaintenance() {
  try {
    return document.documentElement.getAttribute("data-maintenance") === "true";
  } catch { return false; }
}

export default function SafeModeBanner() {
  const [safe, setSafe] = React.useState(false);
  const [maintenance, setMaintenance] = React.useState(false);

  React.useEffect(() => {
    try { window.localStorage.removeItem(CRASH_KEY); } catch {}
    setSafe(isSafeActive());
    setMaintenance(isMaintenance());
    const onHash = () => setSafe(isSafeActive());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const enterSafe = () => {
    try { window.localStorage.setItem(SAFE_KEY, "true"); } catch {}
    if (!location.hash.includes("safe")) location.hash = "#safe";
    location.reload();
  };
  const exitSafe = () => {
    try { window.localStorage.removeItem(SAFE_KEY); } catch {}
    if (location.hash.includes("safe")) location.hash = "";
    location.reload();
  };

  if (!safe && !maintenance) return null;

  const bar: React.CSSProperties = {
    position: "fixed",
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 10px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize: 13,
    background: maintenance ? "#e7f3ff" : "#fff5c7",
    color: "#111",
    borderBottom: "1px solid rgba(0,0,0,0.08)"
  };
  const btn: React.CSSProperties = {
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid #d0d7de",
    background: "#f6f8fa",
    cursor: "pointer",
    marginLeft: 6
  };

  return (
    <div style={bar}>
      <div>
        {maintenance && <span>🔒 Maintenance Mode (writes blocked)</span>}
        {safe && !maintenance && <span>🛟 Safe Mode active</span>}
      </div>
      <div>
        {safe ? (
          <button style={btn} onClick={exitSafe}>Exit Safe</button>
        ) : (
          <button style={btn} onClick={enterSafe}>Enter Safe</button>
        )}
      </div>
    </div>
  );
}
