"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Trash2, Upload } from "lucide-react";
import type { Course, CoursePdfFile, CourseStatus } from "@/lib/types";
import { readCourses, writeCourses } from "@/lib/adminData";

const statuses: CourseStatus[] = ["À venir", "En cours", "Terminé"];

const MAX_PDF_BYTES = 20_000_000;

async function uploadPdf(file: File): Promise<{ path: string; name: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/uploads/pdf", {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  if (!r.ok) {
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Erreur upload");
  }
  return (await r.json()) as { path: string; name: string };
}

export default function AdminCoursPage() {
  const [list, setList] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<CourseStatus>("À venir");
  const [pdfs, setPdfs] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => setList(readCourses()), []);

  useEffect(() => {
    reload();
    const on = () => reload();
    window.addEventListener("storage", on);
    window.addEventListener("eglise:admin-data", on);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("eglise:admin-data", on);
    };
  }, [reload]);

  async function persist(next: Course[]) {
    await writeCourses(next);
    setList(readCourses());
  }

  function updateCourseStatus(id: string, s: CourseStatus) {
    void persist(list.map((c) => (c.id === id ? { ...c, status: s } : c)));
  }

  function remove(id: string) {
    if (!confirm("Supprimer ce cours ?")) return;
    void persist(list.filter((c) => c.id !== id));
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    const d = description.trim();
    if (!t) return setError("Le titre est obligatoire.");
    if (!d) return setError("La description est obligatoire.");
    if (pdfs.length === 0) {
      return setError("Ajoutez au moins un fichier PDF.");
    }
    const pdfFiles: CoursePdfFile[] = [];
    for (const f of pdfs) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        return setError(`« ${f.name} » n’est pas un PDF.`);
      }
      if (f.size > MAX_PDF_BYTES) {
        return setError(`« ${f.name} » dépasse la taille maximale autorisée.`);
      }
      try {
        const uploaded = await uploadPdf(f);
        pdfFiles.push({
          id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: uploaded.name,
          dataUrl: uploaded.path,
        });
      } catch (uploadErr) {
        return setError(
          uploadErr instanceof Error
            ? `Upload « ${f.name} » : ${uploadErr.message}`
            : `Upload de « ${f.name} » échoué.`,
        );
      }
    }
    const tagList = tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const course: Course = {
      id: `c-${Date.now()}`,
      title: t,
      description: d,
      tags: tagList.length ? tagList : ["Cours"],
      status,
      startAt: new Date().toLocaleDateString("fr-FR"),
      endAt: new Date(Date.now() + 86400000 * 90).toLocaleDateString("fr-FR"),
      time: "—",
      sections: [],
      pdfFiles,
    };
    await persist([course, ...list]);
    setTitle("");
    setDescription("");
    setTags("");
    setStatus("À venir");
    setPdfs([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#1f1c18]">
          Cours
        </h1>
        <p className="mt-1 text-sm text-[#5c544a]">
          Les cours s’ajoutent uniquement par fichiers PDF (un ou plusieurs).
        </p>
      </div>

      <form
        onSubmit={addCourse}
        className="space-y-4 rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-[#2c2822]">Nouveau cours (PDF uniquement)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#6b6258]">
            Titre
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
              required
            />
          </label>
          <label className="text-xs font-medium text-[#6b6258]">
            Statut
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CourseStatus)}
              className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs font-medium text-[#6b6258]">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
            required
          />
        </label>
        <label className="block text-xs font-medium text-[#6b6258]">
          Tags (séparés par des virgules)
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Ex. : Bible, NT"
            className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
          />
        </label>
        <div>
          <p className="text-xs font-medium text-[#6b6258]">Fichiers PDF (obligatoire)</p>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/80 px-4 py-2 text-sm font-semibold text-[#2c2822] hover:bg-[#e0d6ca]">
            <Upload className="h-4 w-4" aria-hidden />
            Choisir des PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                setPdfs((p) => [...p, ...files]);
              }}
            />
          </label>
          {pdfs.length ? (
            <ul className="mt-2 flex flex-wrap gap-2 text-xs text-[#5c544a]">
              {pdfs.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-1 rounded-full border border-[#e0d6ca]/90 bg-[#faf7f2] px-2 py-1"
                >
                  {f.name}
                  <button
                    type="button"
                    className="font-bold text-rose-600"
                    onClick={() => setPdfs((p) => p.filter((_, j) => j !== i))}
                    aria-label={`Retirer ${f.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Ajouter le cours
        </button>
      </form>

      <div className="space-y-3">
        {list.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-3 rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold text-[#2c2822]">{c.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-[#5c544a]">{c.description}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6b6258]">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ebe4d8]/90 px-2 py-0.5">
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  {(c.pdfFiles?.length ?? 0) || 0} PDF
                </span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <select
                value={c.status}
                onChange={(e) => updateCourseStatus(c.id, e.target.value as CourseStatus)}
                className="rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm font-medium text-[#2c2822]"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Link
                href={`/cours/${c.id}`}
                className="rounded-xl border border-[#cfc4b6]/80 bg-[#ebe4d8]/80 px-3 py-2 text-xs font-semibold text-[#2c2822] hover:bg-slate-900 hover:text-white"
              >
                Voir
              </Link>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200/90 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#6b6258]">
        <Link href="/cours" className="font-semibold text-amber-900 hover:underline dark:text-accent-text">
          Liste publique
        </Link>
      </p>
    </div>
  );
}
