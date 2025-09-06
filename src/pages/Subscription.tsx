// src/pages/Subscription.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Tier = "free" | "silver" | "gold" | "platinum";
type Subscription = { name?: string; email?: string; mobile?: string; tier?: Tier; status?: "inactive" | "active"; lastPaidAt?: string; lastPaymentINR?: number; };

const KEY = "glowell:subscription";

function load(): Subscription { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function save(s: Subscription) { localStorage.setItem(KEY, JSON.stringify(s)); }
function isEmail(s: string){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function isPhone(s: string){ return /^[0-9\-+\s()]{7,15}$/.test(s); }

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<Subscription>({ tier: "free", status: "inactive" });

  useEffect(() => { const prev = load(); setSub({ tier: "free", status: "inactive", ...prev }); }, []);
  function update<K extends keyof Subscription>(k: K, v: Subscription[K]){ setSub(s => ({ ...s, [k]: v })); }
  function persist(){
    if (!sub.name || !sub.name.trim()) return alert("Please enter your name.");
    if (!sub.email || !isEmail(sub.email)) return alert("Please enter a valid email.");
    if (!sub.mobile || !isPhone(sub.mobile)) return alert("Please enter a valid mobile.");
    save(sub); alert("Details saved!");
  }

  const tiers: { id: Tier; title: string; price: number; features: string[] }[] = [
    { id: "free", title: "Free", price: 0, features: ["Local storage", "CSV/JSON export", "Demo plan"] },
    { id: "silver", title: "Silver", price: 199, features: ["Everything in Free", "Multiple snapshots tools", "Basic tips packs"] },
    { id: "gold", title: "Gold", price: 399, features: ["Everything in Silver", "Priority exports", "Upcoming: deeper nutrition"] },
    { id: "platinum", title: "Platinum", price: 799, features: ["Everything in Gold", "Early features", "Concierge support (email)"] },
  ];

  function goToPayment() {
    if (!sub.name || !sub.email || !sub.mobile) return alert("Please fill Name, Email, Mobile first, then choose a plan.");
    const t = sub.tier || "free";
    const tier = tiers.find(x => x.id === t)!;
    if (!tier) return alert("Please select a plan.");
    if (tier.price === 0) {
      const next = { ...sub, status: "active", lastPaidAt: undefined, lastPaymentINR: 0 };
      save(next); setSub(next);
      alert("Activated: FREE");
      return;
    }
    // Navigate to mock checkout
    const params = new URLSearchParams({ tier: tier.id, price: String(tier.price) });
    navigate(`/checkout?${params.toString()}`);
  }

  function activateFree() {
    const next = { ...sub, tier: "free" as Tier, status: "active", lastPaidAt: undefined, lastPaymentINR: 0 };
    save(next); setSub(next);
    alert("Switched to FREE");
  }

  const currentTier = sub.tier || "free";
  const paidBadge = sub.status === "active" && (sub.lastPaymentINR ?? 0) > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Subscription</h1>
      <p className="text-sm gw-muted">
        Your details are stored locally on this device. Paid tiers use a sandbox checkout in this demo.
      </p>

      {/* Social subscribe */}
      <section className="gw-card">
        <h2 className="font-medium mb-3">Quick subscribe</h2>
        <div className="flex flex-wrap gap-2">
          <button className="gw-btn" onClick={()=>alert("Google sign-in is a placeholder in this local demo.")}>Continue with Google</button>
          <button className="gw-btn" onClick={()=>alert("Facebook sign-in is a placeholder in this local demo.")}>Continue with Facebook</button>
        </div>
        <p className="mt-2 text-xs gw-muted">Note: Social sign-in buttons are placeholders in this local demo.</p>
      </section>

      {/* User details */}
      <section className="gw-card">
        <div className="flex items-start justify-between">
          <h2 className="font-medium mb-3">Your details</h2>
          <div className="text-xs gw-muted">
            Status: <strong>{sub.status === "active" ? "ACTIVE" : "INACTIVE"}</strong>
            {paidBadge ? <> • <span>Paid ₹{sub.lastPaymentINR} on {new Date(sub.lastPaidAt!).toLocaleString()}</span></> : null}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="text-xs gw-muted mb-1">Name</div>
            <input className="w-full rounded border px-3 py-2 text-sm" value={sub.name ?? ""} onChange={(e)=>update("name", e.target.value)} />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Email</div>
            <input type="email" className="w-full rounded border px-3 py-2 text-sm" value={sub.email ?? ""} onChange={(e)=>update("email", e.target.value)} />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Mobile</div>
            <input className="w-full rounded border px-3 py-2 text-sm" placeholder="+91 9xxxxxxxxx" value={sub.mobile ?? ""} onChange={(e)=>update("mobile", e.target.value)} />
          </label>
        </div>
        <div className="mt-3"><button className="gw-btn" onClick={persist}>Save Details</button></div>
      </section>

      {/* Tiers */}
      <section className="gw-card">
        <h2 className="font-medium mb-3">Choose a plan</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {tiers.map((t) => {
            const active = currentTier === t.id;
            return (
              <label key={t.id} className={`rounded-lg border p-4 bg-white ${active ? "ring-1 ring-[var(--gw-accent)]" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="text-xs gw-muted">₹{t.price}/mo</div>
                  </div>
                  <input type="radio" name="tier" className="h-4 w-4" checked={active} onChange={()=>update("tier", t.id)} />
                </div>
                <ul className="mt-3 text-xs list-disc pl-4 gw-muted space-y-1">
                  {t.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </label>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <button className="gw-btn" onClick={goToPayment}>
            {currentTier === "free" ? "Activate Free" : `Proceed to Payment (₹${tiers.find(x=>x.id===currentTier)?.price})`}
          </button>
          <button className="gw-btn" onClick={activateFree}>Switch to Free</button>
        </div>
        <p className="mt-2 text-xs gw-muted">Note: In this demo, payment is simulated on the next screen.</p>
      </section>
    </div>
  );
}
