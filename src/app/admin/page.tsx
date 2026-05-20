"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@/lib/session";
import { getSession, isSessionHydrated, refreshSession } from "@/lib/session";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminHomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(getSession());
    void (async () => {
      if (!isSessionHydrated()) {
        await refreshSession();
      }
      sync();
      setReady(true);
    })();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== "ADMIN") {
      router.replace("/admin/connexion");
    }
  }, [ready, router, session]);

  if (!ready || !session || session.role !== "ADMIN") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#6b6258]">
        Chargement…
      </div>
    );
  }

  return <AdminDashboard />;
}
