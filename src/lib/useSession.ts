"use client";

import { useEffect, useState } from "react";
import {
  getSession,
  isSessionHydrated,
  refreshSession,
  subscribeSession,
  type Session,
} from "./session";

/** Session client avec attente de l'appel /api/auth/me (évite les faux « Connectez-vous »). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [ready, setReady] = useState(() => isSessionHydrated());

  useEffect(() => {
    let cancelled = false;
    void refreshSession().then((s) => {
      if (!cancelled) {
        setSession(s);
        setReady(true);
      }
    });
    const sync = () => {
      setSession(getSession());
      if (isSessionHydrated()) setReady(true);
    };
    const unsub = subscribeSession(sync);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return { session, ready, isLoggedIn: Boolean(session) };
}
