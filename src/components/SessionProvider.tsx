"use client";

import { useEffect } from "react";
import { prefetchPublicContent, resetPublicContentCache } from "@/lib/adminData";
import { refreshSession } from "@/lib/session";

/**
 * Hydrate la session côté client au démarrage de l'app, puis rafraîchit
 * périodiquement (toutes les 5 min) pour détecter les expirations.
 * Précharge le bundle public (annonces + cours) dès que la session est connue.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void refreshSession().then((user) => {
      if (user) resetPublicContentCache();
      prefetchPublicContent();
    });
    const onFocus = () => void refreshSession();
    window.addEventListener("focus", onFocus);

    const t = window.setInterval(() => void refreshSession(), 5 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(t);
    };
  }, []);

  return <>{children}</>;
}
