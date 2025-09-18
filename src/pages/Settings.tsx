import React, { useEffect, useMemo, useState } from "react";

/**
 * GloWell — Settings (v18.6)
 * New: Owner Maintenance Banner (Settings-only, owner-only)
 *  - Shows when glowell:locked === "true" (even before unlock)
 *  - Owner can edit banner text after unlocking; auto-saves
 *
 * Keeps v18.5 features:
 *  - Lock/Unlock (PIN gate)
 *  - Theme Picker (freeze-aware) + Theme Freeze
 *  - Backup/Restore (file) + Local auto-snapshot
 *
 * Storage keys (existing + new):
 *  - glowell:theme
 *  - glowell:locked
 *  - glowell:ownerPin
 *  - glowell:themeFrozen
 *  - glowell:settingsBackup
 *  - glowell:maintBannerText      (NEW: optional, Settings-only)
 */

const THEME_KEY = "glowell:theme";
const LOCK_KEY = "glowell:locked";
const PIN_KEY = "glowell:ownerPin";
const FROZEN_KEY = "glowell:themeFrozen";
const SNAPSHOT_KEY = "glowell:settingsBackup";
const BANNER_TEXT_KEY = "glowell:maintBannerText";

const THEMES = [
  "classic",
  "mint",
  "sky",
  "lavender",
  "sunset",
  "ocean",
  "forest",
  "rose",
  "slate",
  "sand",
  "dark",
] as const;
type ThemeName = (typeof THEMES)[number];

type BackupPayloadFile = {
  version: "v18.3" | "v18.4" | "v18.5" | "v18.6";
  exportedAt: string; // ISO
  keys: Record<string, string | null>;
};

type BackupSnapshotLocal = {
  version: "v18.6";
  savedAt: string; // ISO
  keys: Record<string, string | null>;
};

function getLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function setLS(key: string, val: string) {
  localStorage.setItem(key, val);
}
function delLS(key: string) {
  localStorage.removeItem(key);
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Save a lightweight snapshot in LocalStorage (no network)
function saveSnapshot() {
  const snapshot: BackupSnapshotLocal = {
    version: "v18.6",
    savedAt: new Date().toISOString(),
    keys: {
      [THEME_KEY]: getLS(THEME_KEY),
      [LOCK_KEY]: getLS(LOCK_KEY),
      [PIN_KEY]: getLS(PIN_KEY),
      [FROZEN_KEY]: getLS(FROZEN_KEY),
      [BANNER_TEXT_KEY]: getLS(BANNER_TEXT_KEY),
    },
  };
  try {
    setLS(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota errors
  }
}

export default function Settings() {
  // --- Lock state & PIN ---
  const [locked, setLocked] = useState<boolean>(() => getLS(LOCK_KEY) === "true");
  const [pinInput, setPinInput] = useState("");
  const ownerPin = useMemo(() => getLS(PIN_KEY), [locked]);

  // --- Theme & Frozen ---
  const [themeFrozen, setThemeFrozen] = useState<boolean>(() => getLS(FROZEN_KEY) === "true");
  const [theme, setTheme] = useState<ThemeName>(() => {
    const t = (getLS(THEME_KEY) || "classic") as ThemeName;
    return THEMES.includes(t) ? t : "classic";
  });

  // --- Banner text (Settings-only, owner-only to edit) ---
  const [bannerText, setBannerText] = useState<string>(() => {
    return getLS(BANNER_TEXT_KEY) || "Maintenance mode is ON. Users won’t see this notice.";
  });

  // Reflect theme attr on <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial sync + snapshot
  useEffect(() => {
    const t = getLS(THEME_KEY) as ThemeName | null;
    if (t && THEMES.includes(t)) {
      setTheme(t);
      document.documentElement.setAttribute("data-theme", t);
    } else {
      document.documentElement.setAttribute("data-theme", "classic");
    }
    setThemeFrozen(getLS(FROZEN_KEY) === "true");
    const bt = getLS(BANNER_TEXT_KEY);
    if (bt) setBannerText(bt);

    saveSnapshot();
  }, []);

  // Helpers
  const safeSetTheme = (t: ThemeName) => {
    if (themeFrozen) {
      alert("Theme is frozen. Unfreeze it to change.");
      return;
    }
    setTheme(t);
    setLS(THEME_KEY, t);
    document.documentElement.setAttribute("data-theme", t);
    saveSnapshot();
  };

  // Lock/Unlock
  const handleUnlock = () => {
    if (!ownerPin) {
      alert("No Owner PIN is set yet. Please set a new Owner PIN below.");
      return;
    }
    if (pinInput.trim() === ownerPin) {
      setLS(LOCK_KEY, "false");
      setLocked(false);
      setPinInput("");
      saveSnapshot();
    } else {
      alert("Incorrect PIN.");
    }
  };
  const handleLock = () => {
    setLS(LOCK_KEY, "true");
    setLocked(true);
    saveSnapshot();
  };

  // PIN Save
  const [newPin, setNewPin] = useState("");
  const saveNewPin = () => {
    const v = newPin.trim();
    if (v.length < 4) {
      alert("PIN must be at least 4 digits/characters.");
      return;
    }
    setLS(PIN_KEY, v);
    setNewPin("");
    saveSnapshot();
    alert("Owner PIN saved.");
  };

  // Freeze toggle
  const toggleFreeze = () => {
    const next = !themeFrozen;
    setThemeFrozen(next);
    setLS(FROZEN_KEY, String(next));
    saveSnapshot();
  };

  // File Backup / Restore
  const handleExport = () => {
    const payload: BackupPayloadFile = {
      version: "v18.6",
      exportedAt: new Date().toISOString(),
      keys: {
        [THEME_KEY]: getLS(THEME_KEY),
        [LOCK_KEY]: getLS(LOCK_KEY),
        [PIN_KEY]: getLS(PIN_KEY),
        [FROZEN_KEY]: getLS(FROZEN_KEY),
        [BANNER_TEXT_KEY]: getLS(BANNER_TEXT_KEY),
      },
    };
    downloadText("glowell-settings-backup-v18.6.json", JSON.stringify(payload, null, 2));
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const data = JSON.parse(text) as BackupPayloadFile;

        if (!data || typeof data !== "object" || !data.keys) {
          throw new Error("Invalid file.");
        }

        const { keys } = data;

        // Only known keys
        if (typeof keys[THEME_KEY] !== "undefined") {
          const val = keys[THEME_KEY];
          if (typeof val === "string" || val === null) {
            if (val && THEMES.includes(val as ThemeName)) {
              setLS(THEME_KEY, val);
              setTheme(val as ThemeName);
              document.documentElement.setAttribute("data-theme", val as string);
            } else if (val === null) {
              delLS(THEME_KEY);
              setTheme("classic");
              document.documentElement.setAttribute("data-theme", "classic");
            }
          }
        }
        if (typeof keys[LOCK_KEY] !== "undefined") {
          const val = keys[LOCK_KEY];
          if (val === "true" || val === "false") {
            setLS(LOCK_KEY, val);
            setLocked(val === "true");
          }
        }
        if (typeof keys[PIN_KEY] !== "undefined") {
          const val = keys[PIN_KEY];
          if (typeof val === "string" || val === null) {
            if (val) setLS(PIN_KEY, val);
            else delLS(PIN_KEY);
          }
        }
        if (typeof keys[FROZEN_KEY] !== "undefined") {
          const val = keys[FROZEN_KEY];
          if (val === "true" || val === "false") {
            setLS(FROZEN_KEY, val);
            setThemeFrozen(val === "true");
          }
        }
        if (typeof keys[BANNER_TEXT_KEY] !== "undefined") {
          const val = keys[BANNER_TEXT_KEY];
          if (typeof val === "string" || val === null) {
            if (val) {
              setLS(BANNER_TEXT_KEY, val);
              setBannerText(val);
            } else {
              delLS(BANNER_TEXT_KEY);
              setBannerText("Maintenance mode is ON. Users won’t see this notice.");
            }
          }
        }

        saveSnapshot();
        alert("Settings restored. If colors didn’t refresh, reload the page.");
      } catch (e: any) {
        alert("Could not import file. " + (e?.message || ""));
      }
    };
    reader.readAsText(file);
  };

  // --- Small UI atoms ---
  const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
    <section className="content card" style={{ padding: 16, marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h2>
      {children}
    </section>
  );

  const ThemeSwatch: React.FC<{
    name: ThemeName;
    active: boolean;
    frozen: boolean;
    onClick: () => void;
  }> = ({ name, active, frozen, onClick }) => (
    <button
      onClick={onClick}
      title={frozen ? `${name} (frozen)` : name}
      disabled={frozen}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: 10,
        borderRadius: 12,
        border: active ? "2px solid var(--shell-border)" : "1.5px solid var(--shell-border)",
        background: "#fff",
        cursor: frozen ? "not-allowed" : "pointer",
        minWidth: 110,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        opacity: frozen ? 0.6 : 1,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background:
            name === "dark"
              ? "linear-gradient(135deg,#0b0c0d 0%,#2b2d30 100%)"
              : "linear-gradient(135deg,#e8f0ff 0%,#ffffff 100%)",
          border: "1px solid var(--shell-border)",
        }}
      />
      <span style={{ textTransform: "capitalize" }}>{name}</span>
      {active && <span style={{ marginLeft: "auto", opacity: 0.7 }}>✓</span>}
    </button>
  );

  // --- Maintenance Banner (Settings-only) ---
  const MaintenanceBanner: React.FC = () => {
    if (!locked) return null; // show only when locked
    return (
      <div
        className="content card"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          marginBottom: 12,
          padding: 12,
          border: "1.25px solid var(--shell-border)",
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--card-bg), #fff 25%), var(--card-bg))",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <strong>Owner Notice:</strong>
          <span>{bannerText}</span>
          <span style={{ marginLeft: "auto", opacity: 0.6 }}>
            (Visible only on Settings; users don’t see this)
          </span>
        </div>
      </div>
    );
  };

  return (
    <main className="gw-page" data-route="settings" style={{ padding: 16 }}>
      <div className="stack">
        {/* Settings-only Owner Maintenance Banner */}
        <MaintenanceBanner />

        {/* Status strip */}
        <section className="content card" style={{ padding: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div><strong>Theme:</strong> <code>{theme}</code></div>
            <div><strong>Locked:</strong> <code>{String(locked)}</code></div>
            <div><strong>Theme Frozen:</strong> <code>{String(themeFrozen)}</code></div>
          </div>
        </section>

        {locked ? (
          <>
            {/* When locked, show unlock UI below the banner */}
            <Section title="Unlock (Owner Only)">
              {/* हिन्दी: Unlock = ताला खोलना; PIN सही डालने पर Settings खुलेंगी */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="password"
                  placeholder="Enter Owner PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  style={{ padding: 8, minWidth: 220 }}
                />
                <button onClick={handleUnlock}>Unlock</button>
              </div>
              <p style={{ marginTop: 8, opacity: 0.75 }}>
                If you don’t have a PIN yet, unlock once and set it below.
                <br />
                (हिन्दी: अगर PIN सेट नहीं है, owner पहले unlock करें और नीचे नया PIN सेट करें)
              </p>
            </Section>
          </>
        ) : (
          <>
            {/* v18.6: Edit Banner text (owner-only, after unlock) */}
            <Section title="Maintenance Banner (Settings-only)">
              <p style={{ margin: "6px 0 12px", opacity: 0.8 }}>
                Edit the owner-only notice shown at the top of Settings when the app is locked.
                <br />
                (हिन्दी: App लॉक होने पर Settings के ऊपर जो नोटिस दिखता है, उसका टेक्स्ट यहाँ बदलें)
              </p>
              <textarea
                rows={3}
                style={{ width: "100%", padding: 10, borderRadius: 10 }}
                value={bannerText}
                onChange={(e) => {
                  const v = e.target.value;
                  setBannerText(v);
                  setLS(BANNER_TEXT_KEY, v);
                  saveSnapshot();
                }}
              />
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    const def = "Maintenance mode is ON. Users won’t see this notice.";
                    setBannerText(def);
                    setLS(BANNER_TEXT_KEY, def);
                    saveSnapshot();
                  }}
                >
                  Reset Banner Text
                </button>
                <button onClick={handleLock}>Simulate Lock (Show Banner)</button>
              </div>
            </Section>

            {/* Theme Protection (Freeze) */}
            <Section title="Theme Protection (Freeze)">
              <p style={{ margin: "6px 0 12px", opacity: 0.8 }}>
                Freeze prevents theme changes. Unfreeze to allow changes again.
                <br />
                (हिन्दी: Freeze करने पर थीम बदलेगी नहीं; Unfreeze करके फिर बदल सकते हैं)
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => toggleFreeze()}>
                  {themeFrozen ? "Unfreeze Theme" : "Freeze Theme"}
                </button>
                <span style={{ opacity: 0.75 }}>
                  Status: <strong>{themeFrozen ? "Frozen" : "Editable"}</strong>
                </span>
              </div>
            </Section>

            {/* Theme Picker (freeze-aware) */}
            <Section title="Theme (Instant Preview + Save)">
              <p style={{ margin: "6px 0 12px", opacity: 0.8 }}>
                {themeFrozen
                  ? "Theme is frozen — swatches are disabled."
                  : "Pick a theme. It applies instantly and saves to your browser."}
                <br />
                (हिन्दी: {themeFrozen ? "थीम फ्रीज़ है — बदल नहीं सकते।" : "थीम चुनें — तुरंत दिखेगी और सेव हो जाएगी।"})
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {THEMES.map((t) => (
                  <ThemeSwatch
                    key={t}
                    name={t}
                    active={theme === t}
                    frozen={themeFrozen}
                    onClick={() => safeSetTheme(t)}
                  />
                ))}
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  disabled={themeFrozen}
                  onClick={() => safeSetTheme("classic")}
                >
                  Reset Theme to Classic
                </button>
              </div>
            </Section>

            {/* Owner Lock */}
            <Section title="Owner Lock">
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={handleLock}>Lock Settings</button>
                <span style={{ opacity: 0.75 }}>This hides Settings until unlocked.</span>
              </div>
            </Section>

            {/* Owner PIN */}
            <Section title="Owner PIN">
              {/* हिन्दी: Owner PIN = मालिक का पासकोड; इससे Settings सुरक्षित रहती हैं */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="password"
                  placeholder="Set/Change Owner PIN (min 4 chars)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  style={{ padding: 8, minWidth: 260 }}
                />
                <button onClick={saveNewPin}>Save PIN</button>
              </div>
            </Section>

            {/* Backup / Restore */}
            <Section title="Backup Settings (Export JSON)">
              <p style={{ margin: "6px 0 12px", opacity: 0.8 }}>
                Exports theme/lock/PIN/frozen/banner to a JSON file for safekeeping.
                <br />
                (हिन्दी: Theme/Lock/PIN/Frozen/Banner को JSON फाइल में डाउनलोड कर लें — बाद में restore कर सकते हैं)
              </p>
              <button onClick={handleExport}>Download Backup</button>
            </Section>

            <Section title="Restore Settings (Import JSON)">
              <p style={{ margin: "6px 0 12px", opacity: 0.8 }}>
                Choose a backup you previously downloaded.
                <br />
                (हिन्दी: पहले बनाया हुआ JSON बैकअप चुनें — Values वापस आयेंगी)
              </p>
              <input
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                }}
              />
            </Section>
          </>
        )}
      </div>
    </main>
  );
}
