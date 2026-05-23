"use client";

import Link from "next/link";
import { CalendarDays, Clock3, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { readCourses, whenPublicContentReady } from "@/lib/adminData";
import { compareCoursesForDisplay, isCourseAccessible } from "@/lib/courseAccess";
import { useSession } from "@/lib/useSession";
import type { Course } from "@/lib/types";

function parseFRDate(d: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

function isWithinWeeksFromNow(endAt: string, weeks: number) {
  const end = parseFRDate(endAt);
  if (!end) return true;
  return Date.now() - end.getTime() <= weeks * 7 * 24 * 60 * 60 * 1000;
}

function badgeClass(label: string) {
  if (label === "En cours") return "bg-emerald-50 text-emerald-700";
  if (label === "À venir")  return "bg-[#ebe4d8]/90 text-[#5c4a36]";
  return "bg-[#ebe4d8]/80 text-[#5c4a36]";
}

function CourseCard({ c }: { c: Course }) {
  const accessible = isCourseAccessible(c);
  return (
    <article className="rounded-3xl border border-[#d9cfc3]/70 bg-white/70 p-4 text-[#2c2822] shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(c.status)}`}>
          {c.status}
        </span>
        {c.tags.map((t) => (
          <span key={t} className="rounded-full bg-[#ebe4d8]/75 px-3 py-1 text-xs font-semibold text-[#5c4a36]">
            {t}
          </span>
        ))}
      </div>

      <h3 className="mt-3 text-base font-semibold">{c.title}</h3>
      <p className="mt-1 text-sm text-[#5c544a]">{c.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#5c544a]">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d9cfc3]/70 bg-white/85 px-3 py-2 text-[#5c544a]">
          <CalendarDays className="h-4 w-4 text-accent-icon" aria-hidden="true" />
          {c.startAt} - {c.endAt}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d9cfc3]/70 bg-white/85 px-3 py-2 text-[#5c544a]">
          <Clock3 className="h-4 w-4 text-accent-icon" aria-hidden="true" />
          {c.time}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d9cfc3]/70 bg-white/85 px-3 py-2 text-[#5c544a]">
          <FileText className="h-4 w-4 shrink-0 text-accent-icon" aria-hidden="true" />
          {(c.pdfFiles?.length ?? 0) > 0
            ? `${c.pdfFiles?.length} PDF`
            : `${c.sections.length} fichier${c.sections.length > 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {accessible ? (
          <>
            <Link
              href={`/cours/${c.id}`}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Accéder au cours
            </Link>
            <Link
              href={`/cours/${c.id}/qcm`}
              className="inline-flex items-center justify-center rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-[#2c2822] hover:bg-[#ebe4d8]/80"
            >
              QCM / Quiz
            </Link>
          </>
        ) : (
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full border border-[#d9cfc3]/70 bg-[#faf7f2] px-4 py-2 text-sm font-semibold text-[#6b6258] opacity-90"
            title="Ce cours n'est pas encore disponible."
          >
            Bientôt disponible
          </button>
        )}
      </div>
    </article>
  );
}

export default function CoursPage() {
  const [tick, setTick]               = useState(0);
  const [contentReady, setContentReady] = useState(false);
  const { session, ready: sessionReady } = useSession();

  useEffect(() => {
    const cancel = whenPublicContentReady(() => setContentReady(true));
    return cancel;
  }, []);

  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("storage", on);
    window.addEventListener("eglise:admin-data", on);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("eglise:admin-data", on);
    };
  }, []);

  const mockCourses = useMemo(() => readCourses(), [tick]);

  const previous = mockCourses
    .filter((c) => c.status === "Terminé" && isWithinWeeksFromNow(c.endAt, 52))
    .sort(compareCoursesForDisplay);
  const current = mockCourses
    .filter((c) => c.status === "En cours")
    .sort(compareCoursesForDisplay);
  const upcoming = mockCourses
    .filter((c) => c.status === "À venir")
    .sort(compareCoursesForDisplay);

  return (
    <div className="space-y-6 text-[#2c2822]">
      {!contentReady ? (
        <div
          className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
          role="status"
          aria-live="polite"
        >
          Chargement des cours… (délai max. 5 s)
        </div>
      ) : null}

      <div>
        <h1 className="page-title font-semibold tracking-tight text-[#2c2822]">Cours & documents</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#5c544a]">
          Chaque cours regroupe des <span className="font-semibold">fichiers</span>{" "}
          (PDF, textes…) à consulter ou télécharger. Les cours{" "}
          <span className="font-semibold">à venir</span> sont listés mais verrouillés.
          Les cours <span className="font-semibold">en cours</span> et{" "}
          <span className="font-semibold">récents</span> sont accessibles, avec un{" "}
          <span className="font-semibold">QCM / quiz</span> pour s&apos;auto-évaluer.
        </p>
      </div>

      {sessionReady && !session ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <Link href="/connexion?next=/cours" className="font-semibold underline">
            Connectez-vous
          </Link>{" "}
          pour accéder aux cours et télécharger le contenu.
        </div>
      ) : null}

      {session ? (
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Cours précédents */}
        <div className="rounded-3xl border border-[#d9cfc3]/70 bg-white/60 p-4 text-[#2c2822] shadow-sm backdrop-blur">
          <div className="mb-3">
            <h2 className="text-lg font-semibold tracking-tight">Cours précédents</h2>
            <p className="mt-1 text-sm text-[#5c544a]">Terminés (jusqu&apos;à 52 semaines)</p>
          </div>
          {previous.length ? (
            <div className="space-y-3 md:max-h-[70vh] md:overflow-y-auto md:pr-1">
              {previous.map((c) => <CourseCard key={c.id} c={c} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 text-sm text-[#5c544a]">
              Aucun cours terminé.
            </div>
          )}
        </div>

        {/* Cours en cours */}
        <div className="rounded-3xl border border-[#d9cfc3]/70 bg-white/60 p-4 text-[#2c2822] shadow-sm backdrop-blur">
          <div className="mb-3">
            <h2 className="text-lg font-semibold tracking-tight">Cours en cours</h2>
            <p className="mt-1 text-sm text-[#5c544a]">Disponibles</p>
          </div>
          {current.length ? (
            <div className="space-y-3 md:max-h-[70vh] md:overflow-y-auto md:pr-1">
              {current.map((c) => <CourseCard key={c.id} c={c} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 text-sm text-[#5c544a]">
              Aucun cours en cours.
            </div>
          )}
        </div>

        {/* Cours prochains */}
        <div className="rounded-3xl border border-[#d9cfc3]/70 bg-white/60 p-4 text-[#2c2822] shadow-sm backdrop-blur">
          <div className="mb-3">
            <h2 className="text-lg font-semibold tracking-tight">Cours prochains</h2>
            <p className="mt-1 text-sm text-[#5c544a]">À venir</p>
          </div>
          {upcoming.length ? (
            <div className="space-y-3 md:max-h-[70vh] md:overflow-y-auto md:pr-1">
              {upcoming.map((c) => <CourseCard key={c.id} c={c} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 text-sm text-[#5c544a]">
              Aucun cours à venir.
            </div>
          )}
        </div>
      </section>
      ) : null}
    </div>
  );
}
