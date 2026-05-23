"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookMarked,
  BookOpen,
  ChartColumn,
  HelpCircle,
  NotebookPen,
} from "lucide-react";
import { useSession } from "@/lib/useSession";

const tiles = [
  {
    label: "Cours & QCM",
    desc: "Parcours, enseignements et évaluations",
    href: "/cours",
    Icon: BookOpen,
  },
  {
    label: "Mes notes",
    desc: "Méditations et annotations personnelles",
    href: "/mon-espace/notes",
    Icon: NotebookPen,
  },
  {
    label: "Mes performances",
    desc: "Suivi des résultats et progrès",
    href: "/mon-espace/performances",
    Icon: ChartColumn,
  },
  {
    label: "Mes questions",
    desc: "Historique et réponses",
    href: "/mon-espace/questions",
    Icon: HelpCircle,
  },
  { label: "Favoris", desc: "Versets et passages enregistrés", href: "/mon-espace/favoris", Icon: BookMarked },
] as const;

export default function MonEspacePage() {
  const { session, ready } = useSession();

  return (
    <div className="space-y-10 pb-6">
      {!ready ? (
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#e0d6ca]/70 bg-[#fffcf8]/92 p-12 text-center shadow-[0_28px_80px_-40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="font-[family-name:var(--font-inter)] text-sm text-[#6b6258]">
            Chargement…
          </p>
        </div>
      ) : null}

      <header className="rounded-[2rem] border border-[#e0d6ca]/75 bg-[#fffcf8]/95 p-5 shadow-[0_32px_90px_-44px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8 md:p-10">
        <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-[0.2em] text-amber-800/80">
          Espace personnel
        </p>
        <h1 className="page-title mt-2 font-[family-name:var(--font-serif)] font-semibold tracking-tight text-[#2c2822]">
          Tableau de bord
        </h1>
        <p className="mt-3 max-w-2xl font-[family-name:var(--font-inter)] text-sm leading-relaxed text-[#5c544a] sm:text-base">
          {session
            ? `Ravi de vous revoir. Connecté : ${session.email}`
            : "Vous n’êtes pas connecté — certaines actions restent disponibles en local."}
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(({ label, href, Icon, desc }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col rounded-[1.75rem] border border-[#d4c9bc]/55 bg-[#faf7f2]/96 p-7 shadow-[0_20px_56px_-36px_rgba(15,23,42,0.25)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-amber-300/50 hover:shadow-[0_28px_70px_-32px_rgba(15,23,42,0.3)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ebe4d8]/90 text-[#2c2822] ring-1 ring-[#cfc4b6]/80 transition group-hover:bg-amber-500/15 group-hover:text-amber-950 group-hover:ring-amber-400/30">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="rounded-full bg-[#ebe4d8]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b6258] transition group-hover:bg-amber-100/80 group-hover:text-amber-900">
                Accès
              </span>
            </div>
            <div className="mt-5 font-[family-name:var(--font-serif)] text-xl font-semibold tracking-tight text-[#2c2822]">
              {label}
            </div>
            <p className="mt-2 flex-1 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-[#5c544a]">
              {desc}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#3d3830] transition group-hover:text-amber-950">
              Ouvrir
              <span
                className="inline-block transition group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
