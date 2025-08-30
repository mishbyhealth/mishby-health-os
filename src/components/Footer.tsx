// File: src/components/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-10 border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-gray-600 flex items-center justify-between">
        <div>© {new Date().getFullYear()} GloWell — all rights reserved.</div>
        <div className="flex items-center gap-4">
          <Link to="/donate" className="text-emerald-700 hover:underline">Donate</Link>
          <Link to="/about" className="text-emerald-700 hover:underline">About GloWell</Link>
          <span className="hidden md:inline">
            Non-clinical, general wellness guidance. Not medical advice.
          </span>
        </div>
      </div>
    </footer>
  );
}
