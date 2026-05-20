"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Radio,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { getSession, signOut, subscribeSession } from "@/lib/session";
import { refreshAdminData } from "@/lib/adminData";
import { usePresenceHeartbeat } from "@/lib/presenceClient";
import { CBT_INSTITUTION } from "@/lib/cbtInstitution";

const nav: ReadonlyArray<{
  href: string;
  label: string;
  icon: (typeof LayoutDashboard);
  exact?: boolean;
}> = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/annonces", label: "Annonces", icon: Megaphone },
  { href: "/admin/cours", label: "Cours", icon: BookOpen },
  { href: "/admin/qcm", label: "QCM", icon: ClipboardList },
  { href: "/admin/messages", label: "Messages", icon: HelpCircle },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/presence", label: "Présence", icon: Radio },
  { href: "/admin/admins", label: "Administrateurs", icon: Shield },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

function cn(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  usePresenceHeartbeat();

  useEffect(() => {
    void refreshAdminData();
  }, []);

  useEffect(() => {
    const sync = () => {
      const s = getSession();
      if (!s || s.role !== "ADMIN") {
        router.replace("/admin/connexion");
        return;
      }
      setEmail(s.email);
    };
    sync();
    const unsub = subscribeSession(sync);
    return () => unsub();
  }, [router]);

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#5c544a]">
        Vérification de la session…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#cfc4b6]/70 bg-[#faf7f2]/95 backdrop-blur-xl lg:flex">
        <div className="border-b border-[#e0d6ca]/90 px-5 py-6">
          <Link href="/admin" className="block font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight text-[#1f1c18]">
            Administration
          </Link>
          <p className="mt-1 text-xs leading-snug text-[#6b6258]">
            {CBT_INSTITUTION.name}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Navigation administration">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[#1f1c18] text-[#faf7f2] shadow-md"
                    : "text-[#3d3830] hover:bg-[#ebe4d8]/90",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#e0d6ca]/90 p-3">
          <Link
            href="/"
            className="mb-2 block rounded-xl px-3 py-2 text-xs font-medium text-[#6b6258] transition hover:bg-[#ebe4d8]/80 hover:text-[#2c2822]"
          >
            ← Retour au portail public
          </Link>
          <button
            type="button"
            onClick={() => signOut("/admin/connexion")}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50/90"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#cfc4b6]/70 bg-[#faf7f2]/90 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <Link href="/admin" className="font-[family-name:var(--font-serif)] text-base font-semibold text-[#1f1c18]">
              Admin
            </Link>
          </div>
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-[#6b6258]">
              Espace sécurisé
            </p>
            <p className="truncate text-sm font-semibold text-[#2c2822]">{email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/messages"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9cfc3]/80 bg-[#fffcf8]/90 text-[#3d3830] shadow-sm transition hover:bg-[#ebe4d8]/80 lg:hidden"
              aria-label="Messages"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="hidden rounded-xl border border-[#d9cfc3]/80 bg-[#fffcf8]/90 px-3 py-2 text-xs font-semibold text-[#3d3830] shadow-sm transition hover:bg-[#ebe4d8]/80 sm:inline-flex"
            >
              Portail
            </Link>
          </div>
        </header>

        <div className="border-b border-[#e0d6ca]/80 bg-[#faf7f2]/80 lg:hidden">
          <nav className="scroll-touch-x flex gap-1 px-2 py-2" aria-label="Navigation administration mobile">
            {nav.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                    active ? "bg-[#1f1c18] text-[#faf7f2]" : "bg-[#ebe4d8]/70 text-[#3d3830]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label.split(" ")[0]}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 px-3 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:px-4 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
