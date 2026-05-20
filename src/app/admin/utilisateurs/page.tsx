"use client";

import { useEffect, useState } from "react";

type AdminUserRow = {
  email: string;
  role: "USER" | "ADMIN";
  isPrincipal: boolean;
  createdAt: string;
};

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/users", { cache: "no-store" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Erreur");
      const data = await r.json();
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const onData = () => void load();
    window.addEventListener("eglise:admin-data", onData);
    return () => window.removeEventListener("eglise:admin-data", onData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#1f1c18]">
          Utilisateurs
        </h1>
        <p className="mt-1 text-sm text-[#5c544a]">
          Comptes enregistrés dans la base de données.
        </p>
      </div>

      <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-[#6b6258]">Chargement…</p>
        ) : error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-[#6b6258]">Aucun utilisateur enregistré.</p>
        ) : (
          <ul className="divide-y divide-[#ebe4d8]/90">
            {users.map((u) => (
              <li key={u.email} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="font-medium text-[#2c2822]">{u.email}</span>
                <span className="flex items-center gap-2 text-xs">
                  {u.isPrincipal ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                      Principal
                    </span>
                  ) : null}
                  <span
                    className={
                      u.role === "ADMIN"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800"
                        : "rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700"
                    }
                  >
                    {u.role}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
