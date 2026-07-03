"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/shell/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // /admin/login lives under this layout but must remain reachable without an
  // active session — otherwise the gate traps it on a permanent spinner
  // (chicken-and-egg: must be logged in as admin to log in as admin).
  if (pathname === "/admin/login") return <>{children}</>;

  return <AppShell portal="admin">{children}</AppShell>;
}
