// src/pages/Checkout.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Tier = "free" | "silver" | "gold" | "platinum";
type Subscription = { name?: string; email?: string; mobile?: string; tier?: Tier; status?: "inactive" | "active"; lastPaidAt?: string; lastPaymentINR?: number; };

const SUB_KEY = "glowell:subscription";

function loadSub(): Subscription {
  try { const raw = localStorage.getItem(SUB_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveSub(s: Subscription) { localStorage.setItem(SUB_KEY, JSON.stringify(s)); }

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const qs = useQuery();

  const [sub, setSub] = useState<Subscription>({});
  const tierParam = (qs.get("tier") || "free") as Tier;
  const priceParam = Math.max(0, parseInt(qs.get("price") || "0", 10));
  const validTier: Tier = ["free","silver","gold","platinum"].includes(tierParam) ? tierParam : "free";

  useEffect(() => { setSub(loadSub()); }, []);

  const canPay = !!sub.name && !!sub.email && !!sub.mobile && validTier !== "free" && priceParam > 0;

  function payNow() {
    if (!canPay) return alert("Missing details or invalid plan. Please go back to Subscription.");
    const receiptId = "PAY-" + Date.now().toString(36).toUpperCase();
    const updated: Subscription = {
      ...sub,
      tier: validTier,
      status: "active",
      lastPaidAt: new Date().toISOString(),
      lastPaymentINR: priceParam,
    };
    saveSub(updated);
    setSub(updated);
    alert(`Payment successful (demo): ₹${priceParam}\nReceipt: ${receiptId}`);
    navigate("/subscription");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Checkout (Demo)</h1>
      <p className="text-sm gw-muted">This is a sandbox payment screen for local testing.</p>

      <section className="gw-card">
        <h2 className="font-medium mb-3">Order summary</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded border bg-white p-3 text-sm">
            <div className="text-xs gw-muted mb-1">Plan</div>
            <div className="font-medium">{validTier.toUpperCase()}</div>
          </div>
          <div className="rounded border bg-white p-3 text-sm">
            <div className="text-xs gw-muted mb-1">Amount</div>
            <div className="font-medium">₹{priceParam}</div>
          </div>
          <div className="rounded border bg-white p-3 text-sm">
            <div className="text-xs gw-muted mb-1">Name</div>
            <div>{sub.name || "—"}</div>
          </div>
          <div className="rounded border bg-white p-3 text-sm">
            <div className="text-xs gw-muted mb-1">Email</div>
            <div>{sub.email || "—"}</div>
          </div>
          <div className="rounded border bg-white p-3 text-sm">
            <div className="text-xs gw-muted mb-1">Mobile</div>
            <div>{sub.mobile || "—"}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="gw-btn" disabled={!canPay} onClick={payNow}>
            Pay Now (Demo)
          </button>
          <button className="gw-btn" onClick={() => navigate("/subscription")}>
            Cancel
          </button>
        </div>
        {!canPay && (
          <p className="mt-2 text-xs text-red-600">
            Please ensure your Name, Email, Mobile are saved and the selected plan is not FREE.
          </p>
        )}
        <p className="mt-2 text-xs gw-muted">
          Note: No real payment is processed here. This only marks your subscription as paid in localStorage.
        </p>
      </section>
    </div>
  );
}
