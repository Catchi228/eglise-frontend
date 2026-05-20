"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";

export function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLogin =
    pathname === "/admin/connexion" || pathname.startsWith("/admin/connexion/");

  if (isAdmin) {
    if (isAdminLogin) {
      return (
        <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
          {children}
        </div>
      );
    }
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[#ebe4dc] text-[#1f1c18]">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#f5f0e8] via-[#ebe4d8]/95 to-[#d8cfc4]/90" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(251,191,36,0.12),transparent_52%)]" />
        {children}
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
