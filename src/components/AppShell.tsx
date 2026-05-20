"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Church } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { CBT_INSTITUTION } from "@/lib/cbtInstitution";
import { usePresenceHeartbeat } from "@/lib/presenceClient";
import { getSiteLogo } from "@/lib/siteLogo";
import { useEffect, useState } from "react";

const SHELL_BG =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2400&q=82";

export function AppShell({ children }: { children: ReactNode }) {
  usePresenceHeartbeat();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setLogoUrl(getSiteLogo());
    sync();
    window.addEventListener("eglise:logo", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("eglise:logo", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col overflow-x-clip bg-transparent text-stone-900 dark:bg-transparent dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-20">
        <Image
          src={SHELL_BG}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%] opacity-[0.42] dark:opacity-[0.42]"
        />
        {/* Mode clair : même photo qu’en sombre, légèrement assombrie + voiles pour lisibilité */}
        <div
          className="absolute inset-0 bg-stone-900/18 dark:bg-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#f4efe6]/55 via-[#e8dfd4]/42 to-[#ddd2c6]/36 dark:from-slate-900/78 dark:via-slate-800/62 dark:to-slate-900/76"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-10%,rgba(180,83,9,0.14),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-10%,rgba(180,83,9,0.18),transparent_55%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_100%,rgba(30,58,95,0.12),transparent_50%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_80%_100%,rgba(30,58,95,0.22),transparent_50%)]"
          aria-hidden
        />
      </div>

      <TopNav />
      <main className="relative flex-1 pt-[4.25rem]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          {children}
        </div>
      </main>

      <footer className="relative mt-auto border-t border-[#b8aea2]/80 bg-[#d8cfc4]/72 text-[#3d3830] shadow-[0_-10px_36px_-8px_rgba(44,40,34,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#d8cfc4]/62 dark:border-white/10 dark:bg-[#020617] dark:text-slate-300 dark:shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.45)] dark:supports-[backdrop-filter]:bg-slate-950/35">
        <div className="mx-auto grid max-w-6xl gap-8 px-3 py-10 sm:gap-10 sm:px-6 sm:py-14 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[#b8aea2]/80 bg-[#f0ebe4] text-[#2c2822] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.5)]">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-full w-full rounded-[14px] object-cover"
                  />
                ) : (
                  <Church className="h-5 w-5" aria-hidden />
                )}
              </div>
              <div>
                <div className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight text-[#2c2822] dark:text-white">
                  {CBT_INSTITUTION.name}
                </div>
                <p className="text-xs text-[#6b6258] dark:text-slate-500">
                  {CBT_INSTITUTION.acronym} · depuis {CBT_INSTITUTION.founded}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#5c544a] dark:text-slate-400">
              {CBT_INSTITUTION.movement} — {CBT_INSTITUTION.theology}.{" "}
              {CBT_INSTITUTION.affiliations.join(", ")}.
            </p>
          </div>

          <div>
            <div className="font-[family-name:var(--font-serif)] text-xs font-semibold uppercase tracking-[0.2em] text-[#6b6258] dark:text-slate-500">
              Liens rapides
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  className="text-[#3d3830] transition hover:text-[#1f1c18] dark:text-slate-300 dark:hover:text-white"
                  href="/"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  className="text-[#3d3830] transition hover:text-[#1f1c18] dark:text-slate-300 dark:hover:text-white"
                  href="/#eglises"
                >
                  Églises
                </Link>
              </li>
              <li>
                <Link
                  className="text-[#3d3830] transition hover:text-[#1f1c18] dark:text-slate-300 dark:hover:text-white"
                  href="/#projets"
                >
                  Projets
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-[family-name:var(--font-serif)] text-xs font-semibold uppercase tracking-[0.2em] text-[#6b6258] dark:text-slate-500">
              Contact
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-[#5c544a] dark:text-slate-400">
              <li>
                <a
                  href={`tel:${CBT_INSTITUTION.contact.phoneTel}`}
                  className="font-medium text-[#3d3830] transition hover:text-[#1f1c18] hover:underline dark:text-slate-300 dark:hover:text-white"
                >
                  {CBT_INSTITUTION.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CBT_INSTITUTION.contact.email}`}
                  className="font-medium text-[#3d3830] transition hover:text-[#1f1c18] hover:underline dark:text-slate-300 dark:hover:text-white"
                >
                  {CBT_INSTITUTION.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={CBT_INSTITUTION.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#3d3830] transition hover:text-[#1f1c18] hover:underline dark:text-slate-300 dark:hover:text-white"
                >
                  {CBT_INSTITUTION.websiteLabel}
                </a>
              </li>
              <li className="leading-relaxed">
                {CBT_INSTITUTION.contact.address}
                <br />
                {CBT_INSTITUTION.contact.city}
                <br />
                {CBT_INSTITUTION.contact.poBox}
              </li>
              <li className="text-[#6b6258] dark:text-slate-500">
                Facebook / Messenger : {CBT_INSTITUTION.contact.facebookLabel}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#b8aea2]/75 bg-[#cfc6bb]/75 py-6 text-center text-xs text-[#4a433c] backdrop-blur-md supports-[backdrop-filter]:bg-[#cfc6bb]/65 dark:border-white/5 dark:bg-[#010409] dark:text-slate-500 dark:supports-[backdrop-filter]:bg-[#010409]/90">
          © {new Date().getFullYear()} {CBT_INSTITUTION.name} ({CBT_INSTITUTION.acronym})
        </div>
      </footer>
    </div>
  );
}
