"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  getPrincipalEmail,
  isPrincipalAdmin,
  readAdminEmails,
  refreshAdminData,
  setPrincipalEmailIfUnset,
  writeAdminEmails,
} from "@/lib/adminData";

export default function AdminAdminsPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [principal, setPrincipal] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);

  const reload = useCallback(() => {
    void refreshAdminData().then(() => {
      const s = getSession();
      const email = s?.email?.trim().toLowerCase() ?? null;
      setMe(email);
      if (email) setPrincipalEmailIfUnset(email);
      setPrincipal(getPrincipalEmail());
      setEmails(readAdminEmails());
    });
  }, []);

  useEffect(() => {
    reload();
    const on = () => reload();
    window.addEventListener("storage", on);
    window.addEventListener("eglise:admin-data", on);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("eglise:admin-data", on);
    };
  }, [reload]);

  const canManage = me && isPrincipalAdmin(me);

  async function add() {
    if (!canManage) return;
    const e = input.trim().toLowerCase();
    if (!e || !e.includes("@")) return;
    if (emails.includes(e)) return;
    await writeAdminEmails([...emails, e]);
    setInput("");
    reload();
  }

  async function remove(email: string) {
    if (!canManage) return;
    if (email === principal) return;
    if (!confirm(`Retirer ${email} de la liste des administrateurs autorisés ?`)) return;
    await writeAdminEmails(emails.filter((x) => x !== email));
    reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#1f1c18]">
          Administrateurs
        </h1>
        <p className="mt-1 text-sm text-[#5c544a]">
          Liste des emails ayant le rôle administrateur dans la base. Seul l&apos;administrateur
          principal peut ajouter ou retirer des comptes (les emails doivent déjà exister comme
          utilisateurs).
        </p>
      </div>

      {!canManage ? (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-[#744210]">
          Seul l’administrateur principal ({principal ?? "—"}) peut modifier cette liste.
        </div>
      ) : (
        <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#2c2822]">Ajouter un administrateur</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="email@domaine.org"
              className="min-w-[12rem] flex-1 rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
            />
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b6258]">
          Référent
        </p>
        <p className="mt-1 text-sm font-medium text-[#2c2822]">{principal ?? "—"}</p>
        <ul className="mt-4 divide-y divide-[#ebe4d8]/90">
          {emails.map((e) => (
            <li
              key={e}
              className="flex items-center justify-between gap-2 py-2 text-sm font-medium text-[#2c2822]"
            >
              <span>
                {e}
                {e === principal ? (
                  <span className="ml-2 rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                    Principal
                  </span>
                ) : null}
              </span>
              {canManage && e !== principal ? (
                <button
                  type="button"
                  onClick={() => remove(e)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Retirer
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-[#6b6258]">
        En production, cette logique sera appliquée côté serveur avec rôles et audit.
      </p>
    </div>
  );
}
