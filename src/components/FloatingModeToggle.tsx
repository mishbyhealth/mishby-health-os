// src/components/FloatingModeToggle.tsx
import React from "react";
import { getMode, switchMode, isOwnerActive } from "@/utils/mode";

export default function FloatingModeToggle() {
  const [mode, setMode] = React.useState(getMode());
  const [ownerOK, setOwnerOK] = React.useState(isOwnerActive());

  React.useEffect(() => {
    const onMode = (e: any) => setMode(e.detail);
    const onAuth = (e: any) => setOwnerOK(!!e.detail);
    window.addEventListener("glowell:modechange", onMode as EventListener);
    window.addEventListener("glowell:ownerauthchange", onAuth as EventListener);
    return () => {
      window.removeEventListener("glowell:modechange", onMode as EventListener);
      window.removeEventListener("glowell:ownerauthchange", onAuth as EventListener);
    };
  }, []);

  const toUser = async () => {
    const ok = await switchMode("user");
    if (ok) setMode("user");
  };

  const toOwner = async () => {
    const ok = await switchMode("owner");
    if (ok) {
      setMode("owner");
      setOwnerOK(true);
    }
  };

  const isOwnerBtnActive = mode === "owner" && ownerOK;
  const isUserBtnActive = mode === "user";

  return (
    <div
      className="fixed right-4 bottom-4 z-50 rounded-2xl shadow-lg border backdrop-blur px-2 py-2 bg-white/85 dark:bg-neutral-900/85 border-neutral-200 dark:border-neutral-800"
      role="toolbar"
      aria-label="Mode"
    >
      <div className="text-[10px] text-neutral-500 px-1 pb-1 uppercase tracking-wider font-semibold">
        Mode
      </div>
      <div className="flex gap-1">
        <button
          onClick={toUser}
          className={`px-3 py-1 rounded-xl text-sm border ${
            isUserBtnActive
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-800 border-neutral-300"
          }`}
          title="Switch to User Mode"
        >
          User
        </button>
        <button
          onClick={toOwner}
          className={`px-3 py-1 rounded-xl text-sm border ${
            isOwnerBtnActive
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-800 border-neutral-300"
          }`}
          title="Owner Mode (passcode required)"
        >
          Owner
        </button>
      </div>
      <div className="mt-1 text-[10px] text-neutral-500 px-1">
        {isOwnerBtnActive ? "Owner tools unlocked" : "Owner tools locked"}
      </div>
    </div>
  );
}
