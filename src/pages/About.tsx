import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function About() {
  return (
    <section className="space-y-6">
      <Helmet>
        <title>About GloWell</title>
        <meta
          name="description"
          content="GloWell helps people improve mental and physical health through simple, safe and sustainable habits."
        />
        <link rel="canonical" href="https://mishbyhealth.netlify.app/about" />

        <meta property="og:site_name" content="GloWell" />
        <meta property="og:title" content="About GloWell" />
        <meta
          property="og:description"
          content="Learn our mission and promise: calm, privacy-first health habits that last."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mishbyhealth.netlify.app/about" />
        <meta property="og:image" content="https://mishbyhealth.netlify.app/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About GloWell" />
        <meta
          name="twitter:description"
          content="Our mission: simple, sustainable health habits—calm, respectful, ad-free."
        />
        <meta name="twitter:image" content="https://mishbyhealth.netlify.app/og.png" />
      </Helmet>

      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">About GloWell</h2>
        <Link
          to="/health-plan"
          className="px-4 py-2 rounded-xl bg-slate-800 text-white shadow hover:opacity-90"
        >
          Build Your Plan
        </Link>
      </header>

      <div className="grid gap-4">
        <Card title="Our Mission">
          <p className="text-slate-700">
            GloWell helps people improve their <strong>mental and physical health</strong> through
            simple, safe and sustainable habits—away from noise, closer to nature. We want every
            person to live with calm, compassion, and clarity.
          </p>
        </Card>

        <Card title="What You’ll Find">
          <ul className="list-disc ml-5 text-slate-700 space-y-1">
            <li>Evidence-informed daily routines (water, meals, movement, sleep)</li>
            <li>Clear language and small, actionable steps</li>
            <li>Beautiful PDF export and share-friendly plans</li>
            <li>Privacy-first design (your data stays yours)</li>
          </ul>
        </Card>

        <Card title="Our Promise">
          <p className="text-slate-700">
            GloWell is not a substitute for medical advice. It supports you in building healthy,
            everyday habits. We are committed to a safe, respectful, and ad-free experience.
          </p>
        </Card>

        <Card title="Contact">
          <p className="text-slate-700">
            Suggestions or questions:{" "}
            <a className="underline" href="mailto:hello@mishbyhealth.com">
              hello@mishbyhealth.com
            </a>
          </p>
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
