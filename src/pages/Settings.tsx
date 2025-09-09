import { useEffect, useState } from "react";
import { getAiPlanEnabled, setAiPlanEnabled } from "@/services/planService";
import { hasPin, isUnlocked, setPin, unlockWithPin, lockOwner } from "@/utils/ownerPin";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Settings() {
  const [aiOn, setAiOn] = useState(false);
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);
  const [pinExists, setPinExists] = useState(false);

  useEffect(() => {
    setAiOn(getAiPlanEnabled());
    setOwnerUnlocked(isUnlocked());
    setPinExists(hasPin());
  }, []);

  async function onUnlock() {
    const pin = window.prompt("Enter Owner PIN");
    if (!pin) return;
    const ok = await unlockWithPin(pin);
    setOwnerUnlocked(ok);
    if (!ok) alert("Incorrect PIN");
  }

  async function onSetPin() {
    const p1 = window.prompt("Set NEW Owner PIN");
    if (!p1) return;
    const p2 = window.prompt("Confirm NEW Owner PIN");
    if (p1 !== p2) return alert("PINs do not match");
    await setPin(p1);
    alert("Owner PIN saved");
    setPinExists(true);
  }

  function onLock() {
    lockOwner();
    setOwnerUnlocked(false);
  }

  const onToggleAi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setAiOn(next);
    setAiPlanEnabled(next);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>

      {/* Owner access */}
      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-xl font-medium mb-3">Owner Access</h2>
        {!pinExists ? (
          <button className="gw-btn" onClick={onSetPin}>Set Owner PIN</button>
        ) : ownerUnlocked ? (
          <div className="flex gap-2">
            <span className="text-sm opacity-70 self-center">Owner unlocked for this browser session.</span>
            <button className="gw-btn" onClick={onLock}>Lock Owner Mode</button>
          </div>
        ) : (
          <button className="gw-btn" onClick={onUnlock}>Unlock Owner Mode</button>
        )}
        <p className="mt-2 text-xs opacity-70">
          PIN is stored as a one-way hash in <code>localStorage</code>; unlock state in <code>sessionStorage</code>.
        </p>
      </section>

      {/* AI Plan (Owner-only) */}
      <section className="mb-8 rounded-xl border p-4">
        <h2 className="text-xl font-medium mb-2">AI Plan (Owner-only)</h2>
        {!ownerUnlocked ? (
          <p className="text-sm opacity-70">Unlock Owner Mode to manage AI Plan.</p>
        ) : (
          <>
            <p className="text-sm opacity-80 mb-3">
              Enable a serverless-generated, non-clinical plan. If disabled or API fails, the app uses a template plan.
            </p>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={aiOn} onChange={onToggleAi} className="h-5 w-5" />
              <span className="font-medium">Enable AI Plan</span>
            </label>
            <p className="mt-2 text-xs opacity-70">Key: <code>glowell:aiPlan:on</code></p>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
