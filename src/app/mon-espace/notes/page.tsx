"use client";

import { useEffect, useMemo, useState } from "react";
import { NotebookPen, Trash2 } from "lucide-react";
import { PageBack } from "@/components/PageBack";

type Note = {
  id: string;
  body: string;
  createdAt: string;
};

const NOTES_KEY = "eglise.notes.v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readNotesFromStorage(): Note[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<Note[]>(window.localStorage.getItem(NOTES_KEY));
  return Array.isArray(parsed) ? parsed : [];
}

export default function MesNotesPage() {
  const [notes, setNotes] = useState<Note[]>(readNotesFromStorage);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  const sortedNotes = useMemo(() => {
    return notes
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [notes]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 text-[#2c2822] shadow-sm backdrop-blur">
        <PageBack href="/mon-espace" label="Mon espace" />
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mes notes</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Écrivez une note et retrouvez l’historique.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d9cfc3]/70 bg-[#faf7f2]/95 px-3 py-2 text-xs font-semibold text-[#5c4a36]">
            <NotebookPen className="h-4 w-4 text-accent-icon" aria-hidden="true" />
            {notes.length} note(s)
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[120px] w-full resize-y rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
            placeholder="Écris ici…"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {error ? (
              <div className="text-sm font-medium text-red-600">{error}</div>
            ) : (
              <div className="text-xs text-[var(--muted)]">
                Sauvegardé automatiquement sur cet appareil.
              </div>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-slate-900 hover:text-white"
              onClick={() => {
                const body = draft.trim();
                if (!body) {
                  setError("Écris une note avant d’enregistrer.");
                  return;
                }
                setError(null);
                setDraft("");
                setNotes((prev) => [
                  {
                    id: crypto.randomUUID(),
                    body,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ]);
              }}
            >
              Enregistrer
            </button>
          </div>
        </div>

        {sortedNotes.length ? (
          <div className="mt-5 space-y-3">
            {sortedNotes.map((n) => (
              <article
                key={n.id}
                className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">
                    {n.body}
                  </p>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9cfc3]/70 bg-[#fffcf8] text-[var(--muted)] hover:bg-[#ebe4d8]/85 hover:text-[#2c2822]"
                    title="Supprimer"
                    onClick={() =>
                      setNotes((prev) => prev.filter((x) => x.id !== n.id))
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 text-xs text-[var(--muted)]">
                  {new Date(n.createdAt).toLocaleString("fr-FR")}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/90 p-4 text-sm text-[var(--muted)]">
            Aucune note pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}

