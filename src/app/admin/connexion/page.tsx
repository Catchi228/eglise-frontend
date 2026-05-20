"use client";

import Link from "next/link";
import { Suspense } from "react";
import ConnexionClient from "@/app/connexion/ConnexionClient";

export default function AdminConnexionPage() {

  return (
    <div className="relative min-h-screen">
      <div className="absolute left-4 top-4 z-[100] sm:left-6 sm:top-6">
        <Link
          href="/"
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
        >
          ← Portail public
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-white/70">
            Chargement…
          </div>
        }
      >
        <ConnexionClient />
      </Suspense>
    </div>
  );
}
