"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Heart } from "lucide-react";
import { bibleBooks } from "@/lib/mock";

function groupBooks(testament: "Ancien Testament" | "Nouveau Testament") {
  return bibleBooks.filter((b) => b.testament === testament);
}

export default function BiblePage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return bibleBooks;
    return bibleBooks.filter((b) => b.name.toLowerCase().includes(query));
  }, [q]);

  const at = filtered.filter((b) => b.testament === "Ancien Testament");
  const nt = filtered.filter((b) => b.testament === "Nouveau Testament");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="page-title font-semibold tracking-tight text-[#2c2822]">
            Bible
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Parcourez les <span className="font-semibold text-[var(--foreground)]">66 livres</span> de la Bible en{" "}
            <span className="font-semibold text-[var(--foreground)]">Louis Segond 1910</span>.
          </p>
        </div>
        <a
          className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/70 px-4 py-2.5 text-sm font-semibold text-[#2c2822] hover:bg-[#e0d6ca] sm:w-auto"
          href="/connexion"
        >
          <span className="inline-flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#7a6849]" aria-hidden="true" />
            Favoris (0)
          </span>
        </a>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[#2c2822] shadow-sm">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
            placeholder="Rechercher un mot ou une phrase dans la Bible…"
          />
        </div>
      </div>

      <section className="space-y-4">
        <div className="rounded-3xl border border-[#d9cfc3]/75 bg-[#fffcf8]/92 p-5 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-[#2c2822]">Ancien Testament</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {at.length
              ? at.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bible/${b.id}/1`}
                    className="flex items-center justify-between rounded-2xl border border-[#cfc4b6]/80 bg-[#faf7f2]/96 px-4 py-3 text-sm font-medium shadow-sm transition hover:border-[#b8aea2]/85 hover:bg-[#ebe4d8]/80"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/70 text-[#7a6849]">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-[#2c2822]">{b.name}</span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-[var(--muted)]"
                      aria-hidden="true"
                    />
                  </Link>
                ))
              : groupBooks("Ancien Testament").map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/90 px-4 py-3 text-sm text-[var(--muted)] backdrop-blur"
                  >
                    {b.name}
                  </div>
                ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#d9cfc3]/75 bg-[#fffcf8]/92 p-5 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-[#2c2822]">Nouveau Testament</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nt.length
              ? nt.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bible/${b.id}/1`}
                    className="flex items-center justify-between rounded-2xl border border-[#cfc4b6]/80 bg-[#faf7f2]/96 px-4 py-3 text-sm font-medium shadow-sm transition hover:border-[#b8aea2]/85 hover:bg-[#ebe4d8]/80"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/70 text-[#7a6849]">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-[#2c2822]">{b.name}</span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-[var(--muted)]"
                      aria-hidden="true"
                    />
                  </Link>
                ))
              : groupBooks("Nouveau Testament").map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/90 px-4 py-3 text-sm text-[var(--muted)] backdrop-blur"
                  >
                    {b.name}
                  </div>
                ))}
          </div>
        </div>
      </section>
    </div>
  );
}

