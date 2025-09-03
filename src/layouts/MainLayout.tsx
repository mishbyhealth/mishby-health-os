// src/layouts/MainLayout.tsx
import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrintHeader from "@/components/PrintHeader";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f6f5ef] text-gray-900">
      {/* Sticky screen header (hidden in print via PrintHeader's CSS) */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-6xl mx-auto px-4">
          <Header />
        </div>
      </header>

      {/* Print-only header (hidden on screen, shown in print) */}
      <div className="screen-only">
        {/* This wrapper gets hidden in print;
           inside, PrintHeader injects CSS and renders only for print */}
        <PrintHeader />
      </div>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {children}
      </main>

      {/* Screen footer (hidden in print via PrintHeader's CSS) */}
      <footer className="mt-10 border-t">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Footer />
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
