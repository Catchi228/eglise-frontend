"use client";

import { useEffect } from "react";
import { getSession } from "@/lib/session";

const HEARTBEAT_MS = 20_000;

export function usePresenceHeartbeat() {
  useEffect(() => {
    let stopped = false;

    async function beat() {
      const s = getSession();
      if (!s || stopped) return;
      try {
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: s.email, role: s.role }),
        });
      } catch {
        // ignore
      }
    }

    // première impulsion + intervalle
    void beat();
    const t = window.setInterval(() => void beat(), HEARTBEAT_MS);

    // si l’onglet redevient actif
    const onVis = () => {
      if (document.visibilityState === "visible") void beat();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopped = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}

