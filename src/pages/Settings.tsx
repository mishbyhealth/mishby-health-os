import React from "react";

/**
 * Settings Page (V1)
 * - Non-clinical, project-wide defaults & feature toggles
 * - Persists to localStorage and applies immediately
 * - Keys:
 *   - glowell:defaults (timezone, language, region_state, veg_only, spice_tolerance)
 *   - glowell:devices  (array of device strings)
 *   - glowell:flags    ({ UI_V3: boolean, NATURAL_ENGINES_V1: boolean })
 */

type Defaults = {
  timezone: string;
  language: string;
  region_state: string;
  veg_only: boolean;
  spice_tolerance: number; // 0-10
};

type Flags = {
  UI_V3: boolean;
  NATURAL_ENGINES_V1: boolean;
};

const DEFAULTS_KEY = "glowell:defaults";
const DEVICES_KEY = "glowell:devices";
const FLAGS_KEY = "glowell:flags";

export default function Settings() {
  const [defaults, setDefaults] = React.useState<Defaults>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    language: "en",
    region_state: "",
    veg_only: false,
    spice_tolerance: 5,
  });

  const [devices, setDevices] = React.useState<string[]>([]);
  const [flags, setFlags] = React.useState<Flags>({
    UI_V3: true,
    NATURAL_ENGINES_V1: true,
  });

  // Load from localStorage
  React.useEffect(() => {
    try {
      const d = localStorage.getItem(DEFAULTS_KEY);
      if (d) setDefaults({ ...defaults, ...JSON.parse(d) });
      const dv = localStorage.getItem(DEVICES_KEY);
      if (dv) setDevices(JSON.parse(dv));
      const f = localStorage.getItem(FLAGS_KEY);
      if (f) setFlags({ ...flags, ...JSON.parse(f) });
    } catch {
      /* ignore */
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply flags to <body data-*> like we already do in pages
  React.useEffect(() => {
    document.body.dataset.uiVersion = flags.UI_V3 ? "UI_V3" : "";
    document.body.dataset.naturalEngines = flags.NATURAL_ENGINES_V1 ? "NATURAL_ENGINES_V1" : "";
    return () => {
      delete document.body.dataset.uiVersion;
      delete document.body.dataset.naturalEngines;
    };
  }, [flags]);

  const save = () => {
    try {
      localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
      localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
      localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
      alert("Settings saved.");
    } catch {
      alert("Could not save settings.");
    }
  };

  const reset = () => {
    setDefaults({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
      language: "en",
      region_state: "",
      veg_only: false,
      spice_tolerance: 5,
    });
    setDevices([]);
    setFlags({ UI_V3: true, NATURAL_ENGINES_V1: true });
    try {
      localStorage.removeItem(DEFAULTS_KEY);
      localStorage.removeItem(DEVICES_KEY);
      localStorage.removeItem(FLAGS_KEY);
    } catch { /* ignore */ }
  };

  // Tag editor for devices
  const [deviceInput, setDeviceInput] = React.useState("");
  const addDevice = () => {
    const v = deviceInput.trim();
    if (!v) return;
    if (!devices.includes(v)) setDevices([...devices, v]);
    setDeviceInput("");
  };
  const removeDevice = (i: number) => setDevices(devices.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm opacity-80">
          Defaults & feature toggles. These help pre-fill forms and control UI/engine behavior.
        </p>
      </header>

      <Section title="Defaults">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Timezone"
            value={defaults.timezone}
            onChange={(v) => setDefaults({ ...defaults, timezone: v })}
          />
          <Input
            label="Language"
            value={defaults.language}
            onChange={(v) => setDefaults({ ...defaults, language: v })}
          />
          <Input
            label="Region / State"
            value={defaults.region_state}
            onChange={(v) => setDefaults({ ...defaults, region_state: v })}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Checkbox
            label="Veg-only plans by default"
            checked={defaults.veg_only}
            onChange={(v) => setDefaults({ ...defaults, veg_only: v })}
          />
          <NumberInput
            label="Spice tolerance (0–10)"
            value={defaults.spice_tolerance}
            onChange={(v) => setDefaults({ ...defaults, spice_tolerance: v as number })}
            min={0}
            max={10}
          />
        </div>
      </Section>

      <Section title="Monitoring Devices">
        <div className="flex flex-wrap gap-2">
          {devices.map((d, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              {d}
              <button onClick={() => removeDevice(i)} className="opacity-60" aria-label="remove">✕</button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="home BP, glucose meter, weight scale"
            value={deviceInput}
            onChange={(e) => setDeviceInput(e.target.value)}
          />
          <button className="rounded-xl border px-3 py-2 text-sm" onClick={addDevice}>Add</button>
        </div>
      </Section>

      <Section title="Feature Toggles (Dev)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            label="UI_V3 (new intake UI)"
            checked={flags.UI_V3}
            onChange={(v) => setFlags({ ...flags, UI_V3: v })}
          />
          <Toggle
            label="NATURAL_ENGINES_V1 (neutral engine)"
            checked={flags.NATURAL_ENGINES_V1}
            onChange={(v) => setFlags({ ...flags, NATURAL_ENGINES_V1: v })}
          />
        </div>
        <p className="mt-2 text-xs opacity-70">
          These map to <code>document.body.dataset</code> so the rest of the app can read them.
        </p>
      </Section>

      <div className="flex items-center gap-3">
        <button className="rounded-xl border px-4 py-2" onClick={save}>Save</button>
        <button className="rounded-xl border px-4 py-2" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

/* ---------------- Small UI primitives ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 p-4 md:p-6">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        className="w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        type="number"
        className="w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => {
          const s = e.target.value;
          onChange(s === "" ? "" : Number(s));
        }}
        min={min}
        max={max}
      />
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="font-medium">{label}</span>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
