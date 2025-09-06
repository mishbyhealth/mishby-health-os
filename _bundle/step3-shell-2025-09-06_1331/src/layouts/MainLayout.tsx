// src/layouts/MainLayout.tsx
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";

export default function MainLayout() {
  const { pathname } = useLocation();

  const link = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-2 py-1 rounded transition-colors",
          isActive ? "bg-white gw-link-active" : "hover:bg-white/60",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full border" aria-hidden />
            <span className="font-semibold">GloWell</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {link("/", "Home")}
            {link("/dashboard", "Dashboard")}
            {link("/health-form", "Health Form")}
            {link("/health-plan", "Health Plan")}
            {link("/plans", "Plans")}
            {link("/settings", "Settings")}
            {link("/subscription", "Subscription")}
            {link("/_ping", "_ping")}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs gw-muted flex justify-between">
          <span>© {new Date().getFullYear()} GloWell — Live Naturally</span>
          <span>Path: {pathname}</span>
        </div>
      </footer>
    </div>
  );
}
