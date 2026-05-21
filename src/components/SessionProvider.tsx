"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { prefetchPublicContent, resetPublicContentCache } from "@/lib/adminData";
import { refreshSession } from "@/lib/session";

/**
 * Hydrate la session à chaque navigation, puis précharge le bundle public.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    void refreshSession().then((user) => {
      if (user) resetPublicContentCache();
      prefetchPublicContent();
    });
  }, [pathname]);

  useEffect(() => {
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
