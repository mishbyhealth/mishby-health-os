import React, { useEffect, useMemo, useState } from "react";

type ReminderType = "water" | "walk" | "sleep" | "custom";

type Reminder = {
  id: string;
  type: ReminderType;
  label: string;
  intervalMin: number; // every X minutes
  enabled: boolean;
  lastAt?: number; // epoch ms
};

const STORAGE_KEY = "glowell.reminders.v1";

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

function saveReminders(list: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function notify(text: string) {
  if (!("Notification" in window)) {
    alert(text);
    return;
  }
  if (Notification.permission === "granted") {
    new Notification("GloWell Reminder", { body: text });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification("GloWell Reminder", { body: text });
      else alert(text);
    });
  } else {
    alert(text);
  }
}

function niceLabel(r: Reminder) {
  const m = r.intervalMin;
  const unit = m % 60 === 0 ? `${m / 60}h` : `${m}m`;
  return `${r.label} • every ${unit}`;
}

export default function Reminders() {
  const [items, setItems] = useState<Reminder[]>(() => loadReminders());
  const [label, setLabel] = useState("Water");
  const [mins, setMins] = useState(120);

  // persist
  useEffect(() => saveReminders(items), [items]);

  // tick every 30s to check due reminders
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setItems((prev) =>
        prev.map((r) => {
          if (!r.enabled) return r;
          const last = r.lastAt ?? 0;
          const due = now - last >= r.intervalMin * 60_000;
          if (due) {
            notify(r.label);
            return { ...r, lastAt: now };
          }
          return r;
        })
      );
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const enabledCount = useMemo(() => items.filter((r) => r.enabled).length, [items]);

  const addPreset = (type: ReminderType) => {
    const presets: Record<ReminderType, { label: string; mins: number }> = {
      water: { label: "Sip water", mins: 120 },
      walk: { label: "Take a short walk", mins: 180 },
      sleep: { label: "Wind down (sleep routine)", mins: 720 },
      custom: { label: "Custom", mins: 60 },
    };
    const p = presets[type];
    const r: Reminder = {
      id: crypto.randomUUID(),
      type,
      label: p.label,
      intervalMin: p.mins,
      enabled: true,
      lastAt: Date.now(),
    };
    setItems((x) => [r, ...x]);
  };

  const addCustom = () => {
    const m = Math.max(5, Number(mins) || 60);
    const r: Reminder = {
      id: crypto.randomUUID(),
      type: "custom",
      label: label.trim() || "Reminder",
      intervalMin: m,
      enabled: true,
      lastAt: Date.now(),
    };
    setItems((x) => [r, ...x]);
    setLabel("Water");
    setMins(120);
  };

  const toggle = (id: string) =>
    setItems((x) =>
      x.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );

  const removeOne = (id: string) =>
    setItems((x) => x.filter((r) => r.id !== id));

  const clearAll = () => {
    if (confirm("Remove all reminders?")) setItems([]);
  };

  return (
    <div className="card" style={{ padding: 16, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>Reminders ({enabledCount} on)</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => addPreset("water")}>+ Water</button>
          <button className="btn" onClick={() => addPreset("walk")}>+ Walk</button>
          <button className="btn" onClick={() => addPreset("sleep")}>+ Sleep</button>
        </div>
      </div>

      {/* custom creator */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g., Stretch)"
          style={{ flex: "1 1 220px", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
        />
        <input
          type="number"
          value={mins}
          onChange={(e) => setMins(Number(e.target.value))}
          placeholder="Minutes"
          style={{ width: 120, padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
        />
        <button className="btn btn-primary" onClick={addCustom}>Add Reminder</button>
        <button className="btn" onClick={clearAll} title="Remove all">Clear</button>
      </div>

      {/* list */}
      <ul style={{ listStyle: "none", padding: 0, marginTop: 14 }}>
        {items.length === 0 && (
          <li style={{ opacity: 0.7 }}>No reminders yet. Add one above.</li>
        )}
        {items.map((r) => (
          <li
            key={r.id}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: 12,
              marginTop: 8,
              borderRadius: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Every {r.intervalMin} min • Last {r.lastAt ? new Date(r.lastAt).toLocaleTimeString() : "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn"
                onClick={() => toggle(r.id)}
                title={r.enabled ? "Pause" : "Resume"}
              >
                {r.enabled ? "Pause" : "Resume"}
              </button>
              <button className="btn" onClick={() => removeOne(r.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>
        Notes: Notifications use your browser. Keep this tab open. You can change permission in the
        address bar (🔔 icon).
      </p>
    </div>
  );
}
