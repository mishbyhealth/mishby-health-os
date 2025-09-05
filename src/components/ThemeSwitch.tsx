// src/components/ThemeSwitch.tsx
import React, { useEffect, useState } from "react";
import { THEMES, loadTheme, saveTheme, applyTheme, loadLock, saveLock, type Theme } from "../utils/theme";

export default function ThemeSwitch(){
  const [theme, setTheme] = useState<Theme>(loadTheme());
  const [locked, setLocked] = useState<boolean>(loadLock());

  useEffect(()=>{ applyTheme(theme); saveTheme(theme); }, [theme]);
  useEffect(()=>{ document.documentElement.setAttribute("data-locked", locked ? "1" : "0"); saveLock(locked); }, [locked]);

  function cycle(){
    const idx = THEMES.indexOf(theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
  }

  return (
    <div style={{display:"flex", gap:8}}>
      <button className="gw-btn" title={`Theme: ${theme}`} onClick={cycle}>
        Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
      </button>
      <button className="gw-btn" title={locked ? "Unlock editing" : "Lock (read-only)"} onClick={()=>setLocked(v=>!v)}>
        {locked ? "🔒 Locked" : "🔓 Unlock"}
      </button>
    </div>
  );
}
