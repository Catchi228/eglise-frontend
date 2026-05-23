"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CBT_INSTITUTION } from "@/lib/cbtInstitution";
import { getSession, subscribeSession } from "@/lib/session";

const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=2400&q=85",
    title: CBT_INSTITUTION.name,
    subtitle: `${CBT_INSTITUTION.movement} · Siège à ${CBT_INSTITUTION.headquarters}`,
  },
  {
    src: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=2400&q=85",
    title: "Louange & formation",
    subtitle: "Grandir ensemble dans la Parole et la mission.",
  },
  {
    src: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=2400&q=85",
    title: "Communauté & espérance",
    subtitle: "Vivre la foi au quotidien, avec générosité.",
  },
];

function useInViewOnce(className: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.add(className);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [className]);
  return ref;
}

export function HomeInstitutional() {
  const [slide, setSlide] = useState(0);
  const [session, setSession] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    return subscribeSession(sync);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setSlide((s) => (s + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(t);
  }, []);

  const aboutRef = useInViewOnce("animate-fade-in-up");
  const missionRef = useInViewOnce("animate-fade-in-up");
  const cardsRef = useInViewOnce("animate-fade-in-up");

  return (
    <div>
      {/* Hero plein écran */}
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip motion-safe:animate-fade-in-up">
        <div className="relative min-h-[min(100dvh,920px)] w-full overflow-hidden bg-slate-950">
          {HERO_SLIDES.map((s, i) => (
            <div
              key={s.src}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                i === slide ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== slide}
            >
              <Image
                src={s.src}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover scale-105 motion-safe:animate-[heroKen_24s_ease-in-out_infinite]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
            </div>
          ))}
          <div className="relative z-10 flex min-h-[min(100dvh,920px)] flex-col justify-end px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-28 md:px-12 lg:px-16">
            <p className="font-[family-name:var(--font-serif)] text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Portail institutionnel
            </p>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-serif)] text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
              {HERO_SLIDES[slide]?.title}
            </h1>
            <p className="mt-4 max-w-xl font-[family-name:var(--font-inter)] text-base text-white/90 sm:text-lg md:text-xl">
              {HERO_SLIDES[slide]?.subtitle}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/annonces"
                className="inline-flex items-center gap-2 rounded-full bg-[#faf6f0] px-6 py-3.5 text-sm font-semibold text-[#1f1c18] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)] transition hover:bg-[#ebe4d8]"
              >
                Découvrir les annonces
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md transition hover:bg-white/20"
              >
                Espace membre
              </Link>
            </div>
            <div className="mt-10 flex gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slide ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-0 max-w-6xl space-y-0 px-4 sm:px-6">
        <section
          id="apropos"
          ref={aboutRef}
          className="scroll-mt-24 py-16 opacity-0 sm:py-20 md:py-24"
        >
          <div className="grid gap-12 rounded-[2rem] border border-[#e0d6ca]/80 bg-[#fffcf8]/95 p-8 shadow-[0_32px_90px_-40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                À propos
              </h2>
              <p className="mt-5 font-[family-name:var(--font-inter)] text-base leading-relaxed text-slate-600 md:text-lg">
                La Convention Baptiste du Togo rassemble des églises locales autour de la
                Bible, de la mission et du service. Ce portail centralise informations,
                ressources et outils pour les membres et les équipes.
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#ebe4d8] shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] ring-1 ring-[#d9cfc3]/80">
              <Image
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80"
                alt="Communauté"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        <section
          id="missions"
          ref={missionRef}
          className="scroll-mt-24 rounded-[2rem] border border-[#d9cfc3]/50 bg-[#f3ece4]/90 px-6 py-16 opacity-0 shadow-[0_28px_80px_-36px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-10 sm:py-20 md:py-24"
        >
          <h2 className="text-center font-[family-name:var(--font-serif)] text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Missions & axes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center font-[family-name:var(--font-inter)] text-slate-600">
            Aimer Dieu, éclairer l&apos;Évangile, former des disciples — au Togo et au-delà.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Familles", d: "Rencontres, accompagnement, vie de communauté." },
              { t: "Solidarité", d: "Actions concrètes et entraide entre églises." },
              { t: "Ressources bibliques", d: "Lecture, méditation, formation — dont LSG 1910." },
            ].map((i) => (
              <div
                key={i.t}
                className="rounded-2xl border border-[#d4c9bc]/60 bg-[#faf7f2]/95 p-7 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-28px_rgba(15,23,42,0.2)]"
              >
                <div className="font-[family-name:var(--font-serif)] text-lg font-semibold text-slate-900">
                  {i.t}
                </div>
                <p className="mt-2 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-slate-600">
                  {i.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="eglises"
          className="scroll-mt-24 py-16 sm:py-20 md:py-24"
        >
          <div className="rounded-[2rem] border border-[#e0d6ca]/75 bg-[#fffcf8]/94 p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-10">
            <h2 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-slate-900 md:text-3xl">
              Accès rapides
            </h2>
            <p className="mt-2 font-[family-name:var(--font-inter)] text-slate-600">
              Annonces, cours, Bible et espace personnel.
            </p>
            <div
              id="projets"
              ref={cardsRef}
              className="mt-10 grid scroll-mt-24 gap-5 opacity-0 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  title: "Annonces",
                  desc: "Événements, infos pratiques, vie des églises",
                  href: "/annonces",
                },
              {
                title: "Cours",
                desc: "Enseignements, QCM et ressources — compte requis",
                href: "/cours",
              },
                {
                  title: "Bible",
                  desc: "Lire, rechercher, favoris",
                  href: "/bible",
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-3xl border border-[#cfc4b6]/70 bg-[#faf7f2]/98 p-7 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:border-amber-300/55 hover:shadow-[0_28px_60px_-28px_rgba(15,23,42,0.22)]"
                >
                  <div className="font-[family-name:var(--font-serif)] font-semibold text-slate-900">
                    {card.title}
                  </div>
                  <p className="mt-2 font-[family-name:var(--font-inter)] text-sm text-slate-600">
                    {card.desc}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                    Découvrir
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
