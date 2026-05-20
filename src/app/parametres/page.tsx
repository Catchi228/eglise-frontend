"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageBack } from "@/components/PageBack";
import { LogIn, LogOut, Settings } from "lucide-react";
import type { Session } from "@/lib/session";
import {
  changeEmail,
  changePassword,
  getSession,
  signOut,
  subscribeSession,
} from "@/lib/session";

export default function ParametresComptePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const sync = () => {
      setSession(getSession());
      setReady(true);
    };
    sync();
    const unsub = subscribeSession(sync);
    return () => {
      unsub();
    };
  }, []);

  return (
    <div className="space-y-5">
      {!ready ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-10 text-center shadow-sm backdrop-blur">
          <p className="text-sm text-[var(--muted)]">Chargement…</p>
        </div>
      ) : null}

      <div className="rounded-3xl border border-[#d9cfc3]/70 bg-[#fffcf8]/92 p-6 text-[#2c2822] shadow-sm backdrop-blur">
        <PageBack href="/" label="Accueil" />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Paramètres du compte
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Identifiant, mot de passe et session.
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#cfc4b6]/75 bg-[#ebe4d8]/75 text-[#7a6849]">
            <Settings className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold">Statut</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {session ? `Connecté : ${session.email}` : "Non connecté"}
              </div>
            </div>

            {session ? (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-slate-900 hover:text-white"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Se déconnecter
              </button>
            ) : (
              <Link
                href="/connexion?next=/parametres"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-slate-900 hover:text-white"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Se connecter
              </Link>
            )}
          </div>
        </div>

        {session ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 shadow-sm">
              <div className="text-sm font-semibold">Changer d’identifiant</div>
              <div className="mt-2 space-y-2">
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
                  placeholder="Nouvel email"
                  autoComplete="email"
                />
                <input
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
                  placeholder="Mot de passe actuel (confirmation)"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-slate-900 hover:text-white"
                  onClick={async () => {
                    setAccountError(null);
                    setAccountSuccess(null);
                    const nextEmail = newEmail.trim();
                    if (!nextEmail)
                      return setAccountError("Veuillez saisir un nouvel email.");
                    if (!nextEmail.includes("@"))
                      return setAccountError("Email invalide.");
                    try {
                      await changeEmail(nextEmail, emailPassword);
                      setNewEmail("");
                      setEmailPassword("");
                      setAccountSuccess("Identifiant mis à jour.");
                    } catch (err) {
                      setAccountError(err instanceof Error ? err.message : "Erreur.");
                    }
                  }}
                >
                  Mettre à jour
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 shadow-sm">
              <div className="text-sm font-semibold">Changer de mot de passe</div>
              <div className="mt-2 space-y-2">
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
                  placeholder="Mot de passe actuel"
                  autoComplete="current-password"
                />
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
                  placeholder="Nouveau mot de passe"
                  autoComplete="new-password"
                />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#faf7f2]/95 px-4 py-3 text-sm text-[#2c2822] outline-none placeholder:text-[#8a8177] focus:ring-2 focus:ring-amber-300/40"
                  placeholder="Confirmer le nouveau mot de passe"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-[#cfc4b6]/75 bg-[#fffcf8] px-4 py-2 text-sm font-semibold text-[#2c2822] shadow-sm hover:bg-slate-900 hover:text-white"
                  onClick={async () => {
                    setAccountError(null);
                    setAccountSuccess(null);
                    if (newPassword.length < 6) {
                      return setAccountError(
                        "Nouveau mot de passe trop court (6 caractères minimum).",
                      );
                    }
                    if (newPassword !== confirmPassword) {
                      return setAccountError("La confirmation ne correspond pas.");
                    }
                    try {
                      await changePassword(currentPassword, newPassword);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setAccountSuccess("Mot de passe mis à jour.");
                    } catch (err) {
                      setAccountError(err instanceof Error ? err.message : "Erreur.");
                    }
                  }}
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/95 p-4 text-sm text-[var(--muted)] shadow-sm">
            Connectez-vous pour modifier vos paramètres.
          </div>
        )}

        {accountError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {accountError}
          </div>
        ) : null}
        {accountSuccess ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {accountSuccess}
          </div>
        ) : null}
      </div>
    </div>
  );
}
