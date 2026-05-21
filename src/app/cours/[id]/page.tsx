"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { BookOpen, CalendarDays, Clock3, Download, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { PageBack } from "@/components/PageBack";
import { readCourses, resetPublicContentCache, whenPublicContentReady } from "@/lib/adminData";
import { isCourseAccessible, lessonPdfDownload } from "@/lib/courseAccess";
import type { Course, LessonSection } from "@/lib/types";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "En cours": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    "Terminé":  "bg-[#ebe4d8]/80 text-[#5c4a36] ring-1 ring-[#d4c5b0]/70",
    "À venir":  "bg-slate-50 text-slate-500 ring-1 ring-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-stone-100 text-stone-600"}`}>
      {status}
    </span>
  );
}

/** Rendu d'un paragraphe avec sauts de ligne et listes simples. */
function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-[15px] leading-relaxed text-[#2c2822]">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (/^\d+\.\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ebe4d8]/80 text-xs font-bold text-[#7a6849]">
                {line.match(/^(\d+)/)?.[1]}
              </span>
              <span>{line.replace(/^\d+\.\s/, "")}</span>
            </div>
          );
        }
        if (line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a7762]" />
              <span>{line.replace(/^• /, "")}</span>
            </div>
          );
        }
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

/** Contenu principal de la leçon en mode lecture. */
function LessonReader({ sections, pdfUrl, pdfName }: {
  sections: LessonSection[];
  pdfUrl?: string;
  pdfName?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = sections[activeIdx];

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-5">
      {/* Mobile : sommaire horizontal + PDF */}
      <div className="space-y-3 lg:hidden">
        <div className="scroll-touch-x flex gap-2 pb-1">
          {sections.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 snap-start rounded-full px-3.5 py-2 text-left text-xs font-semibold transition ${
                i === activeIdx
                  ? "bg-slate-900 text-white"
                  : "border border-[#d9cfc3]/80 bg-white/90 text-[#2c2822]"
              }`}
            >
              {s.heading}
            </button>
          ))}
        </div>
        {pdfUrl ? (
          <a
            href={pdfUrl}
            download={pdfName || "cours.pdf"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2.5 text-sm font-semibold text-[#2c2822] transition hover:bg-[#ebe4d8]/80"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            Télécharger le PDF
          </a>
        ) : null}
      </div>

      {/* Desktop : sommaire latéral */}
      <aside className="hidden shrink-0 lg:block">
        <div className="sticky top-[calc(5rem+env(safe-area-inset-top,0px))] overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-white/80 shadow-sm">
          <div className="border-b border-[#e8dfd5]/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b6258]">Sommaire</p>
          </div>
          <nav className="max-h-[min(50vh,420px)] overflow-y-auto p-2">
            {sections.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`mb-0.5 w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  i === activeIdx
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-[#2c2822] hover:bg-[#f3ece4]/80"
                }`}
              >
                {s.heading}
              </button>
            ))}
          </nav>
          {pdfUrl ? (
            <div className="border-t border-[#e8dfd5]/80 p-3">
              <a
                href={pdfUrl}
                download={pdfName || "cours.pdf"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2.5 text-xs font-semibold text-[#2c2822] transition hover:bg-[#ebe4d8]/80"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Télécharger le PDF
              </a>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Contenu */}
      <main className="min-w-0">
        <div className="overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-white/85 shadow-sm">
          <div className="border-b border-[#e8dfd5]/80 bg-gradient-to-r from-[#faf7f2] to-[#f3ece4]/70 px-4 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7762]">
              {activeIdx + 1} / {sections.length}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#1f1c18] sm:text-xl">{active.heading}</h2>
          </div>
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <RichText text={active.body} />
          </div>
          {/* Navigation bas de page */}
          <div className="flex flex-col gap-2 border-t border-[#e8dfd5]/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-4 py-2 text-sm font-semibold text-[#2c2822] transition hover:bg-[#ebe4d8]/70 disabled:opacity-40 sm:w-auto"
            >
              ← Précédent
            </button>
            <span className="text-xs text-[#7a7268]">{activeIdx + 1}/{sections.length}</span>
            <button
              type="button"
              onClick={() => setActiveIdx((i) => Math.min(sections.length - 1, i + 1))}
              disabled={activeIdx === sections.length - 1}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-40 sm:w-auto"
            >
              Suivant →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CoursDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [ready, setReady]   = useState(false);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!id) { setCourse(null); setReady(true); return; }
    // Force un rechargement frais pour avoir le contenu texte (content)
    resetPublicContentCache();
    return whenPublicContentReady(() => {
      setCourse(readCourses().find((x) => x.id === id) ?? null);
      setReady(true);
    });
  }, [id]);

  if (!ready) {
    return (
      <div className="space-y-4">
        <PageBack href="/cours" label="Cours" />
        <div className="flex items-center gap-3 rounded-2xl border border-[#d9cfc3]/70 bg-white/70 p-5 text-sm text-[#5c544a]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c8b89a]/60 border-t-[#7a6849]" />
          Chargement…
        </div>
      </div>
    );
  }

  if (!course) notFound();

  if (!isCourseAccessible(course)) {
    return (
      <div className="space-y-4 text-[#2c2822]">
        <PageBack href="/cours" label="Cours" />
        <div className="overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-white/80 shadow-sm">
          <div className="border-b border-[#e8dfd5]/80 bg-gradient-to-r from-[#faf7f2] to-[#f3ece4] px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={course.status} />
              {course.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#ebe4d8]/70 px-2.5 py-0.5 text-xs font-medium text-[#5c4a36]">
                  <Tag className="h-3 w-3" aria-hidden /> {t}
                </span>
              ))}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{course.title}</h1>
            <p className="mt-2 text-sm text-[#5c544a]">{course.description}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-[#5c544a]">
              Cette leçon n&apos;est pas encore disponible. Elle ouvrira lorsque le programme l&apos;aura atteinte.
            </p>
            <button type="button" onClick={() => router.push("/cours")}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              ← Retour aux cours
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { url: lessonPdfUrl, name: lessonPdfName } = lessonPdfDownload(course);

  return (
    <div className="space-y-5 text-[#2c2822]">
      <PageBack href="/cours" label="Cours" />

      {/* En-tête */}
      <div className="overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-white/80 shadow-sm">
        <div className="border-b border-[#e8dfd5]/80 bg-gradient-to-r from-[#faf7f2] to-[#f3ece4] px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={course.status} />
            {course.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#ebe4d8]/70 px-2.5 py-0.5 text-xs font-medium text-[#5c4a36]">
                <Tag className="h-3 w-3" aria-hidden /> {t}
              </span>
            ))}
          </div>
          <h1 className="page-title mt-3 font-semibold tracking-tight text-[#1f1c18]">
            {course.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5c544a]">{course.description}</p>
        </div>
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-2 text-xs text-[#6b6258] sm:flex-row sm:flex-wrap sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#8a7762]" /> {course.startAt} → {course.endAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#8a7762]" /> {course.time}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href={`/cours/${course.id}/qcm`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 sm:py-2">
              QCM / Quiz
            </Link>
            <Link href={`/cours/${course.id}/questions`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#cfc4b6]/80 bg-[#faf7f2] px-4 py-2.5 text-xs font-semibold text-[#2c2822] hover:bg-[#ebe4d8]/80 sm:py-2">
              Questions
            </Link>
          </div>
        </div>
      </div>

      {/* Contenu texte de la leçon */}
      {course.content && course.content.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#8a7762]" aria-hidden />
            <h2 className="text-base font-semibold text-[#1f1c18]">Contenu de la leçon</h2>
          </div>
          <LessonReader
            sections={course.content}
            pdfUrl={lessonPdfUrl}
            pdfName={lessonPdfName}
          />
        </div>
      ) : (
        /* Fallback : pas encore de contenu texte */
        <div className="rounded-2xl border border-dashed border-[#d4c9bc] bg-[#faf7f2]/60 px-5 py-8 text-center">
          <p className="text-sm font-medium text-[#5c544a]">Contenu en cours de préparation.</p>
          <a
            href={lessonPdfUrl}
            download={lessonPdfName}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#cfc4b6]/80 bg-white px-5 py-2.5 text-sm font-semibold text-[#2c2822] hover:bg-[#ebe4d8]/80"
          >
            <Download className="h-4 w-4" /> Télécharger le PDF
          </a>
        </div>
      )}
    </div>
  );
}
