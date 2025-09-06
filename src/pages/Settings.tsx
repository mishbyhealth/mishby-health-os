// src/pages/Settings.tsx
import React, { useEffect, useMemo, useState } from "react";

type SettingsShape = {
  language?: string;        // "en" | "hi"
  region?: string;          // free text
  timezone?: string;        // IANA
  vegOnly?: boolean;
  spiceTolerance?: "low" | "medium" | "high";
  featureFlags?: Record<string, boolean>;
};

const KEY = "glowell:settings";

function loadSettings(): SettingsShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function saveSettings(s: SettingsShape) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export default function Settings() {
  const detectedTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata", []);
  const [settings, setSettings] = useState<SettingsShape>({});

  useEffect(() => {
    const s = loadSettings();
    if (!s.timezone) s.timezone = detectedTz;
    setSettings(s);
  }, [detectedTz]);

  function update<K extends keyof SettingsShape>(key: K, val: SettingsShape[K]) {
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-gray-600">
        Preferences are stored locally in your browser and applied across the app.
      </p>

      <section className="rounded-lg border p-4 space-y-4" aria-label="General">
        <h2 className="font-medium">General</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <div className="text-xs text-gray-500 mb-1">Language</div>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={settings.language ?? "en"}
              onChange={(e) => update("language", e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs text-gray-500 mb-1">Region</div>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="e.g., India / Gujarat"
              value={settings.region ?? ""}
              onChange={(e) => update("region", e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-xs text-gray-500 mb-1">Timezone (auto)</div>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={settings.timezone ?? detectedTz}
              onChange={(e) => update("timezone", e.target.value)}
            />
          </label>

          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!settings.vegOnly}
              onChange={(e) => update("vegOnly", e.target.checked)}
            />
            <span className="text-sm">Vegetarian-only guidance</span>
          </label>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-4" aria-label="Food preferences">
        <h2 className="font-medium">Food & Taste Preferences</h2>

        <label className="block max-w-xs">
          <div className="text-xs text-gray-500 mb-1">Spice tolerance</div>
          <select
            className="w-full rounded border px-3 py-2 text-sm"
            value={settings.spiceTolerance ?? "medium"}
            onChange={(e) => update("spiceTolerance", e.target.value as SettingsShape["spiceTolerance"])}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </section>

      <section className="rounded-lg border p-4 space-y-2" aria-label="Advanced">
        <h2 className="font-medium">Advanced</h2>
        <div className="text-xs text-gray-600">
          Feature flags (toggle experimental modules):
        </div>
        <div className="flex flex-wrap gap-3">
          {["demoEnabled", "printHeader", "csvExport"].map((flag) => {
            const enabled = !!settings.featureFlags?.[flag];
            return (
              <label key={flag} className="inline-flex items-center gap-2 rounded border px-3 py-1 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={enabled}
                  onChange={(e) => {
                    const ff = { ...(settings.featureFlags ?? {}) };
                    ff[flag] = e.target.checked;
                    update("featureFlags", ff);
                  }}
                />
                <span>{flag}</span>
              </label>
            );
          })}
        </div>
      </section>

      <div className="text-xs text-gray-500">
        Storage key: <code>{KEY}</code>
      </div>
    </div>
  );
}
