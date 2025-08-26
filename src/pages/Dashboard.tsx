// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import ProgressBar from "@/components/ProgressBar";

type Profile = {
  name?: string;
  age?: number;
  gender?: string;
  language?: string;
  lifestyle?: "sedentary" | "light" | "moderate" | "active" | "athlete" | string;
  goal?: "weight-loss" | "fitness" | "wellness" | "muscle" | string;
  waterTargetMl?: number;
  stepsTarget?: number;
};

// --- helpers ---------------------------------------------------------------
const LS_KEYS = {
  profile: "profile",
  waterMl: "dash.waterMl",
  steps: "dash.steps",
  mood: "dash.mood",
  reminders: "dash.reminders",
  community: "dash.community",
};

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(LS_KEYS.profile);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Sensible defaults if profile didn't set targets
function defaultWaterTargetMl(lifestyle?: string) {
  switch (lifestyle) {
    case "active":
    case "athlete":
      return 2800;
    case "moderate":
      return 2400;
    case "light":
      return 2200;
    default:
      return 2000; // sedentary/unknown
  }
}
function defaultStepsTarget(lifestyle?: string) {
  switch (lifestyle) {
    case "athlete":
      return 12000;
    case "active":
      return 10000;
    case "moderate":
      return 8000;
    default:
      return 6000; // light/sedentary/unknown
  }
}

// --- page ------------------------------------------------------------------
export default function Dashboard() {
  // Profile
  const [profile, setProfile] = useState<Profile>({});

  // Trackers (persisted)
  const [waterMl, setWaterMl] = useState<number>(0);
  const [stepsCount, setStepsCount] = useState<number>(0);
  const [mood, setMood] = useState<string>("🙂 Okay");

  // Simple community + reminders (persisted)
  const [communityText, setCommunityText] = useState("");
  const [communityFeed, setCommunityFeed] = useState<string[]>([]);
  const [reminderText, setReminderText] = useState("");
  const [reminders, setReminders] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    setProfile(loadProfile());

    const w = localStorage.getItem(LS_KEYS.waterMl);
    const s = localStorage.getItem(LS_KEYS.steps);
    const m = localStorage.getItem(LS_KEYS.mood);
    const rf = localStorage.getItem(LS_KEYS.reminders);
    const cf = localStorage.getItem(LS_KEYS.community);

    if (w) setWaterMl(Number(w) || 0);
    if (s) setStepsCount(Number(s) || 0);
    if (m) setMood(m);
    if (rf) {
      try {
        setReminders(JSON.parse(rf));
      } catch {
        /* ignore */
      }
    }
    if (cf) {
      try {
        setCommunityFeed(JSON.parse(cf));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEYS.waterMl, String(clamp(waterMl, 0, 10000)));
  }, [waterMl]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.steps, String(clamp(stepsCount, 0, 50000)));
  }, [stepsCount]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.mood, mood);
  }, [mood]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.reminders, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.community, JSON.stringify(communityFeed));
  }, [communityFeed]);

  // Targets resolved from profile (with safe defaults)
  const waterTargetMl = useMemo(() => {
    return Number(profile.waterTargetMl) > 0
      ? Number(profile.waterTargetMl)
      : defaultWaterTargetMl(profile.lifestyle);
  }, [profile]);

  const stepsTarget = useMemo(() => {
    return Number(profile.stepsTarget) > 0
      ? Number(profile.stepsTarget)
      : defaultStepsTarget(profile.lifestyle);
  }, [profile]);

  const welcomeName = profile?.name?.trim() || "Friend";

  // --- UI actions ----------------------------------------------------------
  const addWater = (ml: number) => setWaterMl((v) => clamp(v + ml, 0, 10000));
  const addSteps = (n: number) => setStepsCount((v) => clamp(v + n, 0, 50000));

  const addReminder = () => {
    const t = reminderText.trim();
    if (!t) return;
    setReminders((arr) => [t, ...arr]);
    setReminderText("");
  };
  const removeReminder = (idx: number) => {
    setReminders((arr) => arr.filter((_, i) => i !== idx));
  };

  const postCommunity = () => {
    const t = communityText.trim();
    if (!t) return;
    setCommunityFeed((arr) => [t, ...arr]);
    setCommunityText("");
  };

  // --- render --------------------------------------------------------------
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      {/* Header */}
      <header className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-4 border-b">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {welcomeName} 👋
        </h1>
        <p className="text-sm text-gray-600">
          Goal: {profile.goal || "wellness"} &middot; Lifestyle:{" "}
          {profile.lifestyle || "unknown"}
        </p>
      </header>

      {/* Trackers */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Water */}
        <div className="rounded-2xl border p-4 bg-gradient-to-br from-violet-50 to-teal-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Water</h2>
            <div className="text-xs text-gray-500">Target: {waterTargetMl} ml</div>
          </div>

          {/* NEW Progress Bar */}
          <div className="mt-3">
            <ProgressBar
              label="Daily Hydration"
              current={waterMl}
              target={waterTargetMl}
              unit="ml"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[200, 250, 300, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => addWater(ml)}
                className="px-3 py-1.5 rounded-xl border text-sm hover:bg-white"
              >
                +{ml} ml
              </button>
            ))}
            <button
              onClick={() => setWaterMl(0)}
              className="ml-auto px-3 py-1.5 rounded-xl border text-sm hover:bg-white"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="rounded-2xl border p-4 bg-gradient-to-br from-violet-50 to-teal-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Steps</h2>
            <div className="text-xs text-gray-500">Target: {stepsTarget}</div>
          </div>

          {/* NEW Progress Bar */}
          <div className="mt-3">
            <ProgressBar
              label="Daily Steps"
              current={stepsCount}
              target={stepsTarget}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[500, 1000, 2000].map((n) => (
              <button
                key={n}
                onClick={() => addSteps(n)}
                className="px-3 py-1.5 rounded-xl border text-sm hover:bg-white"
              >
                +{n}
              </button>
            ))}
            <button
              onClick={() => setStepsCount(0)}
              className="ml-auto px-3 py-1.5 rounded-xl border text-sm hover:bg-white"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Mood */}
      <section className="mt-6 rounded-2xl border p-4">
        <h2 className="text-lg font-medium mb-2">Mood</h2>
        <select
          className="w-full md:w-64 rounded-xl border px-3 py-2"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        >
          <option>😄 Great</option>
          <option>🙂 Okay</option>
          <option>😐 Neutral</option>
          <option>😕 Low</option>
          <option>😞 Bad</option>
        </select>
        <p className="mt-2 text-sm text-gray-600">Current: {mood}</p>
      </section>

      {/* Reminders */}
      <section className="mt-6 rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Reminders</h2>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="e.g., Drink water at 11:30"
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
          />
          <button
            onClick={addReminder}
            className="px-3 py-2 rounded-xl border hover:bg-white"
          >
            Add
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {reminders.length === 0 && (
            <li className="text-sm text-gray-500">No reminders yet.</li>
          )}
          {reminders.map((r, i) => (
            <li
              key={`${r}-${i}`}
              className="flex items-center justify-between rounded-xl border px-3 py-2"
            >
              <span className="text-sm">{r}</span>
              <button
                onClick={() => removeReminder(i)}
                className="text-xs text-red-600 hover:underline"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Community */}
      <section className="mt-6 rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Community</h2>
        </div>
        <textarea
          className="w-full rounded-xl border px-3 py-2"
          rows={3}
          placeholder="Share a thought, tip, or progress update..."
          value={communityText}
          onChange={(e) => setCommunityText(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={postCommunity}
            className="px-3 py-2 rounded-xl border hover:bg-white"
          >
            Post
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {communityFeed.length === 0 && (
            <p className="text-sm text-gray-500">No posts yet.</p>
          )}
          {communityFeed.map((post, idx) => (
            <div
              key={`${idx}-${post.slice(0, 8)}`}
              className="rounded-xl border p-3 bg-white/60"
            >
              <div className="text-xs text-gray-500 mb-1">
                {welcomeName} • {new Date().toLocaleString()}
              </div>
              <div className="text-sm">{post}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        Built with calm theme • Stay hydrated 🌿
      </footer>
    </div>
  );
}
