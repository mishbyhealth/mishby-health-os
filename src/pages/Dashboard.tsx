// src/pages/Dashboard.tsx
import React from "react";
import SupportGloWellCard from "@/components/SupportGloWellCard";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-5">
      <h3 className="text-lg font-semibold text-emerald-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  // TODO: Wire with your real data (v9: Recent Plans V2, analytics widgets):contentReference[oaicite:6]{index=6}
  const recentPlans = []; // placeholder
  const totalPlans = 0;   // placeholder

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-900">Dashboard</h1>
          <p className="text-gray-600">Build simple, sustainable wellness habits — non-clinical guidance.</p>
        </header>

        {/* Top row: Analytics + Support card */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card title="Total Plans (V2)">
            <div className="text-3xl font-semibold">{totalPlans}</div>
            <p className="text-sm text-gray-600 mt-1">Last ~5 weeks trend (CSS bars planned):contentReference[oaicite:7]{index=7}</p>
          </Card>

          <Card title="Top Tags">
            <p className="text-sm text-gray-600">Clickable chips to filter history (planned):contentReference[oaicite:8]{index=8}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full border text-sm">hydration</span>
              <span className="px-3 py-1 rounded-full border text-sm">sleep</span>
            </div>
          </Card>

          {/* New: Support / Donate */}
          <SupportGloWellCard />
        </div>

        {/* Recent Plans */}
        <div className="grid gap-6">
          <Card title="Recent Plans (V2)">
            {recentPlans.length === 0 ? (
              <p className="text-sm text-gray-600">No plans yet. Create a new plan from Health Form.</p>
            ) : (
              <ul className="space-y-2">
                {recentPlans.map((p: any, idx: number) => (
                  <li key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Plan #{idx + 1}</div>
                      <div className="text-xs text-gray-500">{p?.meta?.generatedAtISO}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded border">View</button>
                      <button className="px-3 py-1 rounded border">PDF</button>
                      <button className="px-3 py-1 rounded border">WhatsApp</button>
                      <button className="px-3 py-1 rounded border">Copy</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
