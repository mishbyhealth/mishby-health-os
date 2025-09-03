// src/components/Footer.tsx
import React from "react";
import { APP_META } from "@/constants/appMeta";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mt-4 rounded-xl border bg-white/70 px-4 py-2 text-sm text-gray-700">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold">GloWell</span>
          <span>•</span>
          <span>{APP_META.versionLabel}</span>
          <span>•</span>
          <span>{APP_META.contextDate}</span>
          <span>•</span>
          <span>© {year} GloWell</span>
          <span>•</span>
          <span>Neutral wellness guidance (non-clinical)</span>
        </div>
      </div>
    </div>
  );
};

export default Footer;
