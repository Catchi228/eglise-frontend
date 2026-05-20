"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import { readAnnouncements, whenPublicContentReady } from "@/lib/adminData";

type Category = "Toutes" | "Événement" | "Recherche" | "Autre";

function parseFRDate(d: string | undefined) {
  if (!d) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

export default function AnnoncesPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category>("Toutes");
  const [onlyPublished, setOnlyPublished] = useState(true);
  const [tick, setTick] = useState(0);
  const [lightbox, setLightbox] = useState<{
    open: boolean;
    images: string[];
    index: number;
  }>({ open: false, images: [], index: 0 });
  const [contentReady, setContentReady] = useState(false);

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

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return readAnnouncements()
      .filter((a) => (onlyPublished ? a.status === "Publiée" : true))
      .filter((a) => (category === "Toutes" ? true : a.category === category))
      .filter((a) => {
        if (!query) return true;
        return (
          a.title.toLowerCase().includes(query) ||
          a.body.toLowerCase().includes(query) ||
          (a.city ?? "").toLowerCase().includes(query)
        );
      })
      .slice()
      .sort((a, b) => {
        const da = parseFRDate(a.startAt)?.getTime() ?? Number.POSITIVE_INFINITY;
        const db = parseFRDate(b.startAt)?.getTime() ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
  }, [category, onlyPublished, q, tick]);

  return (
    <div className="space-y-5">
      {lightbox.open ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox({ open: false, images: [], index: 0 })}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full border border-[#cfc4b6]/70 bg-[#fffcf8]/95 px-3 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-[#ebe4d8]/90"
              onClick={() => setLightbox({ open: false, images: [], index: 0 })}
            >
              <span className="inline-flex items-center gap-2">
                <X className="h-4 w-4 text-[var(--foreground)]" aria-hidden="true" />
                Fermer
              </span>
            </button>

            <div className="overflow-hidden rounded-2xl bg-black">
              <img
                src={lightbox.images[lightbox.index]}
                alt="Image"
                className="max-h-[85vh] w-full object-contain"
              />
            </div>

            {lightbox.images.length > 1 ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="rounded-full border border-[#cfc4b6]/70 bg-[#fffcf8]/95 px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-[#ebe4d8]/90"
                  onClick={() =>
                    setLightbox((s) => ({
                      ...s,
                      index:
                        (s.index - 1 + s.images.length) % s.images.length,
                    }))
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Précédent
                  </span>
                </button>
                <div className="text-sm text-white/90">
                  {lightbox.index + 1} / {lightbox.images.length}
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#cfc4b6]/70 bg-[#fffcf8]/95 px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-[#ebe4d8]/90"
                  onClick={() =>
                    setLightbox((s) => ({
                      ...s,
                      index: (s.index + 1) % s.images.length,
                    }))
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    Suivant
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {!contentReady ? (
        <div
          className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
          role="status"
          aria-live="polite"
        >
          Chargement des annonces… (délai max. 5 s)
        </div>
      ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="page-title font-semibold tracking-tight">Annonces</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Consultez les annonces de la communauté
            </p>
          </div>
          <Link
            className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 sm:w-auto"
            href="/annonces/demande"
          >
            + Soumettre une annonce
          </Link>
        </div>

        <div className="rounded-3xl border border-[#d9cfc3]/70 bg-white/70 p-4 text-[#2c2822] shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-white/90 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
                placeholder="Rechercher une annonce (titre, ville, contenu)…"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["Toutes", "Événement", "Recherche", "Autre"] as Category[]).map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCategory(chip)}
                    className={
                      chip === category
                        ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        : "rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[#2c2822] hover:bg-[#ebe4d8]/75"
                    }
                  >
                    {chip}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[#5c544a]">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={onlyPublished}
                onChange={(e) => setOnlyPublished(e.target.checked)}
              />
              Afficher seulement les annonces publiées
            </label>
            <div>
              <span className="font-semibold text-[#2c2822]">
                {filtered.length}
              </span>{" "}
              résultat(s)
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((a) => (
            <article
              key={a.id}
              className="rounded-3xl border border-[#d9cfc3]/70 bg-white/70 p-5 text-[#2c2822] shadow-sm backdrop-blur"
            >
              {(() => {
                const images =
                  a.imageUrls?.length
                    ? a.imageUrls
                    : a.imageUrl
                      ? [a.imageUrl]
                      : [];
                const cover = images[0];
                if (!cover) return null;
                return (
                  <button
                    type="button"
                    className="relative mb-4 block h-44 w-full overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-[#ebe4d8]/75 text-left"
                    onClick={() =>
                      setLightbox({ open: true, images, index: 0 })
                    }
                    title="Voir l'image en grand"
                  >
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-black/5 to-transparent" />
                    {images.length > 1 ? (
                      <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                        +{images.length - 1} photo(s)
                      </div>
                    ) : null}
                  </button>
                );
              })()}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#ebe4d8]/75 px-3 py-1 text-xs font-semibold text-[#5c4a36]">
                  {a.category}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {a.status}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-semibold">{a.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{a.body}</p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                {a.city ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#d9cfc3]/70 bg-white/85 px-3 py-2">
                    <MapPin className="h-4 w-4 text-[#7a6849]" aria-hidden="true" />
                    {a.city}
                  </span>
                ) : null}
                {a.startAt && a.endAt ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#d9cfc3]/70 bg-white/85 px-3 py-2">
                    <CalendarDays
                      className="h-4 w-4 text-[#7a6849]"
                      aria-hidden="true"
                    />
                    {a.startAt} - {a.endAt}
                  </span>
                ) : null}
                {a.contactEmail ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-[#d9cfc3]/70 bg-white/85 px-3 py-2 hover:bg-[#ebe4d8]/75"
                    href={`mailto:${a.contactEmail}`}
                  >
                    <Mail className="h-4 w-4 text-[#7a6849]" aria-hidden="true" />
                    {a.contactEmail}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
    </div>
  );
}

