import { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import ThemeSwitch from "@/components/ThemeSwitch";

type Props = { children: ReactNode };

const Chip = ({ to, label }: { to: string; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "px-3 py-1 rounded-full text-sm border",
        "transition-opacity",
        isActive ? "opacity-100" : "opacity-75 hover:opacity-100",
      ].join(" ")
    }
  >
    {label}
  </NavLink>
);

export default function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Owner Lock banner via data-locked on <html> (handled in theme.ts) */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="mx-auto max-w-7xl px-3 md:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 mr-1">
            <div className="h-7 w-7 rounded-xl bg-[var(--chip)]" />
            <div className="font-semibold">GloWell</div>
          </Link>

          <nav className="flex flex-wrap gap-2 ml-1">
            <Chip to="/" label="Home" />
            <Chip to="/dashboard" label="Dashboard" />
            <Chip to="/health-form" label="Health Form" />
            <Chip to="/health-plan" label="Plan" />
            <Chip to="/plans" label="History" />
            <Chip to="/subscription" label="Subscription" />
            <Chip to="/settings" label="Settings" />
          </nav>

          <div className="ml-auto">
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="pb-16">{children}</main>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-3 md:px-6 py-6 text-sm opacity-80 flex items-center justify-between">
          <div>© {new Date().getFullYear()} GloWell — Live Naturally</div>
          <a className="underline opacity-80 hover:opacity-100" href="/health-plan#demo">
            Open Demo Plan
          </a>
        </div>
      </footer>
    </div>
  );
}
