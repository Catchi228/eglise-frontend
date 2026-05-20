"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { setAdminGateCookie, signIn } from "@/lib/session";
import { getThemeIsDark, subscribeTheme } from "@/lib/theme";

const LOGIN_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=2400&q=85",
    title: "Un seul corps, plusieurs demeures",
    lines: [
      "L’Église n’est pas un bâtiment : c’est un peuple que Dieu rassemble, console et envoie.",
      "À la Convention Baptiste du Togo, chaque communauté locale prolonge la même fidélité : aimer Dieu, aimer le prochain, et porter l’espérance au cœur des quartiers.",
    ],
  },
  {
    src: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=2400&q=85",
    title: "La Parole qui éclaire nos pas",
    lines: [
      "La Bible n’est pas un décor : elle oriente nos décisions, nourrit nos familles et façonne nos engagements.",
      "En vous connectant, vous rejoignez un espace où enseignements, cours et ressources prolongent ce que vous avez déjà découvert sur le portail — pour grandir, ensemble, jour après jour.",
    ],
  },
  {
    src: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=2400&q=85",
    title: "Du Togo vers le monde, en témoins de paix",
    lines: [
      "Notre histoire s’écrit dans les rencontres, les mains tendues et les prières partagées.",
      "Que cette étape soit pour vous un rappel doux : vous n’êtes jamais seul dans la marche de la foi — la communion des saints est une réalité, concrète et vivante.",
    ],
  },
];

const ADMIN_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=2400&q=80",
    title: "Service et vigilance",
    lines: [
      "L’administration d’un réseau d’églises appelle humilité, discernement et respect de chaque berger et de chaque ouvrier.",
      "Cet espace est réservé aux personnes mandatées : avancez lentement, priez, puis agissez avec intégrité pour le bien commun.",
    ],
  },
  {
    src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=2400&q=80",
    title: "Confiance, non pouvoir",
    lines: [
      "Les outils numériques ne remplacent pas l’écoute du Saint-Esprit ni la sagesse des anciens.",
      "Votre connexion ouvre des responsabilités : qu’elles soient exercées comme un diaconat — pour servir, protéger et clarifier.",
    ],
  },
  {
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2400&q=80",
    title: "Une grappe, une vigne",
    lines: [
      "Derrière les chiffres et les contenus, il y a des visages, des familles, des chemins de foi.",
      "Que le Seigneur fortifie votre cœur pour bâtir en paix ce qu’Il a confié à Sa Convention au Togo.",
    ],
  },
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function ConnexionClient() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = useMemo(() => params.get("next") ?? "", [params]);
  const rawNext = nextParam.startsWith("/") ? nextParam : "";
  const isAdminConnexionRoute =
    pathname === "/admin/connexion" || pathname.startsWith("/admin/connexion/");
  const next = isAdminConnexionRoute && !rawNext.startsWith("/admin") ? "/admin" : rawNext;
  const isAdminLogin = next.startsWith("/admin");
  const viewportFull = isAdminConnexionRoute;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_UP");
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  const slides = isAdminLogin ? ADMIN_SLIDES : LOGIN_SLIDES;

  const isDark = useSyncExternalStore(subscribeTheme, getThemeIsDark, () => false);

  useEffect(() => {
    if (isAdminLogin) setAuthMode("SIGN_IN");
  }, [isAdminLogin]);

  useEffect(() => {
    setSlide(0);
  }, [isAdminLogin]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 10000);
    return () => window.clearInterval(t);
  }, [slides.length]);

  function clientValidate(): string | null {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return "Veuillez saisir un email.";
    if (password.length < 6) return "Mot de passe trop court (6 caractères minimum).";
    return null;
  }

  async function signInAndGo() {
    setError(null);
    const err = clientValidate();
    if (err) return setError(err);

    const mode = isAdminLogin ? "SIGN_IN" : authMode;

    try {
      const user = await signIn({
        email: email.trim(),
        password,
        mode,
      });

      if (isAdminLogin) {
        if (user.role !== "ADMIN") {
          setError("Ce compte n'a pas les droits administrateur.");
          return;
        }
        await setAdminGateCookie();
      }

      if (next) {
        if (user.role === "ADMIN" && next.startsWith("/admin")) {
          router.push(next);
          router.refresh();
          return;
        }
        if (user.role === "USER" && !next.startsWith("/admin")) {
          router.push(next);
          router.refresh();
          return;
        }
      }

      router.push(user.role === "ADMIN" ? "/admin" : "/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion.");
    }
  }

  return (
    <div
      className={cn(
        "relative grid w-full grid-rows-[minmax(260px,42vh)_1fr] lg:grid-cols-2 lg:grid-rows-1",
        viewportFull
          ? "min-h-screen lg:min-h-screen"
          : "min-h-[calc(100dvh-4.25rem)] lg:min-h-[calc(100dvh-4.25rem)]",
      )}
    >
      <div
        className={cn(
          "relative min-h-0 overflow-hidden bg-slate-950",
          viewportFull ? "lg:min-h-screen" : "lg:min-h-[calc(100dvh-4.25rem)]",
        )}
      >
        {slides.map((s, i) => (
          <div
            key={s.src}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
              i === slide ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== slide}
          >
            <Image
              src={s.src}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover motion-safe:animate-[heroKen_28s_ease-in-out_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
          </div>
        ))}
        <div
          className={cn(
            "relative z-10 flex h-full min-h-[260px] flex-col justify-end p-6 sm:p-8 lg:justify-center lg:p-12",
            viewportFull ? "lg:min-h-screen" : "lg:min-h-[calc(100dvh-4.25rem)]",
          )}
        >
          <p className="font-[family-name:var(--font-serif)] text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/85">
            {isAdminLogin ? "Espace réservé" : "Après l’accueil du portail"}
          </p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-serif)] text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl md:text-[2.1rem]">
            {slides[slide]?.title}
          </h2>
          <div className="mt-4 max-w-lg space-y-3 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/88 sm:text-[15px]">
            {slides[slide]?.lines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
          <div className="mt-8 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={`Message ${i + 1}`}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-10 bg-amber-300" : "w-2 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14 lg:py-12",
          isDark
            ? "bg-slate-950 text-slate-100"
            : "bg-[#faf8f5] text-slate-900",
        )}
      >
        <div className="mx-auto w-full max-w-md">
          <h1
            className={cn(
              "font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-[2rem]",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            {isAdminLogin
              ? "Connexion administrateur"
              : authMode === "SIGN_UP"
                ? "Inscription"
                : "Connexion"}
          </h1>
          <p
            className={cn(
              "mt-2 font-[family-name:var(--font-inter)] text-sm leading-relaxed",
              isDark ? "text-slate-400" : "text-slate-600",
            )}
          >
            {isAdminLogin
              ? "Accès réservé — aucune inscription depuis cette page."
              : authMode === "SIGN_UP"
                ? "Créez votre compte pour rejoindre l’espace formation et personnel."
                : "Reconnectez-vous pour poursuivre vos cours et vos notes."}
          </p>

          {!isAdminLogin ? (
            <div
              className={cn(
                "mt-6 flex gap-2 rounded-2xl border p-1.5",
                isDark ? "border-white/10 bg-white/5" : "border-[#d9cfc3]/75 bg-[#fffcf8]/96 shadow-sm",
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  authMode === "SIGN_UP"
                    ? isDark
                      ? "bg-amber-500/90 text-slate-950 shadow-md"
                      : "bg-slate-900 text-white shadow-md"
                    : isDark
                      ? "text-slate-300 hover:bg-white/10"
                      : "text-[#5c544a] hover:bg-[#ebe4d8]/85",
                )}
                onClick={() => {
                  setError(null);
                  setAuthMode("SIGN_UP");
                }}
              >
                S’inscrire
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  authMode === "SIGN_IN"
                    ? isDark
                      ? "bg-amber-500/90 text-slate-950 shadow-md"
                      : "bg-slate-900 text-white shadow-md"
                    : isDark
                      ? "text-slate-300 hover:bg-white/10"
                      : "text-[#5c544a] hover:bg-[#ebe4d8]/85",
                )}
                onClick={() => {
                  setError(null);
                  setAuthMode("SIGN_IN");
                }}
              >
                Se connecter
              </button>
            </div>
          ) : null}

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void signInAndGo();
            }}
          >
            <div className="space-y-2">
              <label
                className={cn(
                  "text-sm font-semibold",
                  isDark ? "text-slate-200" : "text-slate-800",
                )}
              >
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2",
                  isDark
                    ? "border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:border-amber-400/40 focus:ring-amber-500/20"
                    : "border-[#cfc4b6]/80 bg-[#faf7f2]/98 text-[#2c2822] placeholder:text-[#8a8177] focus:border-[#b8aea2] focus:ring-[#2c2822]/12",
                )}
                placeholder="ex: nom@cbdtogo.org"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label
                className={cn(
                  "text-sm font-semibold",
                  isDark ? "text-slate-200" : "text-slate-800",
                )}
              >
                Mot de passe
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2",
                  isDark
                    ? "border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:border-amber-400/40 focus:ring-amber-500/20"
                    : "border-[#cfc4b6]/80 bg-[#faf7f2]/98 text-[#2c2822] placeholder:text-[#8a8177] focus:border-[#b8aea2] focus:ring-[#2c2822]/12",
                )}
                placeholder="••••"
                autoComplete={authMode === "SIGN_UP" && !isAdminLogin ? "new-password" : "current-password"}
              />
            </div>

            <p
              className={cn(
                "text-xs",
                isDark ? "text-slate-500" : "text-slate-500",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  className={cn("h-4 w-4", isDark ? "text-slate-500" : "text-slate-400")}
                  aria-hidden="true"
                />
                Déconnexion sécurisée côté serveur (MariaDB + cookies httpOnly).
              </span>
            </p>

            {error ? (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  isDark
                    ? "border-rose-400/30 bg-rose-950/50 text-rose-100"
                    : "border-rose-200 bg-rose-50 text-rose-800",
                )}
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition",
                isDark
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-slate-900 text-white hover:bg-slate-800",
              )}
            >
              {isAdminLogin ? "Accéder à l’administration" : "Continuer"}
            </button>

            {!isAdminLogin ? (
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 text-sm",
                  isDark ? "text-slate-400" : "text-slate-600",
                )}
              >
                <a
                  className={cn(
                    "font-medium transition",
                    isDark ? "hover:text-amber-200" : "hover:text-slate-900",
                  )}
                  href="#"
                >
                  Mot de passe oublié
                </a>
                <button
                  type="button"
                  className={cn(
                    "font-medium transition",
                    isDark ? "hover:text-amber-200" : "hover:text-slate-900",
                  )}
                  onClick={() => {
                    setError(null);
                    setAuthMode((m) => (m === "SIGN_UP" ? "SIGN_IN" : "SIGN_UP"));
                  }}
                >
                  {authMode === "SIGN_UP" ? "Déjà un compte ?" : "Créer un compte"}
                </button>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
