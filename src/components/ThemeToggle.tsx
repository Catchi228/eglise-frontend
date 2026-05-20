"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getThemeIsDark, subscribeTheme } from "@/lib/theme";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  className?: string;
  /** Style discret pour barre sombre */
  variant?: "nav" | "panel";
};

export function ThemeToggle({ className, variant = "panel" }: Props) {
  const dark = useSyncExternalStore(
    subscribeTheme,
    getThemeIsDark,
    () => false,
  );

  const nav = variant === "nav";

  return (
    <div
      className={cn(
        "flex rounded-full border p-0.5 shadow-sm",
        nav
          ? "border-white/15 bg-white/10 dark:border-white/15 dark:bg-white/10"
          : "border-[#d9cfc3]/85 bg-[#fffcf8] dark:border-white/10 dark:bg-slate-900/80",
        className,
      )}
      role="group"
      aria-label="Thème d’affichage"
    >
      <button
        type="button"
        onClick={() => applyTheme("dark")}
        aria-pressed={dark}
        aria-label="Mode sombre"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full transition",
          dark
            ? nav
              ? "bg-slate-900/90 text-amber-200"
              : "bg-slate-800 text-amber-200"
            : nav
              ? "text-white/70 hover:bg-white/10"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80",
        )}
      >
        <Moon className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => applyTheme("light")}
        aria-pressed={!dark}
        aria-label="Mode clair"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full transition",
          !dark
            ? nav
              ? "bg-[#faf7f2] text-amber-900 shadow-sm ring-1 ring-[#e8dfd5]/90"
              : "bg-[#faf7f2] text-amber-800 shadow-sm ring-1 ring-[#e8dfd5]/80 dark:bg-[#faf7f2] dark:text-amber-800"
            : nav
              ? "text-white/70 hover:bg-white/10"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80",
        )}
      >
        <Sun className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
