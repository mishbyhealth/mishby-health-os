import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <Helmet>
        <title>GloWell — Live Naturally.</title>
        <meta
          name="description"
          content="GloWell helps you build calm, sustainable health habits—water, meals, movement, and sleep—through a clean, privacy-first experience."
        />
        <link rel="canonical" href="https://mishbyhealth.netlify.app/" />

        {/* Open Graph / Twitter (image add करेंगे अगले स्टेप में) */}
        <meta property="og:site_name" content="GloWell" />
        <meta property="og:title" content="GloWell — Live Naturally." />
        <meta
          property="og:description"
          content="Build simple, sustainable health habits with a calm, privacy-first app."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mishbyhealth.netlify.app/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GloWell — Live Naturally." />
        <meta
          name="twitter:description"
          content="Build simple, sustainable health habits with a calm, privacy-first app."
        />
      </Helmet>

      {/* Hero */}
      <div className="flex items-center justify-between">
        <div />
        <nav className="hidden md:flex gap-6 text-sm text-slate-700">
          <Link to="/">Home</Link>
          <Link to="/health-plan">Build Plan</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-teal-600" />
          <span className="font-semibold">GloWell</span>
        </div>

        <h1 className="text-3xl font-semibold">GloWell — Live Naturally.</h1>
        <p className="max-w-3xl text-slate-700">
          A calm, premium health experience designed to help you build sustainable habits,
          personalized plans, and lifelong wellness.
        </p>

        <div className="flex gap-3">
          <Link
            to="/health-plan"
            className="px-4 py-2 rounded-xl bg-teal-700 text-white shadow hover:opacity-90"
          >
            Build Plan
          </Link>
          <Link
            to="/about"
            className="px-4 py-2 rounded-xl bg-white border border-black/10 shadow hover:opacity-80"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Highlights */}
      <div className="space-y-2 text-slate-700">
        <p className="font-medium">Personalized Plans</p>
        <p>Generate a plan that adapts to your routines, goals, and preferences.</p>
        <p className="font-medium">Daily Tracking</p>
        <p>Keep gentle tabs on water, meals, activity, and sleep.</p>
        <p className="font-medium">Guided Learning</p>
        <p>Bite-size insights to build healthy habits that last.</p>
      </div>
    </section>
  );
}
