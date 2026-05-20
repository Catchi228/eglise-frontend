"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminMessage } from "@/lib/adminData";
import { readMessages, writeMessages } from "@/lib/adminData";

export default function AdminMessagesPage() {
  const [list, setList] = useState<AdminMessage[]>([]);
  const [selected, setSelected] = useState<AdminMessage | null>(null);
  const [reply, setReply] = useState("");

  const reload = useCallback(() => setList(readMessages()), []);

  useEffect(() => {
    reload();
    const on = () => reload();
    window.addEventListener("eglise:admin-data", on);
    return () => window.removeEventListener("eglise:admin-data", on);
  }, [reload]);

  async function persist(next: AdminMessage[]) {
    await writeMessages(next);
    setList(readMessages());
    if (selected) {
      const u = next.find((m) => m.id === selected.id);
      setSelected(u ?? null);
    }
  }

  function markRead(m: AdminMessage) {
    const fresh = readMessages();
    void persist(
      fresh.map((x) => (x.id === m.id ? { ...x, status: "lu" as const } : x)),
    );
  }

  function sendReply() {
    if (!selected || !reply.trim()) return;
    const fresh = readMessages();
    void persist(
      fresh.map((x) =>
        x.id === selected.id
          ? {
              ...x,
              status: "répondu" as const,
              body: `${x.body}\n\n--- Réponse ---\n${reply.trim()}`,
            }
          : x,
      ),
    );
    setReply("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#1f1c18]">
          Messages
        </h1>
        <p className="mt-1 text-sm text-[#5c544a]">
          Boîte de réception (démo). Marquez comme lu et rédigez une réponse interne.
        </p>
        <ul className="mt-4 space-y-2">
          {list.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(m);
                  if (m.status === "nouveau") markRead(m);
                }}
                className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                  selected?.id === m.id
                    ? "border-amber-400/70 bg-amber-50/90"
                    : "border-[#e0d6ca]/90 bg-[#fffcf8]/95 hover:bg-[#faf7f2]"
                }`}
              >
                <span className="font-medium text-[#2c2822]">{m.subject}</span>
                <span className="mt-1 block text-xs text-[#6b6258]">{m.from}</span>
                <span className="mt-1 inline-block rounded-full bg-[#ebe4d8]/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#5c544a]">
                  {m.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-5 shadow-sm">
        {selected ? (
          <>
            <h2 className="font-semibold text-[#2c2822]">{selected.subject}</h2>
            <p className="mt-2 text-xs text-[#6b6258]">{selected.from}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#3d3830]">
              {selected.body}
            </p>
            <label className="mt-6 block text-xs font-semibold text-[#6b6258]">
              Réponse (ajoutée au fil de discussion)
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822]"
                placeholder="Votre message…"
              />
            </label>
            <button
              type="button"
              onClick={sendReply}
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Enregistrer la réponse
            </button>
          </>
        ) : (
          <p className="text-sm text-[#6b6258]">Sélectionnez un message.</p>
        )}
      </div>
    </div>
  );
}
