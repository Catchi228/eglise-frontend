"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { initTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    initTheme();
  }, []);
  return <>{children}</>;
}
