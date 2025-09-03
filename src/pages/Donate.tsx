// File: src/pages/Donate.tsx
import React, { useMemo, useState } from "react";
import { openRazorpayCheckout } from "@/lib/razorpay";

const presets = [99, 199, 299, 499, 999, 1499];

export default function DonatePage() {
  const [amount, setAmount] = useState<number>(199);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const keyIdShown = useMemo(
    () => (import.meta.env.VITE_RAZORPAY_KEY_ID ? "Ready" : "Using test key"),
    []
  );

  async function pay() {
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    await openRazorpayCheckout({
      amountINR: amount,
      user: { name, email, contact: phone },
      notes: { purpose: "glowell_donation" },
      onSuccess: (resp) => {
        alert("\nThank you! Payment success." + JSON.stringify(resp, null, 2));
      },
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-emerald-900">Support GloWell</h1>
        <p className="text-gray-600 mt-1">
          Your donation helps keep GloWell free and growing worldwide.
        </p>
        <div className="text-xs text-gray-500 mt-1">Razorpay key: {keyIdShown}</div>
      </header>

      {/* Amount presets */}
      <div className="bg-white border rounded-2xl p-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Choose amount (INR)</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              className={
                "px-3 py-2 rounded-lg border " +
                (amount === p ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-gray-50")
              }
              onClick={() => setAmount(p)}
            >
              ₹{p}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-[units redacted]-1">Or enter:</span>
            <input
              type="number"
              className="px-3 py-2 border rounded-lg w-28"
              placeholder="e.g., 250"
              value={String(amount || "")}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              step={1}
            />
          </div>
        </div>
      </div>

      {/* Donor info (optional but nice) */}
      <div className="bg-white border rounded-2xl p-4 grid md:grid-cols-3 gap-3">
        <div>
          <div className="text-sm font-medium text-gray-700">Name</div>
          <input
            className="mt-1 px-3 py-2 border rounded-lg w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700">Email</div>
          <input
            className="mt-1 px-3 py-2 border rounded-lg w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700">Phone</div>
          <input
            className="mt-1 px-3 py-2 border rounded-lg w-full"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Pay */}
      <div className="flex items-center gap-3">
        <button
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={pay}
        >
          Donate ₹{amount || 0}
        </button>
        <span className="text-xs text-gray-500">
          Secure payments processed by Razorpay.
        </span>
      </div>

      <div className="text-xs text-gray-500">
        Note: For production, create orders on your server and pass the order_id to Razorpay Checkout.
        This client-only MVP is for basic flows/testing.
      </div>
    </div>
  );
}
