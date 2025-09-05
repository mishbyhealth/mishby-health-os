// src/pages/Subscription.tsx
import React, { useEffect, useState } from "react";

type PlanKey = "free" | "silver" | "gold" | "platinum";
type SubInfo = {
  plan: PlanKey;
  name?: string;
  email?: string;
  mobile?: string;
  paid?: boolean;
  lastPaidAt?: string;
  lastPaymentINR?: number;
};

const KEY = "glowell:subscription";

const PRICES: Record<PlanKey, number> = {
  free: 0,
  silver: 199,
  gold: 399,
  platinum: 799,
};

const FEATURES: Record<PlanKey, string[]> = {
  free: ["Basic plan generation", "Local history (device)", "CSV/JSON export", "Public demo"],
  silver: ["Everything in Free", "1 year data retention", "Email support", "Basic AI insights"],
  gold: ["Everything in Silver", "3 years data retention", "Priority support", "Advanced AI insights"],
  platinum: ["Everything in Gold", "Lifetime data retention", "VIP support", "Family sharing (up to 5)"],
};

function load<T>(k: string, fb: T): T {
  try {
    const r = localStorage.getItem(k);
    return r ? (JSON.parse(r) as T) : fb;
  } catch {
    return fb;
  }
}
function save<T>(k: string, v: T) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function isPhone(s: string) {
  return /^[0-9\-+\s()]{7,15}$/.test(s);
}

export default function SubscriptionPage() {
  const [sub, setSub] = useState<SubInfo>(
    load<SubInfo>(KEY, { plan: "free", paid: false })
  );
  const [draft, setDraft] = useState<SubInfo>(sub);

  useEffect(() => {
    setDraft(sub);
  }, [sub]);

  function choose(plan: PlanKey) {
    setDraft((d) => ({ ...d, plan }));
  }

  function payNow() {
    if (!draft.name || !draft.name.trim()) return alert("Please enter your name.");
    if (!draft.email || !isEmail(draft.email)) return alert("Please enter a valid email.");
    if (!draft.mobile || !isPhone(draft.mobile)) return alert("Please enter a valid mobile.");

    const price = PRICES[draft.plan];
    if (price === 0) {
      const next = { ...draft, paid: true, lastPaidAt: undefined, lastPaymentINR: 0 };
      setSub(next);
      save(KEY, next);
      alert("Activated: FREE");
      return;
    }
    const ok = confirm(`Proceed to pay ₹${price} for ${draft.plan.toUpperCase()}? (demo)`);
    if (!ok) return;
    const next = {
      ...draft,
      paid: true,
      lastPaidAt: new Date().toISOString(),
      lastPaymentINR: price,
    };
    setSub(next);
    save(KEY, next);
    alert("Payment recorded (demo).");
  }

  function saveProfile() {
    if (!draft.name || !draft.name.trim()) return alert("Please enter your name.");
    if (!draft.email || !isEmail(draft.email)) return alert("Please enter a valid email.");
    if (!draft.mobile || !isPhone(draft.mobile)) return alert("Please enter a valid mobile.");
    setSub(draft);
    save(KEY, draft);
    alert("Saved.");
  }

  return (
    <div className="space-y-6">
      <section className="gw-card">
        <h1>Subscription</h1>
        <p className="gw-muted text-sm">
          Pick a plan. Payments are simulated in this local demo.
        </p>
      </section>

      {/* Plan chooser */}
      <section className="gw-card">
        <h2>Choose your plan</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {(Object.keys(PRICES) as PlanKey[]).map((key) => {
            const active = draft.plan === key;
            return (
              <div
                key={key}
                className="gw-card"
                style={{
                  padding: 16,
                  borderColor: active ? "var(--gw-primary)" : "var(--gw-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{key}</div>
                  <div style={{ fontWeight: 800 }}>₹{PRICES[key]}</div>
                </div>
                <ul style={{ margin: "10px 0 12px 0", paddingLeft: 18 }}>
                  {FEATURES[key].map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
                <button className="gw-btn" onClick={() => choose(key)}>
                  {active ? "Selected" : "Select"}
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="gw-btn" onClick={payNow}>
            {draft.plan === "free" ? "Activate Free" : `Proceed to Pay (₹${PRICES[draft.plan]})`}
          </button>
        </div>
      </section>

      {/* Profile */}
      <section className="gw-card">
        <h2>Your details</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <label className="block">
            <div className="text-xs gw-muted mb-1">Name</div>
            <input
              value={draft.name || ""}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Full name"
            />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Email</div>
            <input
              type="email"
              value={draft.email || ""}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Mobile</div>
            <input
              value={draft.mobile || ""}
              onChange={(e) => setDraft((d) => ({ ...d, mobile: e.target.value }))}
              placeholder="+91…"
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button className="gw-btn" onClick={saveProfile}>Save details</button>
          <button
            className="gw-btn"
            onClick={() => alert('Google Sign-in (demo)')}
          >
            Continue with Google
          </button>
          <button
            className="gw-btn"
            onClick={() => alert('Facebook Sign-in (demo)')}
          >
            Continue with Facebook
          </button>
        </div>

        {sub.paid && (
          <div className="gw-chip" style={{ marginTop: 12 }}>
            Active: {sub.plan.toUpperCase()} • {sub.lastPaymentINR ? `₹${sub.lastPaymentINR}` : "Free"}
          </div>
        )}
      </section>
    </div>
  );
}
