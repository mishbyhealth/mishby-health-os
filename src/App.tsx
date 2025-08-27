import React from "react";
import AppRoutes from "./routes/AppRoutes";
import SideNav from "./components/SideNav";

export default function App() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-black/5">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="GloWell"
            className="h-8 w-8 rounded-xl shadow"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
          <h1 className="font-semibold tracking-wide">GloWell</h1>
        </div>
      </header>

      {/* Main layout: Sidebar + Page Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar navigation */}
        <aside className="hidden lg:block">
          <SideNav />
        </aside>

        {/* Page content */}
        <main className="min-w-0">
          <AppRoutes />
        </main>
      </div>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-sm opacity-70">
        © {new Date().getFullYear()} GloWell
      </footer>
    </div>
  );
}
