// src/pages/About.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-emerald-900">About GloWell</h1>
          <p className="mt-2 text-gray-600">
            Simple, sustainable, <span className="font-medium">non-clinical</span> wellness guidance to build calm daily habits.
          </p>
        </header>

        {/* Mission */}
        <section className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold text-emerald-900">Our Mission</h2>
          <p className="mt-2 text-gray-700">
            Help anyone create gentle routines—hydration, movement, sleep, and mindful pauses—without overwhelm.
          </p>
          <ul className="mt-4 list-disc pl-6 text-gray-700 space-y-1">
            <li>Keep it practical and lightweight.</li>
            <li>Privacy by default—plans live on your device unless you share.</li>
            <li>Clear, non-clinical language with safety guardrails.</li>
          </ul>
        </section>

        {/* What you can do */}
        <section className="grid md:grid-cols-3 gap-4">
          {[
            { title: "New Plan", desc: "Generate a neutral daily plan in minutes.", to: "/health-form" },
            { title: "Current Plan", desc: "Open your saved plan and follow along.", to: "/health-plan" },
            { title: "History", desc: "Browse recent plans and reuse what worked.", to: "/plans-v2/history" },
          ].map((c) => (
            <div key={c.title} className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-5">
              <h3 className="text-lg font-semibold text-emerald-900">{c.title}</h3>
              <p className="mt-1 text-gray-600">{c.desc}</p>
              <Link to={c.to} className="inline-block mt-3 px-3 py-1.5 rounded-lg border hover:bg-gray-50">
                Open
              </Link>
            </div>
          ))}
        </section>

        {/* Donate */}
        <section className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold text-emerald-900">Support GloWell</h2>
          <p className="mt-2 text-gray-700">
            Your contribution helps keep GloWell simple and accessible for everyone.
          </p>
          <Link
            to="/donate"
            className="inline-block mt-3 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Go to Donate
          </Link>
        </section>

        {/* Contact / Legal */}
        <section className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold text-emerald-900">Contact & Legal</h2>
          <p className="mt-2 text-gray-700">
            Feedback or ideas? Reach us via the Donate page note or your usual channel.
          </p>
          <ul className="mt-3 text-sm text-gray-600 space-y-1">
            <li><span className="font-medium">Disclaimer:</span> GloWell shares general wellness suggestions only. It is not medical advice.</li>
            <li><Link to="/about#privacy" className="underline">Privacy</Link> • <Link to="/about#terms" className="underline">Terms</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
