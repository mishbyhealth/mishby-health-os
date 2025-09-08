// src/context/AccountProvider.tsx
import React from "react";
import { getCurrentId } from "@/utils/accounts";

type Ctx = { currentAccountId: string };
const AccountContext = React.createContext<Ctx>({ currentAccountId: "self" });

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = React.useState<string>(() => getCurrentId());

  React.useEffect(() => {
    const onChange = (e: any) => setId(e?.detail || getCurrentId());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "glowell:account:current") setId(getCurrentId());
    };
    window.addEventListener("glowell:accountchange", onChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("glowell:accountchange", onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return <AccountContext.Provider value={{ currentAccountId: id }}>{children}</AccountContext.Provider>;
}

export function useAccountId() {
  return React.useContext(AccountContext).currentAccountId;
}
