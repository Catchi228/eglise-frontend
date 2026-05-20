"use client";

import { useEffect, useState } from "react";

type StatsPayload = {
  activeWindowMs?: number;
  counts: { total: number; USER: number; ADMIN: number };
  recent: Array<{ email: string; role: "USER" | "ADMIN"; lastSeen: number }>;
};

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

export default function AdminPresencePage() {
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as StatsPayload;
        if (mounted) setStats(j);
      } catch {
        /* ignore */
      }
    }
    void load();
    const t = window.setInterval(() => void load(), 8000);
    return () => {
      mounted = false;
      window.clearInterval(t);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#1f1c18]">
          Présence en temps réel
        </h1>
        <p className="mt-1 text-sm text-[#5c544a]">
          Sessions actives via heartbeat (fenêtre ~2 minutes). Actualisation automatique.
        </p>
      </div>

      {stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#cfc4b6]/60 bg-[#faf7f2]/98 p-4 text-center">
              <div className="text-xs font-semibold uppercase text-[#6b6258]">Total</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-[#1f1c18]">
                {stats.counts.total}
              </div>
            </div>
            <div className="rounded-xl border border-[#cfc4b6]/60 bg-[#faf7f2]/98 p-4 text-center">
              <div className="text-xs font-semibold uppercase text-[#6b6258]">Membres</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-[#1f1c18]">
                {stats.counts.USER}
              </div>
            </div>
            <div className="rounded-xl border border-[#cfc4b6]/60 bg-[#faf7f2]/98 p-4 text-center">
              <div className="text-xs font-semibold uppercase text-[#6b6258]">Admins</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-[#1f1c18]">
                {stats.counts.ADMIN}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 shadow-sm">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b border-[#e0d6ca]/90 bg-[#f3ece4]/90 text-xs font-semibold uppercase tracking-wide text-[#6b6258]">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe4d8]/90">
                {stats.recent.map((row) => (
                  <tr key={`${row.email}-${row.lastSeen}`} className="bg-[#faf7f2]/90">
                    <td className="max-w-[240px] truncate px-4 py-2.5 font-medium text-[#2c2822]">
                      {row.email}
                    </td>
                    <td className="px-4 py-2.5 text-[#5c544a]">
                      {row.role === "ADMIN" ? "Admin" : "Utilisateur"}
                    </td>
                    <td className="px-4 py-2.5 text-[#6b6258]">{formatRelativeFr(row.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#6b6258]">
                Aucune session active. Ouvrez le portail dans un autre onglet pour simuler.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-sm text-[#6b6258]">Chargement…</p>
      )}
    </div>
  );
}
