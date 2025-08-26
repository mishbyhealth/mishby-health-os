/* ${pagesDir}/PlanViewV2.tsx
Elegant daily plan surface (neutral) */
import React from "react";

function Section({title,children}:{title:string;children:React.ReactNode}){
  return (
    <section className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-5">
      <h3 className="text-lg font-semibold text-emerald-900 mb-3">{title}</h3>
      {children}
    </section>
  );
}

export default function PlanViewV2({plan}:{plan:any}){
  const d = plan?.day||{};
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-emerald-900">Your Wellness Day</h2>
          <p className="text-gray-600 mt-1">{plan?.meta?.disclaimerText || "General wellness suggestions only (non-clinical)."}</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Hydration">
            <ul className="space-y-2">
              {(d.hydration?.schedule||[]).map((t:string,i:number)=>(
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"/><span className="font-medium">{t}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 mt-2">{(d.hydration?.notes||[]).join(" • ")}</p>
          </Section>

          <Section title="Movement">
            <ul className="list-disc pl-6">
              {(d.movement?.blocks||[]).map((b:string,i:number)=> <li key={i}>{b}</li>)}
            </ul>
            <p className="text-sm text-gray-600 mt-2">{(d.movement?.notes||[]).join(" • ")}</p>
          </Section>

          <Section title="Meals" >
            <div className="space-y-3">
              {(d.meals||[]).map((m:any,i:number)=>(
                <div key={i} className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="font-medium text-emerald-800">{m.label}</div>
                  <div className="text-sm text-gray-700">Ideas: {(m.ideas||[]).join(", ")}</div>
                  <div className="text-xs text-gray-500 italic">Avoid: {(m.avoid||[]).join(", ")}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Mindfulness">
            <ul className="list-disc pl-6">
              {(d.mind?.practices||[]).map((p:string,i:number)=> <li key={i}>{p}</li>)}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}