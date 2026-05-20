import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";

type QuestionRow = RowDataPacket & {
  id: number;
  qcm_id: string;
  prompt: string;
  choices: string | unknown;
  correct_index: number;
  position: number;
};

function parseChoices(raw: string | unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try { return (JSON.parse(raw) as string[]).map(String); } catch { return []; }
  }
  return [];
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ qcmId: string }> },
) {
  try { await requireAdmin(); } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const { qcmId } = await ctx.params;
  const rows = await query<QuestionRow[]>(
    "SELECT id, qcm_id, prompt, choices, correct_index, position FROM qcm_questions WHERE qcm_id = ? ORDER BY position",
    [qcmId],
  );
  return Response.json({
    questions: rows.map((r) => ({
      id: r.id,
      qcmId: r.qcm_id,
      prompt: r.prompt,
      choices: parseChoices(r.choices),
      correctIndex: r.correct_index,
      position: r.position,
    })),
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ qcmId: string }> },
) {
  try { await requireAdmin(); } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const { qcmId } = await ctx.params;

  let payload: { prompt?: string; choices?: string[]; correctIndex?: number };
  try { payload = await req.json(); } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const prompt = (payload.prompt ?? "").trim();
  const choices = Array.isArray(payload.choices) ? payload.choices.map((c) => String(c).trim()).filter(Boolean) : [];
  const correctIndex = typeof payload.correctIndex === "number" ? payload.correctIndex : 0;

  if (!prompt) return Response.json({ error: "Question vide" }, { status: 400 });
  if (choices.length < 2) return Response.json({ error: "Au moins 2 choix requis" }, { status: 400 });
  if (correctIndex < 0 || correctIndex >= choices.length)
    return Response.json({ error: "Index de bonne réponse invalide" }, { status: 400 });

  const [posRow] = await query<Array<RowDataPacket & { maxPos: number | null }>>(
    "SELECT MAX(position) as maxPos FROM qcm_questions WHERE qcm_id = ?",
    [qcmId],
  );
  const nextPos = (posRow?.maxPos ?? -1) + 1;

  await execute(
    "INSERT INTO qcm_questions (qcm_id, prompt, choices, correct_index, position) VALUES (?, ?, ?, ?, ?)",
    [qcmId, prompt, JSON.stringify(choices), correctIndex, nextPos],
  );
  await execute(
    "UPDATE qcm SET question_count = (SELECT COUNT(*) FROM qcm_questions WHERE qcm_id = ?), updated_at = NOW() WHERE id = ?",
    [qcmId, qcmId],
  );

  const rows = await query<QuestionRow[]>(
    "SELECT id, qcm_id, prompt, choices, correct_index, position FROM qcm_questions WHERE qcm_id = ? ORDER BY position",
    [qcmId],
  );
  return Response.json({
    questions: rows.map((r) => ({
      id: r.id, qcmId: r.qcm_id, prompt: r.prompt,
      choices: parseChoices(r.choices), correctIndex: r.correct_index, position: r.position,
    })),
  });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ qcmId: string }> },
) {
  try { await requireAdmin(); } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const { qcmId } = await ctx.params;

  let payload: { id?: number };
  try { payload = await req.json(); } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!payload.id) return Response.json({ error: "id requis" }, { status: 400 });

  await execute("DELETE FROM qcm_questions WHERE id = ? AND qcm_id = ?", [payload.id, qcmId]);
  await execute(
    "UPDATE qcm SET question_count = (SELECT COUNT(*) FROM qcm_questions WHERE qcm_id = ?), updated_at = NOW() WHERE id = ?",
    [qcmId, qcmId],
  );
  return Response.json({ ok: true });
}
