"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BookMarked, ExternalLink, Trash2 } from "lucide-react";
import { PageBack } from "@/components/PageBack";
import {
  getFavoritesSnapshot,
  removeBibleFavorite,
  subscribeFavorites,
  type FavoriteVerse,
} from "@/lib/bibleFavorites";

export default function FavorisPage() {
  const items = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => [] as FavoriteVerse[],
  );

  const sorted = items
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 text-[#2c2822] shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
        <PageBack href="/mon-espace" label="Mon espace" />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Favoris</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Versets bibliques enregistrés depuis la lecture.
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/75 text-accent-icon dark:border-white/10 dark:bg-white/5">
            <BookMarked className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        {sorted.length ? (
          <div className="mt-5 space-y-3">
            {sorted.map((v) => (
              <article
                key={v.id}
                className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{v.ref}</div>
                      {v.bookId && v.chapter > 0 ? (
                        <Link
                          href={`/bible/${v.bookId}/${v.chapter}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline"
                        >
                          Voir le chapitre
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--foreground)]">
                      {v.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9cfc3]/70 bg-[#fffcf8] text-[var(--muted)] hover:bg-[#ebe4d8]/85 hover:text-[#2c2822] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    title="Supprimer"
                    onClick={() => removeBibleFavorite(v.id)}
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
          <div className="mt-5 rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 text-sm text-[var(--muted)] shadow-sm dark:border-white/10 dark:bg-slate-900/40">
            Aucun verset enregistré. Ouvrez un chapitre dans la{" "}
            <Link href="/bible" className="font-medium text-accent-text hover:underline">
              Bible
            </Link>{" "}
            et cliquez sur l’icône favori à côté d’un verset.
          </div>
        )}
      </div>
    </div>
  );
}
