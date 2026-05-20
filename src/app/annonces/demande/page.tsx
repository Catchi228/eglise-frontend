"use client";

import { useMemo, useState } from "react";
import { PageBack } from "@/components/PageBack";

type Category = "Événement" | "Recherche" | "Autre";

type AnnouncementRequest = {
  title: string;
  category: Category;
  body: string;
  city: string;
  startAt: string;
  endAt: string;
  contactEmail?: string;
  contactPhone?: string;
  imageDataUrls?: string[];
  createdAt: string;
};

const STORAGE_KEY = "eglise.announcementRequests.v1";

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export default function DemandeAnnoncePage() {
  const [category, setCategory] = useState<Category>("Événement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewDataUrls = useMemo(() => imageDataUrls, [imageDataUrls]);

  function isValidTogoPhone(input: string) {
    const digits = input.replace(/[^\d+]/g, "");
    const normalized = digits.startsWith("+") ? digits : `+${digits}`;
    // Formats acceptés: +228XXXXXXXX (8 chiffres après 228)
    return /^\+228\d{8}$/.test(normalized);
  }

  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);

    if (!title.trim()) return setError("Veuillez saisir un titre.");
    if (!body.trim()) return setError("Veuillez saisir une description.");
    if (!city.trim()) return setError("Veuillez saisir une ville.");
    const email = contactEmail.trim();
    const phone = contactPhone.trim();
    if (!email && !phone) {
      return setError("Veuillez saisir un email ou un numéro de téléphone (+228).");
    }
    if (phone && !isValidTogoPhone(phone)) {
      return setError("Numéro invalide. Format attendu : +228XXXXXXXX (8 chiffres).");
    }

    const normalizedPhone = phone
      ? phone.startsWith("+")
        ? phone
        : `+${phone.replace(/[^\d]/g, "")}`
      : undefined;

    try {
      const r = await fetch("/api/announcement-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: title.trim(),
          category,
          body: body.trim(),
          city: city.trim(),
          startAt: startAt.trim(),
          endAt: endAt.trim(),
          contactEmail: email || undefined,
          contactPhone: normalizedPhone,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((data as { error?: string }).error ?? "Envoi impossible");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
      return;
    }

    setSent(true);

    setTitle("");
    setBody("");
    setCity("");
    setStartAt("");
    setEndAt("");
    setContactEmail("");
    setContactPhone("");
    setImageDataUrls([]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 text-[#2c2822]">
      <PageBack href="/annonces" label="Annonces" />
      <div className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">
          Demande de publication
        </h1>
        <p className="mt-2 text-sm text-[#5c544a]">
          Remplissez ce formulaire. L’équipe admin validera avant publication.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 shadow-sm backdrop-blur"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Titre</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
              placeholder="Ex: Journée portes ouvertes"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none focus:ring-2 focus:ring-amber-300/40"
            >
              <option value="Événement">Événement</option>
              <option value="Recherche">Recherche</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Ville</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
              placeholder="Ex: Paris 15ème"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Début</label>
            <input
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
              placeholder="JJ/MM/AAAA"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Fin</label>
            <input
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
              placeholder="JJ/MM/AAAA"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Description</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 p-4 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
              placeholder="Décrivez l’annonce simplement…"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Contact</label>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
                placeholder="Email (optionnel)"
                autoComplete="email"
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
                placeholder="Téléphone (+228XXXXXXXX)"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <p className="text-xs text-[#6b6258]">
              Saisis au moins un moyen de contact (email ou téléphone).
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Photo</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none file:mr-3 file:rounded-full file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-900 focus:ring-2 focus:ring-amber-300/40"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []).slice(0, 3);
                if (!files.length) return;
                try {
                  setError(null);
                  const urls = await Promise.all(files.map(fileToDataUrl));
                  setImageDataUrls(urls);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Erreur lors de la lecture de l’image.",
                  );
                }
              }}
            />
            <p className="text-xs text-[#6b6258]">Jusqu’à 3 photos.</p>
            {previewDataUrls.length ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {previewDataUrls.map((src, idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-[#ebe4d8]/70"
                  >
                    <img
                      src={src}
                      alt={`Aperçu ${idx + 1}`}
                      className="h-32 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {sent ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Demande envoyée. Elle sera examinée par l’équipe.
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Envoyer la demande
          </button>
          <PageBack
            href="/annonces"
            label="Retour aux annonces"
            className="inline-flex items-center justify-center rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-5 py-2.5 no-underline hover:bg-[#ebe4d8]/80"
          />
        </div>
      </form>
    </div>
  );
}

