// src/pages/Settings.tsx (compat with any owner.ts)
import { useEffect, useState } from "react";
import { getAiPlanEnabled, setAiPlanEnabled } from "@/services/planService";
import * as Owner from "@/utils/owner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MODE_KEY = "glowell:mode";

function getModeSafe(): "owner" | "user" {
  try {
    if (typeof Owner.getMode === "function") return Owner.getMode();
    if (typeof Owner.isOwner === "function") return Owner.isOwner() ? "owner" : "user";
    return localStorage.getItem(MODE_KEY) === "owner" ? "owner" : "user";
  } catch {
    return "user";
  }
}

function setOwnerModeSafe(on: boolean) {
  try {
    if (typeof Owner.setOwnerMode === "function") {
      Owner.setOwnerMode(on);
    } else {
      localStorage.setItem(MODE_KEY, on ? "owner" : "user");
      document.documentElement.setAttribute("data-mode", on ? "owner" : "user");
    }
  } catch {}
}

export default function Settings() {
  const [mode, setMode] = useState<"owner" | "user">("user");
  const [aiOn, setAiOn] = useState(false);

  useEffect(() => {
    setMode(getModeSafe());
    setAiOn(getAiPlanEnabled());
  }, []);

  const toggleMode = (next: "owner" | "user") => {
    setMode(next);
    setOwnerModeSafe(next === "owner");
  };

  const onToggleAi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setAiOn(next);
    setAiPlanEnabled(next);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>

      {/* Owner/User Mode */}
      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-xl font-medium mb-3">Mode</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === "user"}
              onChange={() => toggleMode("user")}
            />
            <span>User Mode</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === "owner"}
              onChange={() => toggleMode("owner")}
            />
            <span>Owner Mode</span>
          </label>
        </div>
        <p className="mt-2 text-xs opacity-70">
          Persists in browser (localStorage). Key: <code>glowell:mode</code>
        </p>
      </section>

      {/* AI Plan (Owner-only) */}
      <section className="mb-8 rounded-xl border p-4">
        <h2 className="text-xl font-medium mb-2">AI Plan (Owner-only)</h2>
        {mode !== "owner" ? (
          <p className="text-sm opacity-70">
            Switch to <b>Owner Mode</b> above to manage AI Plan settings.
          </p>
        ) : (
          <>
            <p className="text-sm opacity-80 mb-3">
              Enable a serverless-generated, non-clinical plan. If disabled or API fails,
              the app will use the template/fallback plan.
            </p>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={aiOn}
                onChange={onToggleAi}
                className="h-5 w-5"
              />
              <span className="font-medium">Enable AI Plan</span>
            </label>
            <p className="mt-2 text-xs opacity-70">
              Persists in browser. Key: <code>glowell:aiPlan:on</code>
            </p>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
