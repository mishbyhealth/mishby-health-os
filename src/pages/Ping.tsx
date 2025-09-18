import React, { useEffect, useMemo, useState } from "react";

/**
 * GloWell — Ping (v18.7)
 * Small, safe UI polish so Ping follows the unified card/border pattern.
 *
 * - No new storage keys, no logic changes outside this page
 * - Reads a few existing keys to show status (read-only):
 *     glowell:theme, glowell:locked, glowell:ownerPin?, glowell:themeFrozen?,
 *     glowell:maintBannerText? (from v18.6), glowell:settingsBackup? (snapshot)
 * - Uses shell.css styling via simple "card/content" containers (light surface, dark borders, white buttons)
 *
 * Tech words (सरल हिन्दी):
 * - "Ping": एक छोटा स्टेटस पेज जो बताता है कि ऐप चल रहा है (health check)
 * - "Read-only": सिर्फ़ दिखाना; कोई बदलाव नहीं किया जाता
 */

const THEME_KEY = "glowell:theme";
const LOCK_KEY = "glowell:locked";
const PIN_KEY = "glowell:ownerPin";
const FROZEN_KEY = "glowell:themeFrozen";
const SNAPSHOT_KEY = "glowell:settingsBackup";
const BANNER_TEXT_KEY = "glowell:maintBannerText";

function getLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export default function Ping() {
  // Basic runtime info
  const [now, setNow] = useState<string>(new Date().toLocaleString());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleString()), 1000);
    return () => clearInterval(t);
  }, []);

  // Read-only app status (localStorage)
  const theme = useMemo(() => getLS(THEME_KEY) || "classic", []);
  const locked = useMemo(() => getLS(LOCK_KEY) === "true", []);
  const ownerPinSet = useMemo(() => !!getLS(PIN_KEY), []);
  const frozen = useMemo(() => getLS(FROZEN_KEY) === "true", []);
  const banner = useMemo(() => getLS(BANNER_TEXT_KEY) || "", []);
  const snapshot = useMemo(() => getLS(SNAPSHOT_KEY), []);

  // Simple helper: safe parse of snapshot (show short preview)
  const snapshotShort = useMemo(() => {
    if (!snapshot) return "—";
    try {
      const obj = JSON.parse(snapshot);
      const when = obj?.savedAt || obj?.exportedAt || "unknown";
      return `snapshot @ ${when}`;
    } catch {
      return "snapshot (unreadable)";
    }
  }, [snapshot]);

  return (
    <main className="gw-page" data-route="_ping" style={{ padding: 16 }}>
      {/* Header strip */}
      <section className="content card" style={{ padding: 14, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>GloWell — _ping</h1>
        <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
          App is running. (हिन्दी: ऐप चल रहा है)
        </p>
      </section>

      {/* Basic time & environment */}
      <section className="content card" style={{ padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 8 }}>Environment</h2>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 8 }}>
          <div style={{ opacity: 0.7 }}>Local Time</div>
          <div>{now}</div>

          <div style={{ opacity: 0.7 }}>User Agent</div>
          <div style={{ wordBreak: "break-word" }}>{navigator.userAgent}</div>

          <div style={{ opacity: 0.7 }}>Viewport</div>
          <div>{`${window.innerWidth} × ${window.innerHeight}`}</div>
        </div>
      </section>

      {/* App status pulled from existing localStorage keys (read-only) */}
      <section className="content card" style={{ padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 8 }}>App Status (read-only)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 8 }}>
          <div style={{ opacity: 0.7 }}>Theme</div>
          <div><code>{theme}</code></div>

          <div style={{ opacity: 0.7 }}>Locked</div>
          <div><code>{String(locked)}</code></div>

          <div style={{ opacity: 0.7 }}>Theme Frozen</div>
          <div><code>{String(frozen)}</code></div>

          <div style={{ opacity: 0.7 }}>Owner PIN Set</div>
          <div><code>{String(ownerPinSet)}</code></div>

          <div style={{ opacity: 0.7 }}>Maint. Banner</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{banner || "—"}</div>

          <div style={{ opacity: 0.7 }}>Backup Snapshot</div>
          <div><code>{snapshotShort}</code></div>
        </div>
      </section>

      {/* Small action row (no mutations to settings; safe UI actions only) */}
      <section className="content card" style={{ padding: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 8 }}>Quick Checks</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Buttons are white with dark borders via global CSS */}
          <button onClick={() => window.location.reload()}>Reload Page</button>
          <button onClick={() => alert("Ping OK")}>Test Alert</button>
          <button
            onClick={() => {
              // Non-destructive: copy a tiny status text to clipboard
              const txt = `GloWell _ping OK — ${new Date().toISOString()}`;
              navigator.clipboard?.writeText(txt);
              alert("Copied short status text to clipboard.");
            }}
          >
            Copy Status Text
          </button>
        </div>
      </section>
    </main>
  );
}
