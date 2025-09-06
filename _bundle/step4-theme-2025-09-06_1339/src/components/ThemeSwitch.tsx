// src/components/ThemeSwitch.tsx
import { useEffect, useState } from "react";
import {
  THEMES,
  loadTheme,
  saveTheme,
  applyTheme,
  nextTheme,
  loadLock,
  saveLock,
  type Theme,
} from "@/utils/theme";

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("classic");
  const [locked, setLocked] = useState<boolean>(false);

  useEffect(() => {
    // Initialize from storage/env
    const t = loadTheme();
    setTheme(t);
    applyTheme(t);
    const lk = loadLock();
    setLocked(lk);
    document.documentElement.setAttribute("data-locked", lk ? "1" : "0");
  }, []);

  function onCycleTheme() {
    const nxt = nextTheme(theme);
    setTheme(nxt);
    saveTheme(nxt);
    applyTheme(nxt);
  }

  function onToggleLock() {
    const nxt = !locked;
    setLocked(nxt);
    saveLock(nxt);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCycleTheme}
        className="px-3 py-1 rounded-full border text-sm"
        title="Cycle theme"
      >
        Theme: {capitalize(theme)}
      </button>
      <button
        type="button"
        onClick={onToggleLock}
        className="px-3 py-1 rounded-full border text-sm"
        title="Toggle read-only lock"
      >
        {locked ? "🔒 Locked" : "🔓 Unlocked"}
      </button>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
