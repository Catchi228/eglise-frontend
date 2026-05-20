/**
 * POST  /api/admin/qcm  — crée un QCM sans toucher aux autres ni à leurs questions.
 * GET   /api/admin/qcm  — liste tous les QCMs (pour le cache admin).
 */
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";

type QcmRow = RowDataPacket & {
  id: string;
  course_id: string;
  title: string;
  question_count: number;
  updated_at: Date;
};

async function fetchAll() {
  const rows = await query<QcmRow[]>(
    "SELECT id, course_id, title, question_count, updated_at FROM qcm ORDER BY updated_at DESC",
  );
  return rows.map((r) => ({
    id: r.id,
    courseId: r.course_id,
    title: r.title,
    questionCount: r.question_count,
    updatedAt: new Date(r.updated_at).toISOString(),
  }));
}

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  return Response.json({ qcm: await fetchAll() });
}

export async function POST(req: Request) {
  try { await requireAdmin(); } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  let payload: { id?: string; courseId?: string; title?: string };
  try { payload = await req.json(); } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const id      = payload.id?.trim() ?? `qcm-${Date.now()}`;
  const courseId = payload.courseId?.trim() ?? "";
  const title   = payload.title?.trim() ?? "";

  if (!courseId || !title) {
    return Response.json({ error: "courseId et title requis" }, { status: 400 });
  }

  await execute(
    `INSERT INTO qcm (id, course_id, title, question_count, updated_at)
     VALUES (?, ?, ?, 0, NOW())
     ON DUPLICATE KEY UPDATE title = VALUES(title), updated_at = NOW()`,
    [id, courseId, title],
  );

  await execute(
    "INSERT INTO activity (type, label, ts) VALUES ('qcm', ?, ?)",
    [`QCM créé : ${title}`, Date.now()],
  );

  return Response.json({ qcm: await fetchAll() });
}
