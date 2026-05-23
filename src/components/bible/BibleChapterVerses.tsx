"use client";

import { useSyncExternalStore } from "react";
import { Bookmark } from "lucide-react";
import {
  getFavoritesSnapshot,
  isVerseFavorite,
  subscribeFavorites,
  toggleBibleFavorite,
} from "@/lib/bibleFavorites";

type Verse = { n: number; t: string };

type Props = {
  bookId: string;
  bookName: string;
  chapter: number;
  verses: Verse[];
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function BibleChapterVerses({ bookId, bookName, chapter, verses }: Props) {
  useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, () => []);

  const sorted = verses.slice().sort((a, b) => a.n - b.n);

  return (
    <article className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 text-[#2c2822] shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
      <div className="divide-y divide-[#e0d6ca]/70 dark:divide-white/10">
        {sorted.map((v) => {
          const favorited = isVerseFavorite(bookId, chapter, v.n);
          return (
            <div
              key={v.n}
              className="group flex items-start gap-2 py-3"
            >
              <p className="min-w-0 flex-1 text-[15px] leading-relaxed text-[var(--foreground)]">
                <sup className="mr-2 inline-flex min-w-7 items-center justify-center rounded-full border border-[#cfc4b6]/80 bg-[#ebe4d8]/70 px-2 py-0.5 text-xs font-semibold text-[#2c2822] dark:border-white/15 dark:bg-white/10 dark:text-white">
                  {v.n}
                </sup>
                <span className="text-[#1f1c18] dark:text-slate-100">{v.t}</span>
              </p>
              <button
                type="button"
                aria-label={
                  favorited
                    ? `Retirer ${bookName} ${chapter}:${v.n} des favoris`
                    : `Ajouter ${bookName} ${chapter}:${v.n} aux favoris`
                }
                aria-pressed={favorited}
                title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={cn(
                  "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition",
                  favorited
                    ? "border-amber-300/80 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200"
                    : "border-[#d9cfc3]/70 bg-[#fffcf8] text-[var(--muted)] opacity-70 hover:border-amber-300/60 hover:bg-amber-50/80 hover:text-amber-700 group-hover:opacity-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-amber-500/10 dark:hover:text-amber-200",
                )}
                onClick={() =>
                  toggleBibleFavorite({
                    bookId,
                    bookName,
                    chapter,
                    verse: v.n,
                    text: v.t,
                  })
                }
              >
                <Bookmark
                  className={cn("h-4 w-4", favorited && "fill-current")}
                  aria-hidden
                />
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
