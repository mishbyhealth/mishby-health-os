// src/components/SupportGloWellCard.tsx
import React, { useState } from "react";
import { openRazorpayCheckout } from "@/lib/razorpay";

export default function SupportGloWellCard() {
  const [amount, setAmount] = useState<number>(200); // INR
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const presets = [99, 200, 501, 1100];

  async function handleDonate() {
    try {
      await openRazorpayCheckout({
        amountInPaise: (amount || 0) * 100,
        name,
        email,
        notes: { purpose: "GloWell Donation (Dashboard Card)" },
      });
    } catch (e:any) {
      alert(e?.message || "Unable to open Razorpay");
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-5">
      <h3 className="text-lg font-semibold text-emerald-900">Support GloWell</h3>
      <p className="text-sm text-gray-600 mt-1">
        आपकी छोटी-सी मदद हमें सबके लिए बेहतर, शांत और non-clinical wellness tools बनाने में मदद करती है।
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`px-3 py-1 rounded-full border ${amount===p ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-300 hover:bg-gray-50"}`}
          >
            ₹{p}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Custom:</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e)=>setAmount(parseInt(e.target.value||"0",10))}
            className="w-24 border border-gray-300 rounded px-2 py-1"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <div>
          <label className="text-sm text-gray-700">Name</label>
          <input className="w-full border border-gray-300 rounded px-2 py-1 mt-1" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Email</label>
          <input className="w-full border border-gray-300 rounded px-2 py-1 mt-1" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
      </div>

      <button
        onClick={handleDonate}
        className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
      >
        Donate ₹{amount || 0}
      </button>

      <p className="text-xs text-gray-500 mt-3">
        नोट: यह general wellness प्रोजेक्ट है — medical advice नहीं देता (non-clinical). Server-side orders जोड़कर आप production-grade कर सकते हैं:contentReference[oaicite:4]{index=4}।
      </p>
    </div>
  );
}
