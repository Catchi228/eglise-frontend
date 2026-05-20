"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { PageBack } from "@/components/PageBack";
type UserQuestion = {
  id: string;
  body: string;
  status: string;
  courseId: string | null;
  createdAt: string;
};

export default function MesQuestionsPage() {
  const [items, setItems] = useState<UserQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/questions", { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        setItems((data as { questions: UserQuestion[] }).questions ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 text-[#2c2822] shadow-sm backdrop-blur">
        <PageBack href="/mon-espace" label="Mon espace" />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mes questions</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Questions posées sur les cours et statut des réponses.
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/75 text-[#7a6849]">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-[var(--muted)]">Chargement…</p>
        ) : items.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 text-sm text-[var(--muted)] shadow-sm">
            Aucune question pour le moment.
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {items.map((q) => (
              <li
                key={q.id}
                className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 px-4 py-3 text-sm shadow-sm"
              >
                <div className="font-semibold text-[#2c2822]">Cours {q.courseId ?? "—"} — {q.status}</div>
                <div className="mt-1 text-[var(--muted)]">
                  <span className="block text-[#2c2822]">{q.body}</span>
                  {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
