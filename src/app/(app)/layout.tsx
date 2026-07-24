import type { ReactNode } from "react";
import { AppShell } from "@/shared/ui/shell/AppShell";

/**
 * Groupe de routes authentifié. La garde d'accès est assurée par
 * `src/proxy.ts` (redirection vers /login si pas de session).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
