"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, RefreshCw, Trash2, Wand2 } from "lucide-react";
import { readCourses, refreshAdminData } from "@/lib/adminData";

type AdminQcmEntry = {
  id: string; courseId: string; title: string;
  questionCount: number; updatedAt: string;
};

type Question = {
  id: number; qcmId: string; prompt: string;
  choices: string[]; correctIndex: number; position: number;
};

const DIFFICULTIES = ["Facile", "Moyen", "Difficile"] as const;

// ── Éditeur de questions ─────────────────────────────────────────────────────

function QuestionEditor({
  qcmId,
  onCountChange,
}: {
  qcmId: string;
  onCountChange: (n: number) => void;
}) {
  const onCountRef = useRef(onCountChange);
  useEffect(() => { onCountRef.current = onCountChange; }, [onCountChange]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [addError, setAddError]   = useState<string | null>(null);
  const [prompt, setPrompt]       = useState("");
  const [choices, setChoices]     = useState(["", "", "", ""]);
  const [correct, setCorrect]     = useState(0);
  const [genCount, setGenCount]   = useState("5");
  const [genDiff, setGenDiff]     = useState<typeof DIFFICULTIES[number]>("Moyen");
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/qcm/${qcmId}/questions`, {
        credentials: "same-origin", cache: "no-store",
      });
      if (!r.ok) return;
      const d = (await r.json()) as { questions: Question[] };
      const qs = d.questions ?? [];
      setQuestions(qs);
      onCountRef.current(qs.length);
    } catch { /* réseau indisponible */ }
    finally { setLoading(false); }
  }, [qcmId]);

  useEffect(() => { void load(); }, [load]);

  async function addQuestion() {
    setAddError(null);
    const p = prompt.trim();
    const c = choices.map((x) => x.trim()).filter(Boolean);
    if (!p) return setAddError("La question est vide.");
    if (c.length < 2) return setAddError("Ajoutez au moins 2 choix.");
    if (correct < 0 || correct >= c.length) return setAddError("Sélectionnez la bonne réponse.");
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/qcm/${qcmId}/questions`, {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p, choices: c, correctIndex: correct }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        setAddError(d.error ?? "Erreur lors de l'ajout.");
        return;
      }
      setPrompt(""); setChoices(["", "", "", ""]); setCorrect(0);
      await load();
    } catch { setAddError("Erreur réseau."); }
    finally { setSaving(false); }
  }

  async function removeQuestion(id: number) {
    await fetch(`/api/admin/qcm/${qcmId}/questions`, {
      method: "DELETE", credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function generate() {
    setGenerating(true); setGenMsg(null);
    try {
      const r = await fetch("/api/admin/qcm/generate", {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qcmId, count: Number(genCount), difficulty: genDiff }),
      });
      const d = (await r.json()) as { generated?: number; source?: string; error?: string };
      if (!r.ok) { setGenMsg(`Erreur : ${d.error ?? "inconnue"}`); return; }
      setGenMsg(`${d.generated} question(s) générée(s) (${d.source === "openai" ? "IA GPT" : "modèles"}).`);
      await load();
    } catch { setGenMsg("Erreur réseau."); }
    finally { setGenerating(false); }
  }

  return (
    <div className="mt-4 space-y-5">
      {/* Liste questions */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[#6b6258]">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-[#c8b89a] border-t-[#7a6849]" />
          Chargement des questions…
        </div>
      ) : questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d4c9bc] bg-[#faf7f2]/60 px-4 py-3 text-xs text-[#7a7268]">
          Aucune question. Ajoutez-en manuellement ou générez automatiquement.
        </p>
      ) : (
        <ol className="space-y-2">
          {questions.map((q, i) => (
            <li key={q.id} className="overflow-hidden rounded-xl border border-[#e0d6ca]/80 bg-[#faf7f2]/80">
              <div className="flex items-start justify-between gap-2 px-3 pt-3">
                <p className="text-sm font-medium text-[#1f1c18]">
                  <span className="mr-2 text-xs font-bold text-[#8a7762]">Q{i + 1}.</span>
                  {q.prompt}
                </p>
                <button
                  type="button"
                  onClick={() => void removeQuestion(q.id)}
                  className="shrink-0 rounded-lg p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                  aria-label="Supprimer la question"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="mt-2 grid grid-cols-1 gap-1.5 p-3 pt-1 sm:grid-cols-2">
                {q.choices.map((c, ci) => (
                  <li key={ci} className={`rounded-lg px-2.5 py-1.5 text-xs ${
                    ci === q.correctIndex
                      ? "bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-[#ebe4d8]/50 text-[#5c544a]"
                  }`}>
                    {ci === q.correctIndex ? "✓ " : ""}{c}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {/* Ajout manuel */}
      <div className="rounded-xl border border-[#d9cfc3]/70 bg-white/90 p-4 shadow-sm">
        <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5c544a]">
          <Plus className="h-3.5 w-3.5" /> Ajouter une question
        </h4>
        <label className="block text-xs font-medium text-[#6b6258]">
          Question
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822] placeholder:text-[#b0a898] focus:outline-none focus:ring-1 focus:ring-slate-400"
            placeholder="Ex. : Quel verset illustre cette leçon ?"
          />
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {choices.map((c, i) => (
            <label key={i} className="text-xs font-medium text-[#6b6258]">
              <span className="mb-1 flex items-center gap-1.5">
                <input
                  type="radio"
                  name={`correct-${qcmId}`}
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  className="accent-emerald-600"
                />
                Choix {i + 1}
                {correct === i && (
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600 ring-1 ring-emerald-200">
                    bonne réponse
                  </span>
                )}
              </span>
              <input
                value={c}
                onChange={(e) => {
                  const n = [...choices]; n[i] = e.target.value; setChoices(n);
                }}
                className="w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822] focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder={`Choix ${i + 1}…`}
              />
            </label>
          ))}
        </div>
        {addError && <p className="mt-2 text-xs font-medium text-rose-600">{addError}</p>}
        <button
          type="button"
          onClick={() => void addQuestion()}
          disabled={saving}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {saving
            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />
            : <Plus className="h-3.5 w-3.5" />}
          Ajouter
        </button>
      </div>

      {/* Génération automatique */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
          <Wand2 className="h-3.5 w-3.5" /> Génération automatique
        </h4>
        <p className="mb-3 text-xs text-amber-800/80">
          Génère des questions depuis le contenu du cours.
          Ajoutez{" "}
          <code className="rounded bg-amber-100 px-1 text-[10px] font-mono">OPENAI_API_KEY</code>
          {" "}dans{" "}
          <code className="rounded bg-amber-100 px-1 text-[10px] font-mono">.env.local</code>
          {" "}pour la génération par IA.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-amber-900">
            Nombre
            <input
              type="number" min={1} max={20} value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
              className="mt-1 w-20 rounded-xl border border-amber-200/80 bg-white px-3 py-2 text-sm text-[#2c2822] focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </label>
          <label className="text-xs font-medium text-amber-900">
            Niveau
            <select
              value={genDiff}
              onChange={(e) => setGenDiff(e.target.value as typeof genDiff)}
              className="mt-1 rounded-xl border border-amber-200/80 bg-white px-3 py-2 text-sm text-[#2c2822] focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void generate()}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-60"
          >
            {generating
              ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />
              : <Wand2 className="h-3.5 w-3.5" />}
            Générer
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200/80 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
        {genMsg && (
          <p className={`mt-2 text-xs font-medium ${genMsg.startsWith("Erreur") ? "text-rose-700" : "text-emerald-700"}`}>
            {genMsg}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function AdminQcmPage() {
  const [qcms, setQcms]           = useState<AdminQcmEntry[]>([]);
  const [courses, setCourses]     = useState<ReturnType<typeof readCourses>>([]);
  const [courseId, setCourseId]   = useState("");
  const [title, setTitle]         = useState("");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [creating, setCreating]   = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadQcms = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/qcm", { credentials: "same-origin", cache: "no-store" });
      if (!r.ok) { setLoadError("Impossible de charger les QCMs."); return; }
      const d = (await r.json()) as { qcm: AdminQcmEntry[] };
      setQcms(d.qcm ?? []);
      setLoadError(null);
    } catch { setLoadError("Erreur réseau. Réessayez."); }
    finally { setPageLoading(false); }
  }, []);

  // Charge les données admin (cours + QCMs) au montage
  useEffect(() => {
    void (async () => {
      await refreshAdminData();
      setCourses(readCourses());
      await loadQcms();
    })();
  }, [loadQcms]);

  // Resync sur événements
  useEffect(() => {
    const sync = () => {
      setCourses(readCourses());
      void loadQcms();
    };
    window.addEventListener("eglise:admin-data", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("eglise:admin-data", sync);
      window.removeEventListener("storage", sync);
    };
  }, [loadQcms]);

  async function addQcm() {
    const c = courseId.trim(); const t = title.trim();
    if (!c || !t) return;
    setCreating(true);
    try {
      const r = await fetch("/api/admin/qcm", {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId: c, title: t }),
      });
      if (!r.ok) return;
      const d = (await r.json()) as { qcm: AdminQcmEntry[] };
      setQcms(d.qcm ?? []);
      setTitle(""); setCourseId("");
      const newest = d.qcm[0];
      if (newest) setExpanded(newest.id);
    } catch { /* ignore */ }
    finally { setCreating(false); }
  }

  async function removeQcm(id: string) {
    if (!confirm("Supprimer ce QCM et toutes ses questions ?")) return;
    try {
      const r = await fetch(`/api/admin/qcm/${id}`, { method: "DELETE", credentials: "same-origin" });
      if (!r.ok) return;
      const d = (await r.json()) as { qcm: AdminQcmEntry[] };
      setQcms(d.qcm ?? []);
      if (expanded === id) setExpanded(null);
    } catch { /* ignore */ }
  }

  function updateCount(id: string, n: number) {
    setQcms((prev) => prev.map((q) => q.id === id ? { ...q, questionCount: n } : q));
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-[#1f1c18]">
            QCM & Quiz
          </h1>
          <p className="mt-1 text-sm text-[#5c544a]">
            Créez un quiz par cours. Ajoutez les questions manuellement ou générez-les automatiquement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadQcms()}
          disabled={pageLoading}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-xs font-semibold text-[#2c2822] hover:bg-[#ebe4d8]/80 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${pageLoading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadQcms()}
            className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-rose-50">
            Réessayer
          </button>
        </div>
      )}

      {/* Créer un QCM */}
      <div className="rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-[#2c2822]">Créer un nouveau QCM</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-medium text-[#6b6258]">
            Cours associé
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822] focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="">Choisir un cours…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-[#6b6258]">
            Titre du quiz
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && courseId && title) void addQcm(); }}
              placeholder="Ex. : Évaluation — Leçon 4"
              className="mt-1 w-full rounded-xl border border-[#cfc4b6]/80 bg-[#faf7f2] px-3 py-2 text-sm text-[#2c2822] focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void addQcm()}
              disabled={!courseId || !title || creating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {creating
                ? <span className="h-4 w-4 animate-spin rounded-full border border-white/30 border-t-white" />
                : <Plus className="h-4 w-4" />}
              Créer le QCM
            </button>
          </div>
        </div>
      </div>

      {/* Liste QCMs */}
      {pageLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#d9cfc3]/70 bg-[#faf7f2]/60 py-12">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#c8b89a] border-t-[#7a6849]" />
          <span className="text-sm text-[#6b6258]">Chargement des QCMs…</span>
        </div>
      ) : qcms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d4c9bc] bg-[#faf7f2]/60 px-5 py-12 text-center">
          <p className="text-sm font-medium text-[#5c544a]">Aucun QCM créé.</p>
          <p className="mt-1 text-xs text-[#7a7268]">Commencez par en créer un ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {qcms.map((q) => {
            const ct     = courses.find((c) => c.id === q.courseId);
            const isOpen = expanded === q.id;
            return (
              <div key={q.id} className="overflow-hidden rounded-2xl border border-[#d9cfc3]/70 bg-[#fffcf8]/95 shadow-sm">
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1f1c18]">{q.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6b6258]">
                      <span className="truncate">{ct?.title ?? q.courseId}</span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${
                        q.questionCount > 0
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}>
                        {q.questionCount} question{q.questionCount !== 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void removeQcm(q.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200/80 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : q.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#cfc4b6]/80 bg-[#ebe4d8]/60 px-3 py-1.5 text-xs font-semibold text-[#2c2822] hover:bg-[#e0d6ca]/80"
                    >
                      {isOpen
                        ? <><ChevronUp className="h-3.5 w-3.5" /> Fermer</>
                        : <><ChevronDown className="h-3.5 w-3.5" /> Gérer les questions</>}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-[#ebe4d8]/80 bg-[#faf7f2]/60 px-5 pb-5">
                    <QuestionEditor
                      qcmId={q.id}
                      onCountChange={(n) => updateCount(q.id, n)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
