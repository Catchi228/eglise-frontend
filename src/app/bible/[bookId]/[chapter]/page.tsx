import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageBack } from "@/components/PageBack";
import { bibleBooks } from "@/lib/mock";
import { loadBibleChapter, bibleChapterFileExists } from "@/lib/bibleChapter";
import { fetchRemoteBibleChapter } from "@/lib/bibleRemote";

async function chapterExists(bookId: string, chapter: number): Promise<boolean> {
  if (chapter < 1) return false;
  if (await bibleChapterFileExists(bookId, chapter)) return true;
  return (await fetchRemoteBibleChapter(bookId, chapter)) !== null;
}

type Props = {
  params: Promise<{ bookId: string; chapter: string }>;
};

export default async function BibleChapterPage({ params }: Props) {
  const { bookId, chapter: chapterStr } = await params;
  const chapterNum = Number(chapterStr);
  const meta = bibleBooks.find((b) => b.id === bookId);

  if (!Number.isFinite(chapterNum) || chapterNum < 1) {
    return (
      <div className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 shadow-sm backdrop-blur">
        <p className="text-sm text-[var(--muted)]">Chapitre invalide.</p>
        <div className="mt-4">
          <PageBack href="/bible" label="Retour à la Bible" />
        </div>
      </div>
    );
  }

  const data = await loadBibleChapter(bookId, chapterNum);

  const prevNum = chapterNum - 1;
  const nextNum = chapterNum + 1;
  const hasPrev = prevNum >= 1 && (await chapterExists(bookId, prevNum));
  const hasNext = await chapterExists(bookId, nextNum);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageBack href="/bible" label="Livres" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#2c2822]">
            {meta?.name ?? data?.bookName ?? bookId} — chapitre {chapterNum}
          </h1>
        </div>
      </div>

      {(hasPrev || hasNext) && (
        <div className="flex flex-wrap gap-2">
          {hasPrev ? (
            <Link
              href={`/bible/${bookId}/${prevNum}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-[#ebe4d8]/80"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Chapitre {prevNum}
            </Link>
          ) : null}
          {hasNext ? (
            <Link
              href={`/bible/${bookId}/${nextNum}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-[#ebe4d8]/80"
            >
              Chapitre {nextNum}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      )}

      {!data ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-900 shadow-sm backdrop-blur">
          <p className="font-semibold">Ce chapitre n’est pas disponible.</p>
          <p className="mt-2 text-amber-800/90">
            Le chapitre n’a pas pu être chargé (connexion internet ou service temporairement indisponible).
            Veuillez réessayer dans quelques instants.
          </p>
        </div>
      ) : (
        <article className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 text-[#2c2822] shadow-sm backdrop-blur">
          <div className="divide-y divide-[#e0d6ca]/70">
            {data.verses
              .slice()
              .sort((a, b) => a.n - b.n)
              .map((v) => (
                <p
                  key={v.n}
                  className="py-3 text-[15px] leading-relaxed text-[var(--foreground)]"
                >
                  <sup className="mr-2 inline-flex min-w-7 items-center justify-center rounded-full border border-[#cfc4b6]/80 bg-[#ebe4d8]/70 px-2 py-0.5 text-xs font-semibold text-[#2c2822]">
                    {v.n}
                  </sup>
                  <span className="text-[#1f1c18]">{v.t}</span>
                </p>
              ))}
          </div>
        </article>
      )}
    </div>
  );
}
