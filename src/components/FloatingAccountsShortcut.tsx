import React from "react";
import { isOwnerActive } from "@/utils/mode";
import { useNavigate, useLocation } from "react-router-dom";

export default function FloatingAccountsShortcut() {
  const [show, setShow] = React.useState(isOwnerActive());
  const nav = useNavigate();
  const loc = useLocation();

  React.useEffect(() => {
    const onAuth = (e: any) => setShow(!!e.detail);
    const onMode = () => setShow(isOwnerActive());
    window.addEventListener("glowell:ownerauthchange", onAuth as EventListener);
    window.addEventListener("glowell:modechange", onMode as EventListener);
    return () => {
      window.removeEventListener("glowell:ownerauthchange", onAuth as EventListener);
      window.removeEventListener("glowell:modechange", onMode as EventListener);
    };
  }, []);

  if (!show) return null;
  const onClick = () => { if (loc.pathname !== "/accounts") nav("/accounts"); };

  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-24 z-50 rounded-2xl shadow-lg border backdrop-blur px-3 py-2
                 bg-white/85 dark:bg-neutral-900/85 border-neutral-200 dark:border-neutral-800"
      title="Open Accounts (Owner)"
    >
      Accounts
    </button>
  );
}
