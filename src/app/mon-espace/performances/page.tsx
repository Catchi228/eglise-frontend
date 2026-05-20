"use client";

import { useEffect, useState } from "react";
import { ChartColumn } from "lucide-react";
import { PageBack } from "@/components/PageBack";
import type { QcmAttempt } from "@/lib/types";

export default function PerformancesPage() {
  const [attempts, setAttempts] = useState<QcmAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/performances", { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        setAttempts((data as { attempts: QcmAttempt[] }).attempts ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 text-[#2c2822] shadow-sm backdrop-blur">
        <PageBack href="/mon-espace" label="Mon espace" />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mes performances</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Résultats QCM enregistrés sur votre compte.
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/75 text-[#7a6849]">
            <ChartColumn className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-[var(--muted)]">Chargement…</p>
        ) : attempts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 text-sm text-[var(--muted)] shadow-sm">
            Aucune donnée pour le moment. Les résultats apparaîtront ici après vos QCM.
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {attempts.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 px-4 py-3 text-sm shadow-sm"
              >
                <div className="font-semibold text-[#2c2822]">{a.qcmTitle}</div>
                <div className="mt-1 text-[var(--muted)]">
                  {a.score}/{a.total} bonnes réponses —{" "}
                  {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
