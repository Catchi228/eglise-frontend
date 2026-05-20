"use client";

import { useEffect, useMemo, useState } from "react";
import { BookMarked, Trash2 } from "lucide-react";
import { PageBack } from "@/components/PageBack";

type FavoriteVerse = {
  id: string;
  ref: string; // ex: "Jean 3:16"
  text: string;
  createdAt: string;
};

const FAVORITES_KEY = "eglise.bible.favoris.v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readFavoritesFromStorage(): FavoriteVerse[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<FavoriteVerse[]>(
    window.localStorage.getItem(FAVORITES_KEY),
  );
  return Array.isArray(parsed) ? parsed : [];
}

export default function FavorisPage() {
  const [items, setItems] = useState<FavoriteVerse[]>(readFavoritesFromStorage);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  }, [items]);

  const sorted = useMemo(() => {
    return items
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 text-[#2c2822] shadow-sm backdrop-blur">
        <PageBack href="/mon-espace" label="Mon espace" />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Favoris</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Versets bibliques enregistrés.
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/75 text-[#7a6849]">
            <BookMarked className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        {sorted.length ? (
          <div className="mt-5 space-y-3">
            {sorted.map((v) => (
              <article
                key={v.id}
                className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{v.ref}</div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--foreground)]">
                      {v.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9cfc3]/70 bg-[#fffcf8] text-[var(--muted)] hover:bg-[#ebe4d8]/85 hover:text-[#2c2822]"
                    title="Supprimer"
                    onClick={() =>
                      setItems((prev) => prev.filter((x) => x.id !== v.id))
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 text-xs text-[var(--muted)]">
                  {new Date(v.createdAt).toLocaleString("fr-FR")}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 text-sm text-[var(--muted)] shadow-sm">
            Aucun verset enregistré pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}

