import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-[color:var(--gw-border)] bg-white">
      {/* Top grid */}
      <div className="gw-container py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Brand block */}
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="GloWell"
              className="h-[5rem] md:h-[6rem] w-auto object-contain"
            />
            <span className="sr-only">GloWell</span>
          </div>
          {/* Tagline intentionally removed */}
        </div>

        {/* Product */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="link" to="/dashboard">Dashboard</Link></li>
            <li><Link className="link" to="/health-plan">Plans</Link></li>
            <li><Link className="link" to="/learn">Learn</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="link" to="/">About</Link></li>
            <li><Link className="link" to="/">Contact</Link></li>
          </ul>
        </div>

        {/* Subscribe */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Stay Updated</h4>
          <form className="flex items-center gap-2">
            <input className="input" placeholder="Email address" />
            <button type="button" className="btn btn-outline">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[color:var(--gw-border)] bg-white">
        <div className="gw-container py-4 text-xs gw-muted">
          © {new Date().getFullYear()} GloWell — wellness guidance only.
        </div>
      </div>
    </footer>
  );
}
