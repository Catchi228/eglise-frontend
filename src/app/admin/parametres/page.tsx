"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { clearSiteLogo, getSiteLogo, setSiteLogo } from "@/lib/siteLogo";

const MAX_LOGO_BYTES = 1_500_000;
const TAGLINE_KEY = "eglise.site.tagline.v1";

const panel =
  "rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-5 shadow-sm ring-1 ring-stone-900/[0.04]";

export default function AdminParametresPage() {
  const [tagline, setTagline] = useState("");

  useEffect(() => {
    try {
      setTagline(localStorage.getItem(TAGLINE_KEY) ?? "");
    } catch {
      setTagline("");
    }
  }, []);

  function saveTagline() {
    localStorage.setItem(TAGLINE_KEY, tagline.trim());
    window.dispatchEvent(new CustomEvent("eglise:admin-data"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#1f1c18]">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-[#5c544a]">
          Identité visuelle du portail (stockage local démo).
        </p>
      </div>

      <LogoAdminCard />

      <section className={panel}>
        <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#1f1c18]">
          Sous-titre du portail (optionnel)
        </h2>
        <p className="mt-1 text-sm text-[#5c544a]">
          Texte d’accroche conservé localement — à relier au CMS en production.
        </p>
        <textarea
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          rows={3}
          className="mt-3 w-full max-w-xl rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
          placeholder="Ex. : Communion d’églises — Togo"
        />
        <button
          type="button"
          onClick={saveTagline}
          className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Enregistrer
        </button>
      </section>
    </div>
  );
}

function LogoAdminCard() {
  const [preview, setPreview] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getSiteLogo(),
  );
  const [err, setErr] = useState<string | null>(null);

  const syncPreview = useCallback(() => {
    setPreview(getSiteLogo());
  }, []);

  useEffect(() => {
    const on = () => syncPreview();
    window.addEventListener("eglise:logo", on);
    return () => window.removeEventListener("eglise:logo", on);
  }, [syncPreview]);

  return (
    <div className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#1f1c18]">
            Logo du portail
          </h2>
          <p className="mt-1 text-sm text-[#5c544a]">
            Affiché dans l’en-tête public (données locales au navigateur).
          </p>
        </div>
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/70">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Aperçu du logo" className="h-full w-full object-contain p-1" />
          ) : (
            <ImageUp className="h-6 w-6 text-[#a89e92]" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#cfc4b6]/75 bg-[#ebe4d8]/80 px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-[#e0d6ca]">
          <ImageUp className="h-4 w-4" aria-hidden="true" />
          Choisir une image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              setErr(null);
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > MAX_LOGO_BYTES) {
                setErr("Fichier trop lourd. Choisissez une image plus petite.");
                return;
              }
              try {
                const url = await setSiteLogo(f);
                setPreview(url);
              } catch (uploadErr) {
                setErr(uploadErr instanceof Error ? uploadErr.message : "Erreur upload.");
              }
            }}
          />
        </label>
        {preview ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200/90 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
            onClick={async () => {
              setErr(null);
              try {
                await clearSiteLogo();
                setPreview(null);
              } catch (clearErr) {
                setErr(clearErr instanceof Error ? clearErr.message : "Erreur.");
              }
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Retirer le logo
          </button>
        ) : null}
      </div>
      {err ? <p className="mt-3 text-sm font-medium text-rose-600">{err}</p> : null}
    </div>
  );
}
