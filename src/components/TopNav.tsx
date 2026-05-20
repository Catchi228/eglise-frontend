"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Church, LogOut, Menu, Settings, UserRound, X } from "lucide-react";
import { getSiteLogo } from "@/lib/siteLogo";
import { getSession, signOut, subscribeSession } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CBT_INSTITUTION } from "@/lib/cbtInstitution";

type NavItem = { href: string; label: string };

const navItems: NavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/annonces", label: "Annonces" },
  { href: "/cours", label: "Cours" },
  { href: "/bible", label: "Bible" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function TopNav() {
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getSiteLogo(),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const accountWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setLogoUrl(getSiteLogo());
    window.addEventListener("eglise:logo", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("eglise:logo", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const syncSession = () => setSession(getSession());
    syncSession();
    const unsub = subscribeSession(syncSession);
    return () => unsub();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!accountWrapRef.current?.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [accountOpen]);

  const hidden = pathname
    ? pathname === "/admin" || pathname.startsWith("/admin/")
    : false;

  const monEspaceActive =
    pathname === "/mon-espace" || pathname.startsWith("/mon-espace");

  const activeHref = useMemo(() => {
    if (!pathname) return null;
    const found = navItems.find((i) =>
      pathname === i.href ? true : pathname.startsWith(i.href + "/"),
    );
    return found?.href ?? null;
  }, [pathname]);

  if (hidden) return null;

  const avatarLetter = session?.email?.trim()?.[0]?.toUpperCase() ?? null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#b8aea2]/80 bg-[#d8cfc4]/72 pt-[env(safe-area-inset-top,0px)] shadow-[0_6px_28px_-6px_rgba(44,40,34,0.2)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#d8cfc4]/62 dark:border-white/10 dark:bg-slate-950/45 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45)] dark:supports-[backdrop-filter]:bg-slate-950/35">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#cfc4b6]/90 bg-[#fffcf8] text-sm font-semibold text-[#2c2822] shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white dark:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL depuis localStorage
              <img
                src={logoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Church className="h-4 w-4" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-[family-name:var(--font-serif)] text-sm font-semibold tracking-tight text-[#2c2822] sm:text-base dark:text-white">
              <span className="sm:hidden">CBT Togo</span>
              <span className="hidden sm:inline">{CBT_INSTITUTION.name}</span>
            </div>
            <div className="hidden truncate font-[family-name:var(--font-inter)] text-xs text-[#5c544a] sm:block dark:text-white/60">
              {CBT_INSTITUTION.headquarters} · {CBT_INSTITUTION.acronym}
            </div>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-1.5 md:flex"
          aria-label="Navigation principale"
        >
          {navItems.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium tracking-tight transition",
                  active
                    ? "bg-slate-900 text-white shadow-md dark:bg-white/95 dark:text-slate-900 dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]"
                    : "text-slate-700 hover:bg-slate-100 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle variant="nav" className="flex" />

          <div ref={accountWrapRef} className="relative">
            <button
              type="button"
              aria-expanded={accountOpen}
              aria-haspopup="true"
              aria-controls="account-menu"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition",
                monEspaceActive && session
                  ? "border-amber-500/50 bg-amber-100 text-amber-950 shadow-[0_0_0_1px_rgba(245,158,11,0.35)] dark:border-amber-400/50 dark:bg-amber-500/25 dark:text-white dark:shadow-[0_0_0_1px_rgba(251,191,36,0.25)]"
                  : "border-[#cfc4b6]/90 bg-[#fffcf8] text-[#2c2822] hover:border-[#b8aea2] hover:bg-[#ebe4d8]/95 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:border-white/35 dark:hover:bg-white/15",
              )}
              onClick={() => setAccountOpen((o) => !o)}
              aria-label="Menu compte"
            >
              {avatarLetter ? (
                <span className="font-[family-name:var(--font-inter)] text-sm font-semibold">
                  {avatarLetter}
                </span>
              ) : (
                <UserRound className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} aria-hidden />
              )}
            </button>

            {accountOpen ? (
              <div
                id="account-menu"
                role="menu"
                className="absolute right-0 top-full z-[60] mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#d9cfc3] bg-[#fffcf8] py-2 shadow-xl dark:border-white/10 dark:bg-slate-950/95 dark:shadow-[0_28px_90px_-24px_rgba(0,0,0,0.75)] dark:backdrop-blur-2xl"
              >
                {session ? (
                  <>
                    <div className="border-b border-[#e8dfd5]/90 px-4 py-3 dark:border-white/10">
                      <p className="font-[family-name:var(--font-inter)] text-xs font-medium uppercase tracking-wider text-[#6b6258] dark:text-white/50">
                        Connecté
                      </p>
                      <p className="mt-1 truncate font-[family-name:var(--font-inter)] text-sm text-[#2c2822] dark:text-white/95">
                        {session.email}
                      </p>
                    </div>
                    <Link
                      href="/mon-espace"
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#3d3830] transition hover:bg-[#ebe4d8]/80 dark:text-white/90 dark:hover:bg-white/10"
                      onClick={() => setAccountOpen(false)}
                    >
                      <UserRound className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      Mon espace
                    </Link>
                    <div className="mx-4 my-2 border-t border-[#e8dfd5]/90 dark:border-white/10" />
                    <p className="px-4 pb-1 font-[family-name:var(--font-inter)] text-[10px] font-semibold uppercase tracking-wider text-[#8a8177] dark:text-white/45">
                      Compte
                    </p>
                    <Link
                      href="/parametres"
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#3d3830] transition hover:bg-[#ebe4d8]/80 dark:text-white/90 dark:hover:bg-white/10"
                      onClick={() => setAccountOpen(false)}
                    >
                      <Settings className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      Paramètres
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-3 border-t border-[#e8dfd5]/90 px-4 py-3 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50/90 dark:border-white/10 dark:text-rose-200/95 dark:hover:bg-rose-500/15"
                      onClick={() => {
                        setAccountOpen(false);
                        signOut();
                      }}
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link
                    href="/connexion"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#2c2822] transition hover:bg-[#ebe4d8]/80 dark:text-white dark:hover:bg-white/10"
                    onClick={() => setAccountOpen(false)}
                  >
                    <UserRound className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    Se connecter
                  </Link>
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#cfc4b6]/90 bg-[#fffcf8] text-[#2c2822] shadow-sm transition hover:bg-[#ebe4d8]/95 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-[#b8aea2]/80 bg-[#d8cfc4]/78 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out dark:border-white/10 dark:bg-slate-950/80 md:hidden",
          menuOpen ? "max-h-[480px] opacity-100" : "max-h-0 overflow-hidden opacity-0",
        )}
      >
        <nav
          className="flex flex-col gap-1 px-4 py-4"
          aria-label="Navigation mobile"
        >
          <div className="mb-2 flex justify-center sm:hidden">
            <ThemeToggle variant="nav" />
          </div>
          {navItems.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3.5 text-sm font-semibold tracking-tight transition",
                  active
                    ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                    : "text-[#2c2822] hover:bg-[#ebe4d8]/90 dark:text-white/90 dark:hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
