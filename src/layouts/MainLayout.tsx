import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

type Props = { children: React.ReactNode };

export default function MainLayout({ children }: Props) {
  return (
    <div className="min-h-dvh gw-bg flex flex-col">
      <Header />

      {/* Pad for the taller sticky header (match Header bar height) */}
      <main className="flex-1 pt-[6.75rem] md:pt-[7.75rem]">
        <div className="gw-container py-6">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
