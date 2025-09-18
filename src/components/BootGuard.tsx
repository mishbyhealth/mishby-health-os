// src/components/BootGuard.tsx
import React from "react";

/**
 * BootGuard
 * - If URL has #safe or localStorage["glowell:safe-boot"] === "true",
 *   render a tiny “Safe Mode” shell that never pulls advanced modules.
 * - Otherwise, render children normally.
 */
export function BootGuard({ children }: { children: React.ReactNode }) {
  const [safe, setSafe] = React.useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const h = window.location.hash || "";
      const ls = window.localStorage.getItem("glowell:safe-boot");
      return h.includes("#safe") || ls === "true";
    } catch {
      return false;
    }
  });

  const exitSafe = () => {
    try { window.localStorage.removeItem("glowell:safe-boot"); } catch {}
    if (window.location.hash.includes("safe")) {
      window.location.hash = "";
    }
    setSafe(false);
    // full reload to restore normal app graph
    window.location.reload();
  };

  if (!safe) return <>{children}</>;

  // Minimal shell — no routes, no heavy imports
  const box: React.CSSProperties = {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    padding: "24px",
    maxWidth: 900,
    margin: "40px auto",
    borderRadius: 14,
    boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
    background: "#fff",
    color: "#111",
  };
  const btn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #d0d7de",
    background: "#f6f8fa",
    cursor: "pointer",
  };
  const link: React.CSSProperties = { color: "#0b61a4", textDecoration: "underline" };

  return (
    <div style={box}>
      <h2 style={{ marginTop: 0 }}>🛟 GloWell — Safe Mode</h2>
      <p>
        The app started in a protective shell. Use this to clear drafts/locks or open a basic page
        without loading advanced modules.
      </p>
      <ul>
        <li>
          <a style={link} href="/" onClick={(e)=>{ e.preventDefault(); window.location.assign("/"); }}>Open “/” (Home)</a>
        </li>
        <li>
          <button
            style={btn}
            onClick={() => {
              try {
                // Clean common state keys that sometimes crash on load
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("glowell:"))
                  .forEach((k) => localStorage.removeItem(k));
                alert("Cleared glowell:* keys from localStorage.");
              } catch {}
            }}
          >
            🧹 Clear glowell:* localStorage
          </button>
        </li>
        <li>
          <button style={btn} onClick={exitSafe}>🚪 Exit Safe Mode</button>
        </li>
      </ul>
      <p style={{ fontSize: 12, color: "#444" }}>
        Tip: If you contact me with a crash, click “Copy error details” from the red screen first.
      </p>
    </div>
  );
}
