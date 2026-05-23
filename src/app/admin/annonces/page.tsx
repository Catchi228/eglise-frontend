"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Upload } from "lucide-react";
import type { Announcement, AnnouncementCategory } from "@/lib/types";
import { readAnnouncements, writeAnnouncements } from "@/lib/adminData";

const categories: AnnouncementCategory[] = ["Événement", "Recherche", "Autre"];

const MAX_IMAGE_BYTES = 5_000_000;

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("subdir", "announcements");
  const r = await fetch("/api/uploads/image", {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  if (!r.ok) {
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Erreur upload");
  }
  const data = (await r.json()) as { path: string };
  return data.path;
}

export default function AdminAnnoncesPage() {
  const [list, setList] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("Événement");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const reload = useCallback(() => setList(readAnnouncements()), []);

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

  async function persist(next: Announcement[]) {
    await writeAnnouncements(next);
    setList(readAnnouncements());
  }

  function setStatus(id: string, status: Announcement["status"]) {
    void persist(list.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function remove(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    void persist(list.filter((a) => a.id !== id));
  }

  async function addAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const t = title.trim();
    const b = body.trim();
    if (!t) return setFormError("Le titre est obligatoire.");
    if (!b) return setFormError("Le texte est obligatoire.");
    if (pendingImages.length === 0) {
      return setFormError("Ajoutez au moins une image (annonces avec texte et images uniquement).");
    }
    const urls: string[] = [];
    for (const f of pendingImages) {
      if (!f.type.startsWith("image/")) {
        return setFormError(`« ${f.name} » n’est pas une image.`);
      }
      if (f.size > MAX_IMAGE_BYTES) {
        return setFormError(`« ${f.name} » est trop lourd (max. ${Math.round(MAX_IMAGE_BYTES / 1e6)} Mo).`);
      }
      try {
        urls.push(await uploadImage(f));
      } catch (uploadErr) {
        return setFormError(
          uploadErr instanceof Error
            ? `Upload « ${f.name} » : ${uploadErr.message}`
            : `Upload de « ${f.name} » échoué.`,
        );
      }
    }
    const next: Announcement = {
      id: `a-${Date.now()}`,
      category,
      status: "Publiée",
      title: t,
      body: b,
      imageUrls: urls,
      startAt: new Date().toLocaleDateString("fr-FR"),
      endAt: new Date(Date.now() + 86400000 * 60).toLocaleDateString("fr-FR"),
    };
    await persist([next, ...list]);
    setTitle("");
    setBody("");
    setPendingImages([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#1f1c18]">
          Annonces
        </h1>
        <p className="mt-1 text-sm text-[#5c544a]">
          Chaque annonce doit inclure du texte et au moins une image. Plusieurs images possibles.
        </p>
      </div>

      <form
        onSubmit={addAnnouncement}
        className="space-y-4 rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-[#2c2822]">Nouvelle annonce</h2>
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
            Catégorie
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
              className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs font-medium text-[#6b6258]">
          Texte
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
            required
          />
        </label>
        <div>
          <p className="text-xs font-medium text-[#6b6258]">Images (obligatoire, plusieurs fichiers possibles)</p>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/80 px-4 py-2 text-sm font-semibold text-[#2c2822] hover:bg-[#e0d6ca]">
            <Upload className="h-4 w-4" aria-hidden />
            Choisir des images
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                setPendingImages((prev) => [...prev, ...files]);
              }}
            />
          </label>
          {pendingImages.length ? (
            <ul className="mt-2 flex flex-wrap gap-2 text-xs text-[#5c544a]">
              {pendingImages.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-1 rounded-full border border-[#e0d6ca]/90 bg-[#faf7f2] px-2 py-1"
                >
                  {f.name}
                  <button
                    type="button"
                    className="font-bold text-rose-600 hover:text-rose-800"
                    onClick={() => setPendingImages((p) => p.filter((_, j) => j !== i))}
                    aria-label={`Retirer ${f.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {formError ? <p className="text-sm font-medium text-rose-600">{formError}</p> : null}
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Publier l’annonce
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 shadow-sm">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-[#e0d6ca]/90 bg-[#f3ece4]/90 text-xs font-semibold uppercase tracking-wide text-[#6b6258]">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Médias</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebe4d8]/90">
            {list.map((a) => {
              const imgCount =
                (a.imageUrls?.length ?? 0) + (a.imageUrl ? 1 : 0);
              return (
                <tr key={a.id} className="bg-[#faf7f2]/90">
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-[#2c2822]">{a.title}</td>
                  <td className="px-4 py-3 text-[#5c544a]">{imgCount} image(s)</td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      onChange={(e) =>
                        setStatus(a.id, e.target.value as Announcement["status"])
                      }
                      className="rounded-lg border border-[#cfc4b6]/80 bg-[#fffcf8] px-2 py-1 text-xs font-medium text-[#2c2822]"
                    >
                      <option value="Publiée">Publiée</option>
                      <option value="Désactivée">Désactivée</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200/90 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      onClick={() => remove(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#6b6258]">
        <Link href="/annonces" className="font-semibold text-amber-900 hover:underline dark:text-accent-text">
          Voir le fil public
        </Link>
      </p>
    </div>
  );
}
