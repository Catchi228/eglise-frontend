"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/connexion" || pathname.startsWith("/admin/connexion/")) {
    return <>{children}</>;
  }
  return <AdminShell>{children}</AdminShell>;
}
