"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Maximize2, Minimize2, X } from "lucide-react";

type PdfViewerProps = {
  open: boolean;
  src: string | null;
  name?: string;
  onClose: () => void;
};

export function PdfViewer({ open, src, name, onClose }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) setLoading(true);
  }, [open, src]);

  function toggleFullscreen() {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  }

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (!open || !src) return null;

  const displayName = name?.trim() || "Document PDF";
  // Charge via l'API pour garantir X-Frame-Options: SAMEORIGIN
  const iframeSrc = src.startsWith("/uploads/")
    ? `/api/pdf?src=${encodeURIComponent(src)}`
    : src;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[120] flex flex-col"
      style={{ background: "rgba(15,12,9,0.92)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Lecture — ${displayName}`}
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#1a1714]/98 px-4 py-2.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/8 text-[#c8b89a]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="text-[11px] text-white/50">Appuyer sur Échap pour fermer</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/15"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Nouvel onglet</span>
          </a>
          <a
            href={src}
            download={displayName}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/15"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Télécharger</span>
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/15"
            title={fullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {fullscreen
              ? <Minimize2 className="h-3.5 w-3.5" aria-hidden />
              : <Maximize2 className="h-3.5 w-3.5" aria-hidden />}
            <span className="hidden sm:inline">{fullscreen ? "Réduire" : "Plein écran"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1714] shadow-sm transition hover:bg-white/90"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Fermer
          </button>
        </div>
      </div>

      {/* ── PDF frame ────────────────────────────────────────────── */}
      <div className="relative flex-1 bg-[#1e1b18]">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/60">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <span className="text-xs">Chargement du document…</span>
          </div>
        )}
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          title={displayName}
          className="absolute inset-0 h-full w-full border-0"
          style={{ colorScheme: "normal" }}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
