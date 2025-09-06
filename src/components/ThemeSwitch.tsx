import { useEffect, useState } from "react";

const THEMES = ["classic","mint","sky","lavender","sunset","forest","slate"] as const;
type Theme = typeof THEMES[number];
const KEY = "glowell:theme";

function loadTheme(): Theme {
  const t = localStorage.getItem(KEY) as Theme | null;
  return THEMES.includes((t as any)) ? (t as Theme) : "classic";
}
function applyTheme(t: Theme){
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(KEY, t);
}

export default function ThemeSwitch(){
  const [theme, setTheme] = useState<Theme>(() => loadTheme());

  useEffect(()=>{ applyTheme(theme); }, [theme]);

  function next(){
    const i = THEMES.indexOf(theme);
    const n = THEMES[(i+1)%THEMES.length];
    setTheme(n);
  }

  const label = theme.charAt(0).toUpperCase() + theme.slice(1);
  return <button className="gw-btn" onClick={next}>Theme: {label}</button>;
}
