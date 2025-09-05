import React from "react";
import APP_META from "@/constants/appMeta";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="mt-8 border-t px-4 py-3 text-sm text-gray-700 flex items-center justify-between gw-hide-on-print"
      aria-label="App footer"
    >
      <span>
        {APP_META.versionLabel} • {APP_META.dateLabel}
      </span>
      <span className="opacity-75">
        © {APP_META.copyrightYear} {APP_META.brand}
      </span>
    </footer>
  );
}
