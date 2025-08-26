import React, { useState } from "react";

type Props = {
  onSubmit: (data: any) => void;
};

type FormState = {
  profile: {
    account: {
      fullName: string;
      language: string;
      age?: number | string;
      goal?: string;
    };
  };
};

export default function PrettyHealthFormV2({ onSubmit }: Props) {
  const [data, setData] = useState<FormState>({
    profile: {
      account: {
        fullName: "",
        language: "English",
        age: "",
        goal: "General Wellness",
      },
    },
  });

  const update = (partial: Partial<FormState["profile"]["account"]>) => {
    setData((prev) => ({
      ...prev,
      profile: {
        ...(prev.profile || {}),
        account: {
          ...(prev.profile?.account || {}),
          ...partial,
        },
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  const a = data.profile.account;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Build Your Health Plan</h2>
      <p style={{ marginBottom: 20, opacity: 0.8 }}>
        Fill a few details. You can edit the plan later.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Full Name
          </label>
          <input
            type="text"
            value={a.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="e.g., Mukul Patel"
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Language
          </label>
          <select
            value={a.language}
            onChange={(e) => update({ language: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Gujarati</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Age
          </label>
          <input
            type="number"
            value={a.age as number | string}
            onChange={(e) => update({ age: e.target.value })}
            placeholder="e.g., 40"
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Goal
          </label>
          <select
            value={a.goal}
            onChange={(e) => update({ goal: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          >
            <option>General Wellness</option>
            <option>Weight Balance</option>
            <option>Energy & Stamina</option>
            <option>Calm & Sleep</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          type="submit"
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #0d9488",
            background: "#0d9488",
            color: "white",
            cursor: "pointer",
          }}
        >
          Generate Plan
        </button>
        <button
          type="button"
          onClick={() =>
            setData({
              profile: { account: { fullName: "", language: "English", age: "", goal: "General Wellness" } },
            })
          }
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
