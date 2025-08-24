import React from "react";

export default function Learn() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Learn</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { t: "Hydration Basics", d: "How much water do you really need?" },
          { t: "Gentle Morning Routines", d: "Stretch, breathe, and set your day." },
          { t: "Smart Snacking", d: "Balance energy without sugar spikes." },
        ].map((x) => (
          <article key={x.t} className="card card-hover p-5">
            <h3 className="font-semibold">{x.t}</h3>
            <p className="mt-2 text-sm gw-muted">{x.d}</p>
            <button className="mt-3 btn btn-ghost">Read</button>
          </article>
        ))}
      </div>
    </div>
  );
}
