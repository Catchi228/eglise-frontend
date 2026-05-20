"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  HelpCircle,
  Megaphone,
  Radio,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { Session } from "@/lib/session";
import { getSession, subscribeSession } from "@/lib/session";
import {
  readActivity,
  readAnnouncements,
  readCourses,
  readMessages,
  readNotifications,
  markNotificationRead,
  refreshAdminData,
} from "@/lib/adminData";

type StatsPayload = {
  activeWindowMs?: number;
  counts: { total: number; USER: number; ADMIN: number };
  recent: Array<{ email: string; role: "USER" | "ADMIN"; lastSeen: number }>;
};

const REQUESTS_KEY = "eglise.announcementRequests.v1";

type StoredRequest = {
  title: string;
  category: string;
  city: string;
  createdAt: string;
};

const panel =
  "rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-5 shadow-sm ring-1 ring-stone-900/[0.04]";
const kpi =
  "rounded-xl border border-[#cfc4b6]/55 bg-[#faf7f2]/98 p-4 shadow-sm";

function formatRelativeFr(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return "à l’instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Date(ts).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const quick = [
  { href: "/admin/annonces", label: "Annonces", desc: "Publier, modifier, retirer", icon: Megaphone },
  { href: "/admin/cours", label: "Cours", desc: "Statuts et visibilité", icon: BookOpen },
  { href: "/admin/qcm", label: "QCM", desc: "Quiz liés aux cours", icon: ClipboardList },
  { href: "/admin/messages", label: "Messages", desc: "Questions des membres", icon: HelpCircle },
  { href: "/admin/utilisateurs", label: "Utilisateurs", desc: "Comptes en base", icon: Users },
  { href: "/admin/presence", label: "Présence", desc: "Temps réel", icon: Radio },
  { href: "/admin/admins", label: "Admins", desc: "Rôles et accès", icon: Shield },
  { href: "/admin/parametres", label: "Paramètres", desc: "Logo du portail", icon: Settings },
] as const;

export function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [requests, setRequests] = useState<StoredRequest[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    void refreshAdminData().then(() => setTick((t) => t + 1));
  }, []);

  const announcements = useMemo(() => readAnnouncements(), [tick]);
  const courses = useMemo(() => readCourses(), [tick]);
  const activity = useMemo(() => readActivity().slice(0, 8), [tick]);
  const notifs = useMemo(() => readNotifications().slice(0, 5), [tick]);
  const messages = useMemo(() => readMessages().filter((m) => m.status === "nouveau"), [tick]);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    const unsub = subscribeSession(sync);
    return () => unsub();
  }, []);

  const loadRequests = useCallback(() => {
    try {
      const raw = localStorage.getItem(REQUESTS_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setRequests(Array.isArray(parsed) ? (parsed as StoredRequest[]) : []);
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    const on = () => {
      loadRequests();
      setTick((t) => t + 1);
    };
    window.addEventListener("storage", on);
    window.addEventListener("eglise:admin-data", on);
    window.addEventListener("focus", loadRequests);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("eglise:admin-data", on);
      window.removeEventListener("focus", loadRequests);
    };
  }, [loadRequests]);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as StatsPayload;
        if (mounted) setStats(json);
      } catch {
        /* ignore */
      }
    }
    void refresh();
    const t = window.setInterval(() => void refresh(), 10_000);
    return () => {
      mounted = false;
      window.clearInterval(t);
    };
  }, []);

  const publishedCount = announcements.filter((a) => a.status === "Publiée").length;
  const coursesLive = courses.filter((c) => c.status === "En cours" || c.status === "À venir").length;
  const recentAnn = [...announcements]
    .sort((a, b) => (b.startAt ?? "").localeCompare(a.startAt ?? ""))
    .slice(0, 4);

  if (!session) return null;

  return (
    <div className="space-y-6">
      <header className={panel}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6258]">
          Vue d’ensemble
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight text-[#1f1c18] sm:text-3xl">
          Tableau de bord
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5c544a]">
          Pilotage du portail : statistiques, activité récente et raccourcis vers les
          modules. Les données sensibles resteront côté API en production.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={kpi}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6b6258]">En ligne</span>
            <Activity className="h-4 w-4 text-amber-800" aria-hidden />
          </div>
          <p className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold tabular-nums text-[#1f1c18]">
            {stats ? stats.counts.total : "—"}
          </p>
          <p className="mt-1 text-xs text-[#7a7268]">Sessions actives (~2 min)</p>
        </div>
        <div className={kpi}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6b6258]">Demandes</span>
            <Megaphone className="h-4 w-4 text-amber-800" aria-hidden />
          </div>
          <p className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold tabular-nums text-[#1f1c18]">
            {requests.length}
          </p>
          <p className="mt-1 text-xs text-[#7a7268]">Soumissions formulaire</p>
        </div>
        <div className={kpi}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6b6258]">Annonces</span>
            <BarChart3 className="h-4 w-4 text-amber-800" aria-hidden />
          </div>
          <p className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold tabular-nums text-[#1f1c18]">
            {publishedCount}
          </p>
          <p className="mt-1 text-xs text-[#7a7268]">Publiées</p>
        </div>
        <div className={kpi}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6b6258]">Cours</span>
            <BookOpen className="h-4 w-4 text-amber-800" aria-hidden />
          </div>
          <p className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold tabular-nums text-[#1f1c18]">
            {coursesLive}
          </p>
          <p className="mt-1 text-xs text-[#7a7268]">Actifs ou à venir</p>
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#1f1c18]">
          Accès rapide
        </h2>
        <p className="mt-1 text-sm text-[#5c544a]">Actions et modules principaux.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quick.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-xl border border-[#d4c9bc]/65 bg-[#faf7f2]/95 p-4 shadow-sm transition hover:border-amber-400/45 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#cfc4b6]/70 bg-[#ebe4d8]/70 text-[#5c4a36]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#a89e92] transition group-hover:text-amber-900" />
              </div>
              <span className="mt-3 text-sm font-semibold text-[#2c2822]">{label}</span>
              <span className="mt-1 text-xs text-[#6b6258]">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panel}>
          <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#1f1c18]">
            Notifications
          </h2>
          {notifs.length === 0 ? (
            <p className="mt-4 text-sm text-[#6b6258]">Aucune notification récente.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {notifs.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                    n.read ? "border-[#e8dfd5]/90 bg-[#faf7f2]/80 text-[#6b6258]" : "border-amber-200/80 bg-amber-50/80 text-[#2c2822]"
                  }`}
                >
                  <span>{n.text}</span>
                  {!n.read ? (
                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold text-amber-900 underline-offset-2 hover:underline"
                      onClick={() => {
                        void markNotificationRead(n.id).then(() => setTick((t) => t + 1));
                      }}
                    >
                      Lu
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {messages.length ? (
            <p className="mt-4 text-xs text-[#6b6258]">
              {messages.length} message(s) à traiter —{" "}
              <Link href="/admin/messages" className="font-semibold text-amber-900 hover:underline">
                ouvrir la boîte
              </Link>
            </p>
          ) : null}
        </section>

        <section className={panel}>
          <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#1f1c18]">
            Activité récente
          </h2>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-[#6b6258]">Aucune action enregistrée pour l’instant.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#e8dfd5]/90 bg-[#faf7f2]/90 px-3 py-2 text-sm text-[#2c2822]"
                >
                  <span>{a.label}</span>
                  <span className="shrink-0 text-xs text-[#6b6258]">{formatRelativeFr(a.ts)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panel}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#1f1c18]">
              Annonces récentes
            </h2>
            <Link href="/admin/annonces" className="text-xs font-semibold text-amber-900 hover:underline">
              Gérer
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-[#ebe4d8]/90">
            {recentAnn.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="truncate font-medium text-[#2c2822]">{a.title}</span>
                <span className="shrink-0 rounded-full bg-[#ebe4d8]/90 px-2 py-0.5 text-xs text-[#5c544a]">
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={panel}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#1f1c18]">
              Présence
            </h2>
            <Link href="/admin/presence" className="text-xs font-semibold text-amber-900 hover:underline">
              Détails
            </Link>
          </div>
          {stats ? (
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-[#e0d6ca]/80 bg-[#f3ece4]/60 p-3 text-center text-sm">
              <div>
                <div className="text-xs text-[#6b6258]">Total</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{stats.counts.total}</div>
              </div>
              <div>
                <div className="text-xs text-[#6b6258]">Membres</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{stats.counts.USER}</div>
              </div>
              <div>
                <div className="text-xs text-[#6b6258]">Admins</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{stats.counts.ADMIN}</div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#6b6258]">Chargement…</p>
          )}
          <p className="mt-3 text-xs text-[#6b6258]">
            Aperçu des sessions actives. Liste complète sur la page Présence.
          </p>
        </section>
      </div>
    </div>
  );
}
