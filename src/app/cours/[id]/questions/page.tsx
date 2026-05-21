"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { PageBack } from "@/components/PageBack";
import { readCourses, whenPublicContentReady } from "@/lib/adminData";
import { isCourseAccessible } from "@/lib/courseAccess";
import { getSession, subscribeSession } from "@/lib/session";
import type { Course, CourseQuestion } from "@/lib/types";

export default function QuestionsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [ready, setReady] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    return subscribeSession(sync);
  }, []);

  useEffect(() => {
    if (!id) {
      setReady(true);
      return;
    }
    const load = () => {
      setCourse(readCourses().find((c) => c.id === id) ?? null);
      setReady(true);
    };
    return whenPublicContentReady(load);
  }, [id]);

  useEffect(() => {
    if (!id || !ready) return;
    fetch(`/api/courses/${id}/questions`, { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) return;
        const data = await r.json();
        setQuestions((data as { questions: CourseQuestion[] }).questions ?? []);
      })
      .catch(() => {});
  }, [id, ready]);

  async function publish() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/courses/${id}/questions`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((data as { error?: string }).error ?? "Erreur");
      setText("");
      const list = await fetch(`/api/courses/${id}/questions`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const d = await list.json();
      setQuestions((d as { questions: CourseQuestion[] }).questions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return <p className="text-sm text-[#5c544a]">Chargement…</p>;
  }
  if (!course) notFound();
  if (!isCourseAccessible(course)) notFound();

  return (
    <div className="space-y-5 text-[#2c2822]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#2c2822]">
            Questions & Réponses
          </h1>
          <p className="mt-1 text-sm text-[#5c544a]">{course.title}</p>
        </div>
        <PageBack
          href={`/cours/${course.id}`}
          label="Retour au cours"
          className="rounded-2xl border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2.5 text-sm font-semibold text-[#2c2822] no-underline hover:bg-[#ebe4d8]/80"
        />
      </div>

      <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#2c2822]">Poser une question</h2>
        {session ? (
          <div className="mt-4 space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[110px] w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 p-4 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
              placeholder="Écrivez votre question…"
            />
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            <button
              type="button"
              disabled={sending}
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              onClick={publish}
            >
              {sending ? "Envoi…" : "Publier"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#5c544a]">
            <Link className="font-semibold text-[#6b5538]" href={`/connexion?next=/cours/${course.id}/questions`}>
              Connectez-vous
            </Link>{" "}
            pour poser une question.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <p className="text-sm text-[#5c544a]">Aucune question pour ce cours.</p>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#6b6258]">{q.from}</span>
                <span
                  className={
                    q.status === "répondu"
                      ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                  }
                >
                  {q.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#2c2822]">{q.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
