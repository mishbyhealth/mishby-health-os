// src/pages/Settings.tsx
import React, { useEffect, useState } from "react";

const KEY = "glowell:settings";

type Settings = {
  language?: string;
  region?: string;
  timezone?: string;
  allowVegOnly?: boolean;
  featureFlags?: Record<string, boolean>;
};

function load<T>(k: string, fb: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : fb; } catch { return fb; }
}
function save<T>(k: string, v: T){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export default function SettingsPage(){
  const [s, setS] = useState<Settings>({ language:"en", region:"IN", timezone:"Asia/Kolkata", allowVegOnly:false, featureFlags:{} });

  useEffect(()=>{ setS(load<Settings>(KEY, s)); /* eslint-disable-next-line */ }, []);
  function update<K extends keyof Settings>(k: K, v: Settings[K]) {
    const next = { ...s, [k]: v };
    setS(next); save(KEY, next);
  }

  return (
    <div className="space-y-6">
      <section className="gw-card">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm gw-muted">Basic preferences for your app. This is lightweight—your original features remain unchanged.</p>
      </section>

      <section className="gw-card">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="text-xs gw-muted mb-1">Language</div>
            <select value={s.language || "en"} onChange={e=>update("language", e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="gu">Gujarati</option>
            </select>
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Region</div>
            <select value={s.region || "IN"} onChange={e=>update("region", e.target.value)}>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="AE">UAE</option>
            </select>
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Timezone</div>
            <input value={s.timezone || ""} onChange={e=>update("timezone", e.target.value)} placeholder="e.g., Asia/Kolkata" />
          </label>
        </div>
        <div className="mt-3">
          <label style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
            <input type="checkbox" checked={!!s.allowVegOnly} onChange={e=>update("allowVegOnly", e.target.checked)} />
            Veg-only defaults (optional)
          </label>
        </div>
      </section>
    </div>
  );
}
