// File: src/pages/Donate.tsx
import React, { useMemo, useState } from "react";
// ✅ FIXED: use relative import (no "@/...")
import { openRazorpayCheckout } from "../lib/razorpay";

/** Demo-only conversion table (edit anytime). */
const FX: Record<string, { label: string; toINR: number; locale: string }> = {
  INR: { label: "₹ INR", toINR: 1, locale: "en-IN" },
  USD: { label: "$ USD", toINR: 84, locale: "en-US" },
  EUR: { label: "€ EUR", toINR: 92, locale: "de-DE" },
  GBP: { label: "£ GBP", toINR: 108, locale: "en-GB" },
  AED: { label: "د.إ AED", toINR: 22.9, locale: "ar-AE" },
};

/** Base presets (in INR). We convert them for display. */
const PRESETS_INR = [99, 199, 299, 499, 999, 1499];

function fmt(amount: number, code: keyof typeof FX) {
  try {
    return new Intl.NumberFormat(FX[code].locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback
    const symbol = code === "INR" ? "₹" : code + " ";
    return symbol + Math.round(amount);
  }
}

export default function DonatePage() {
  const [currency, setCurrency] = useState<keyof typeof FX>("INR");
  const [amount, setAmount] = useState<number>(199); // amount in selected currency
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const keyIdShown = useMemo(
    () => (import.meta.env.VITE_RAZORPAY_KEY_ID ? "Ready" : "Using test key"),
    []
  );

  // Presets shown in current currency
  const presets = useMemo(() => {
    const r = FX[currency].toINR;
    // Convert INR → selected currency for buttons
    return PRESETS_INR.map((v) => Math.round(v / r));
  }, [currency]);

  async function pay() {
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    // Convert selected currency → INR for demo client flow
    const amountINR = Math.max(1, Math.round(amount * FX[currency].toINR));

    try {
      await openRazorpayCheckout({
        amountINR,
        user: { name, email, contact: phone },
        notes: {
          purpose: "glowell_donation",
          currency_selected: currency,
          amount_original: String(amount),
        },
        onSuccess: (resp: any) => {
          alert("Thank you! Payment success.\n\n" + JSON.stringify(resp, null, 2));
        },
      });
    } catch (err: any) {
      console.error(err);
      alert("Payment could not start. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="gw-card tinted">
        <h1 className="text-xl font-semibold">Support GloWell</h1>
        <p className="gw-muted text-sm mt-1">
          Your donation helps keep GloWell free and growing worldwide.
        </p>
        <div className="text-xs gw-muted mt-1">Razorpay key: {keyIdShown}</div>
      </section>

      {/* Currency + presets */}
      <section className="gw-card">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="text-xs gw-muted mb-1">Currency</div>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={currency}
              onChange={(e) => {
                const next = e.target.value as keyof typeof FX;
                // Keep the same INR-equivalent when switching currency:
                const inrNow = Math.max(1, Math.round(amount * FX[currency].toINR));
                const nextAmt = Math.max(1, Math.round(inrNow / FX[next].toINR));
                setCurrency(next);
                setAmount(nextAmt);
              }}
            >
              {Object.keys(FX).map((k) => (
                <option key={k} value={k}>
                  {FX[k as keyof typeof FX].label}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs gw-muted mb-1">Custom amount</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-40 rounded border px-3 py-2 text-sm"
                placeholder="Amount"
                value={Number.isFinite(amount) ? String(amount) : ""}
                min={1}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
              />
              <span className="text-sm gw-muted">
                ≈ {fmt(Math.round(amount * FX[currency].toINR), "INR")} (settled in INR for demo)
              </span>
            </div>
          </label>
        </div>

        <div className="mt-3">
          <div className="text-sm font-medium mb-2">Quick choose</div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                className={"gw-btn" + (amount === p ? " is-active" : "")}
                onClick={() => setAmount(p)}
                title={`≈ ${fmt(Math.round(p * FX[currency].toINR), "INR")}`}
              >
                {fmt(p, currency)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Donor info */}
      <section className="gw-card">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="text-xs gw-muted mb-1">Name</div>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Email</div>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
              type="email"
            />
          </label>
          <label className="block">
            <div className="text-xs gw-muted mb-1">Phone</div>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </label>
        </div>
      </section>

      {/* Pay */}
      <section className="gw-card">
        <div className="flex items-center gap-3">
          <button className="gw-btn" onClick={pay}>
            Donate {fmt(amount, currency)}
          </button>
          <span className="text-xs gw-muted">
            For production multi-currency, create orders server-side and pass{" "}
            <code>order_id</code> &amp; currency to Razorpay Checkout.
          </span>
        </div>
      </section>
    </div>
  );
}
