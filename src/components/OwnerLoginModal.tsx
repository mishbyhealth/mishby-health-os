// src/components/OwnerLoginModal.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * OwnerLoginModal — v18.4
 * - Opens via prop (open) OR global keyboard: Ctrl + Alt + O
 * - Verifies PIN from localStorage key: "glowell:ownerPin" (fallback once: "2468" if never set)
 * - On success: sets "glowell:ownerUnlocked" = "1" and dispatches "glowell:ownerUnlockedChanged"
 * - High z-index so it works even when Maintenance overlay is visible.
 *
 * Terms (Hindi):
 * - Modal: स्क्रीन पर खुलने वाला छोटा pop-up
 * - PIN: आपकी owner password (4+ digit)
 */

const OWNER_UNLOCK_KEY = "glowell:ownerUnlocked";
const OWNER_PIN_KEY = "glowell:ownerPin";
const FALLBACK_PIN = "2468";

function storGet(key: string): string | null {
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? window.sessionStorage?.getItem?.(key) ?? null : v;
  } catch { return null; }
}
function storSet(key: string, val: string) {
  try { window.localStorage.setItem(key, val); } catch {}
}
function getCurrentPin(): string {
  const saved = storGet(OWNER_PIN_KEY);
  return saved && saved.trim() ? saved : FALLBACK_PIN;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function OwnerLoginModal({ open, onClose }: Props) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const tryUnlock = async () => {
    setErr("");
    setBusy(true);
    try {
      const ok = pin && pin.trim() === getCurrentPin();
      if (!ok) {
        setErr("Incorrect PIN");
        return;
      }
      storSet(OWNER_UNLOCK_KEY, "1");
      try {
        window.dispatchEvent(new CustomEvent("glowell:ownerUnlockedChanged", { detail: { unlocked: true } }));
      } catch {}
      setPin("");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  // Keyboard: Enter to submit, Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") tryUnlock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global shortcut to open (Ctrl + Alt + O)
  const [visible, setVisible] = useState(open);
  useEffect(() => { setVisible(open); }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ctrlKey + altKey + key === 'o' (case-insensitive)
      if (e.ctrlKey && e.altKey && (e.key === "o" || e.key === "O")) {
        setVisible(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeAndClear = () => { setPin(""); setErr(""); setVisible(false); onClose(); };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10050] flex items-center justify-center"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={closeAndClear} />
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl border p-5">
        <h2 className="text-lg font-semibold mb-2">Owner Login</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your PIN to unlock Owner mode.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="PIN"
            className="flex-1 rounded-md border px-3 py-2"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button
            type="button"
            onClick={tryUnlock}
            disabled={!pin || busy}
            className={`rounded-full border px-4 py-2 text-sm ${busy ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"}`}
          >
            {busy ? "Unlocking..." : "Unlock"}
          </button>
        </div>
        {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={closeAndClear}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Tip: You can open this with <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>O</kbd> from anywhere.
        </p>
      </div>
    </div>
  );
}
