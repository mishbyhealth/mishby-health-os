// File: src/App.tsx
import React from "react";
import SideNav from "@/components/SideNav";
import Header from "@/components/Header";   // ✅ keep as Header
import Footer from "@/components/Footer";
import AppRoutes from "@/routes/AppRoutes";

export default function App() {
  return (
    <div className="min-h-screen flex bg-emerald-50/30">
      <SideNav />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1">
          <AppRoutes />
        </div>
        <Footer />
      </main>
    </div>
  );
}
