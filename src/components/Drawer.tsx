// src/components/Drawer.tsx
import React, { useEffect } from "react";

type DrawerProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  widthClassName?: string; // e.g., "max-w-xl"
  children: React.ReactNode;
};

export default function Drawer({
  open,
  title,
  onClose,
  widthClassName = "max-w-2xl",
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={
          `absolute inset-y-0 right-0 w-full md:w-auto bg-white shadow-xl overflow-auto p-4 md:p-6 
           rounded-l-xl md:rounded-l-2xl ` + widthClassName
        }
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{title || "Edit"}</h2>
          <button className="gw-btn" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
