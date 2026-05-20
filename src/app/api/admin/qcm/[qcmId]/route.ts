/**
 * DELETE /api/admin/qcm/[qcmId] — supprime un seul QCM (+ ses questions via CASCADE).
 * PATCH  /api/admin/qcm/[qcmId] — met à jour le titre d'un QCM.
 */
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ qcmId: string }> },
) {
  try { await requireAdmin(); } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  const { qcmId } = await ctx.params;
  await execute("DELETE FROM qcm WHERE id = ?", [qcmId]);

  const rows = await query<Array<RowDataPacket & {
    id: string; course_id: string; title: string;
    question_count: number; updated_at: Date;
  }>>("SELECT id, course_id, title, question_count, updated_at FROM qcm ORDER BY updated_at DESC");

  return Response.json({
    qcm: rows.map((r) => ({
      id: r.id, courseId: r.course_id, title: r.title,
      questionCount: r.question_count,
      updatedAt: new Date(r.updated_at).toISOString(),
    })),
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ qcmId: string }> },
) {
  try { await requireAdmin(); } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  const { qcmId } = await ctx.params;
  let payload: { title?: string };
  try { payload = await req.json(); } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const title = payload.title?.trim() ?? "";
  if (!title) return Response.json({ error: "Titre vide" }, { status: 400 });

  await execute("UPDATE qcm SET title = ?, updated_at = NOW() WHERE id = ?", [title, qcmId]);
  return Response.json({ ok: true });
}
