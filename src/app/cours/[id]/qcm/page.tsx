"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, RefreshCw, XCircle } from "lucide-react";
import { PageBack } from "@/components/PageBack";
import { readCourses, whenPublicContentReady } from "@/lib/adminData";
import { isCourseAccessible } from "@/lib/courseAccess";
import type { Course } from "@/lib/types";

type QcmQuestion = { id: number; prompt: string; choices: string[] };
type QcmData     = { id: string; title: string; questions: QcmQuestion[] };
type Result      = { score: number; total: number; percent: number; correctIndices: number[] };

export default function QcmPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [ready, setReady]         = useState(false);
  const [course, setCourse]       = useState<Course | null>(null);
  const [qcm, setQcm]             = useState<QcmData | null>(null);
  const [answers, setAnswers]     = useState<Record<number, number>>({});
  const [result, setResult]       = useState<Result | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loadingQcm, setLoadingQcm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) { setCourse(null); setReady(true); return; }
    return whenPublicContentReady(() => {
      setCourse(readCourses().find((c) => c.id === id) ?? null);
      setReady(true);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !ready || !course) return;
    setLoadingQcm(true); setError(null);
    fetch(`/api/qcm/play/${id}`, { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((data as { error?: string }).error ?? "QCM indisponible");
        setQcm((data as { qcm: QcmData }).qcm);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingQcm(false));
  }, [id, ready, course]);

  async function submit() {
    if (!qcm) return;
    setError(null);
    const ordered = qcm.questions.map((q) => answers[q.id] ?? -1);
    if (ordered.some((a) => a < 0)) {
      setError("Répondez à toutes les questions avant d'envoyer.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/qcm/submit", {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qcmId: qcm.id, answers: ordered }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setError((data as { error?: string }).error ?? "Erreur"); return; }
      setResult(data as Result);
    } finally { setSubmitting(false); }
  }

  function restart() {
    setResult(null);
    setAnswers({});
    setError(null);
  }

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
  if (!isCourseAccessible(course)) notFound();

  return (
    <div className="space-y-5 text-[#2c2822]">
      <PageBack href={`/cours/${id}`} label="Retour au cours" />

      {/* En-tête */}
      <div className="overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-white/80 shadow-sm backdrop-blur">
        <div className="border-b border-[#e8dfd5]/80 bg-gradient-to-r from-[#faf7f2] to-[#f3ece4]/70 px-6 py-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#8a7762]" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight text-[#1f1c18]">
              {qcm?.title ?? "QCM / Quiz"}
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-[#5c544a]">
            <span className="font-medium text-[#2c2822]">{course.title}</span>
            {qcm && !result && (
              <> — {qcm.questions.length} question{qcm.questions.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
      </div>

      {/* Chargement */}
      {loadingQcm && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#d9cfc3]/70 bg-white/70 px-5 py-4 text-sm text-[#5c544a]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c8b89a]/60 border-t-[#7a6849]" />
          Chargement du quiz…
        </div>
      )}

      {/* Pas de QCM */}
      {!loadingQcm && error && !qcm && (
        <div className="rounded-2xl border border-[#d9cfc3]/70 bg-white/80 p-6 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-[#c8b89a]" aria-hidden />
          <p className="font-semibold text-[#2c2822]">Aucun quiz disponible</p>
          <p className="mt-1 text-sm text-[#5c544a]">Le quiz de ce cours n&apos;a pas encore été créé.</p>
        </div>
      )}

      {/* ── Résultats ──────────────────────────────────────── */}
      {result && qcm && (
        <>
          {/* Bandeau score */}
          <div className={`overflow-hidden rounded-2xl border shadow-sm ${
            result.percent >= 70 ? "border-emerald-200/80" : "border-amber-200/80"}`}>
            <div className={`px-6 py-5 text-center ${
              result.percent >= 70
                ? "bg-gradient-to-r from-emerald-50 to-emerald-100/60"
                : "bg-gradient-to-r from-amber-50 to-amber-100/60"}`}>
              {result.percent >= 70
                ? <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
                : <XCircle className="mx-auto mb-2 h-10 w-10 text-amber-600" />}
              <p className={`text-lg font-semibold ${result.percent >= 70 ? "text-emerald-900" : "text-amber-900"}`}>
                {result.percent >= 70 ? "Bravo !" : "Continuez vos efforts !"}
              </p>
              <p className={`mt-1 font-[family-name:var(--font-serif)] text-4xl font-bold tabular-nums ${
                result.percent >= 70 ? "text-emerald-800" : "text-amber-800"}`}>
                {result.score}/{result.total}
              </p>
              <p className={`mt-1 text-sm ${result.percent >= 70 ? "text-emerald-700" : "text-amber-700"}`}>
                {result.percent}% de bonnes réponses
              </p>
            </div>
            <div className="flex justify-center gap-3 border-t border-[#e8dfd5]/60 px-6 py-4">
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Recommencer
              </button>
              <a
                href={`/cours/${id}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#cfc4b6]/80 bg-[#faf7f2] px-5 py-2.5 text-sm font-semibold text-[#2c2822] hover:bg-[#ebe4d8]/80"
              >
                Retour au cours
              </a>
            </div>
          </div>

          {/* Correction détaillée */}
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b6258]">Correction détaillée</p>
          {qcm.questions.map((q, idx) => {
            const userAnswer    = answers[q.id] ?? -1;
            const correctAnswer = result.correctIndices[idx] ?? -1;
            const isCorrect     = userAnswer === correctAnswer;
            return (
              <fieldset
                key={q.id}
                className={`overflow-hidden rounded-2xl border shadow-sm ${
                  isCorrect ? "border-emerald-200/80" : "border-rose-200/80"}`}
              >
                <div className={`flex items-center gap-2 border-b px-5 py-3 ${
                  isCorrect
                    ? "border-emerald-100 bg-emerald-50/60"
                    : "border-rose-100 bg-rose-50/60"}`}>
                  {isCorrect
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    : <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                  <legend className="text-sm font-semibold text-[#1f1c18]">
                    <span className="mr-1.5 text-xs text-[#8a7762]">Q{idx + 1}.</span>
                    {q.prompt}
                  </legend>
                </div>
                <div className="space-y-2 p-4">
                  {q.choices.map((choice, ci) => {
                    const isUserChoice    = ci === userAnswer;
                    const isCorrectChoice = ci === correctAnswer;

                    let cls = "border-[#e0d6ca]/80 bg-[#faf7f2]/95 text-[#5c544a]";
                    if (isCorrectChoice) cls = "border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold";
                    else if (isUserChoice && !isCorrect) cls = "border-rose-300 bg-rose-50 text-rose-800 line-through";

                    return (
                      <div key={ci} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${cls}`}>
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          isCorrectChoice ? "bg-emerald-500 text-white" : isUserChoice && !isCorrect ? "bg-rose-400 text-white" : "bg-[#e8dfd5] text-[#7a7268]"}`}>
                          {isCorrectChoice ? "✓" : isUserChoice && !isCorrect ? "✗" : String.fromCharCode(65 + ci)}
                        </span>
                        {choice}
                        {isCorrectChoice && <span className="ml-auto text-xs text-emerald-600">Bonne réponse</span>}
                        {isUserChoice && !isCorrect && <span className="ml-auto text-xs text-rose-500">Votre réponse</span>}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <button type="button" onClick={restart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto sm:px-8">
            <RefreshCw className="h-4 w-4" /> Recommencer le quiz
          </button>
        </>
      )}

      {/* ── Questions ──────────────────────────────────────── */}
      {qcm && !result && (
        <>
          {qcm.questions.map((q, idx) => (
            <fieldset key={q.id}
              className="overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-white/80 shadow-sm backdrop-blur">
              <div className="border-b border-[#e8dfd5]/60 bg-[#faf7f2]/80 px-5 py-3">
                <legend className="text-sm font-semibold text-[#1f1c18]">
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ebe4d8]/80 text-xs font-bold text-[#7a6849]">
                    {idx + 1}
                  </span>
                  {q.prompt}
                </legend>
              </div>
              <div className="space-y-2 p-4">
                {q.choices.map((choice, ci) => {
                  const selected = answers[q.id] === ci;
                  return (
                    <label key={ci} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      selected
                        ? "border-slate-400/60 bg-slate-900 text-white"
                        : "border-[#e0d6ca]/80 bg-[#faf7f2]/95 text-[#2c2822] hover:bg-[#ebe4d8]/50"}`}>
                      <input type="radio" name={`q-${q.id}`} checked={selected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: ci }))}
                        className="h-4 w-4 accent-slate-900" />
                      {choice}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          )}

          <button type="button" onClick={() => void submit()} disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto sm:px-8">
            {submitting
              ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Validation…</>
              : "Valider mes réponses →"}
          </button>
        </>
      )}
    </div>
  );
}
