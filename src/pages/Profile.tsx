import React, { useEffect, useState } from "react";

type ProfileState = {
  fullName: string;
  age: string;
  gender: "Female" | "Male" | "Other" | "";
  language: "English" | "Hindi" | "Gujarati";
  lifestyle: "Sedentary" | "Light" | "Moderate" | "Active";
  goal: "General Wellness" | "Weight Balance" | "Energy & Stamina" | "Calm & Sleep";
};

const LS_KEY = "glowell.profile.v1";

function load(): ProfileState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) throw new Error("empty");
    const p = JSON.parse(raw);
    return {
      fullName: p.fullName || "",
      age: String(p.age ?? ""),
      gender: (p.gender as ProfileState["gender"]) || "",
      language: (p.language as ProfileState["language"]) || "English",
      lifestyle: (p.lifestyle as ProfileState["lifestyle"]) || "Light",
      goal: (p.goal as ProfileState["goal"]) || "General Wellness",
    };
  } catch {
    return {
      fullName: "",
      age: "",
      gender: "",
      language: "English",
      lifestyle: "Light",
      goal: "General Wellness",
    };
  }
}

export default function Profile() {
  const [p, setP] = useState<ProfileState>(load());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  }, [p]);

  const save = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
    setSavedAt(Date.now());
  };

  const reset = () => {
    const fresh = load();
    setP(fresh);
    setSavedAt(null);
  };

  const field = {
    wrap: { display: "grid", gap: 6, marginTop: 12 } as React.CSSProperties,
    label: { fontWeight: 600 } as React.CSSProperties,
    input: { padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" } as React.CSSProperties,
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 } as React.CSSProperties,
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>Profile</h2>
      <p className="small">Your basic details help personalize your plan.</p>

      <div className="card" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
        {/* Name + Age */}
        <div style={field.row}>
          <div style={field.wrap}>
            <label style={field.label}>Full Name</label>
            <input
              style={field.input}
              value={p.fullName}
              onChange={(e) => setP({ ...p, fullName: e.target.value })}
              placeholder="e.g., Mukul Patel"
            />
          </div>
          <div style={field.wrap}>
            <label style={field.label}>Age</label>
            <input
              style={field.input}
              type="number"
              value={p.age}
              onChange={(e) => setP({ ...p, age: e.target.value })}
              placeholder="e.g., 40"
            />
          </div>
        </div>

        {/* Gender + Language */}
        <div style={field.row}>
          <div style={field.wrap}>
            <label style={field.label}>Gender</label>
            <select
              style={field.input}
              value={p.gender}
              onChange={(e) => setP({ ...p, gender: e.target.value as ProfileState["gender"] })}
            >
              <option value="">Prefer not to say</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </div>
          <div style={field.wrap}>
            <label style={field.label}>Language</label>
            <select
              style={field.input}
              value={p.language}
              onChange={(e) => setP({ ...p, language: e.target.value as ProfileState["language"] })}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Gujarati</option>
            </select>
          </div>
        </div>

        {/* Lifestyle + Goal */}
        <div style={field.row}>
          <div style={field.wrap}>
            <label style={field.label}>Lifestyle</label>
            <select
              style={field.input}
              value={p.lifestyle}
              onChange={(e) => setP({ ...p, lifestyle: e.target.value as ProfileState["lifestyle"] })}
            >
              <option>Sedentary</option>
              <option>Light</option>
              <option>Moderate</option>
              <option>Active</option>
            </select>
          </div>
          <div style={field.wrap}>
            <label style={field.label}>Goal</label>
            <select
              style={field.input}
              value={p.goal}
              onChange={(e) => setP({ ...p, goal: e.target.value as ProfileState["goal"] })}
            >
              <option>General Wellness</option>
              <option>Weight Balance</option>
              <option>Energy & Stamina</option>
              <option>Calm & Sleep</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={save}>Save Profile</button>
          <button className="btn" onClick={reset}>Reset</button>
        </div>

        {savedAt && (
          <div className="small" style={{ marginTop: 8 }}>
            Saved at {new Date(savedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Helpful tip */}
      <p className="small" style={{ marginTop: 10 }}>
        Tip: Your profile syncs with your plan. You can adjust it anytime.
      </p>
    </div>
  );
}
