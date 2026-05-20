import { authErrorResponse, requireUser } from "@/lib/auth";
import { query, type RowDataPacket } from "@/lib/db";
import type { QcmAttempt } from "@/lib/types";

type AttemptRow = RowDataPacket & {
  id: number;
  qcm_id: string;
  score: number;
  total: number;
  created_at: Date;
  qcm_title: string;
  course_id: string;
};

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await query<AttemptRow[]>(
      `SELECT a.id, a.qcm_id, a.score, a.total, a.created_at, q.title AS qcm_title, q.course_id
         FROM qcm_attempts a
         JOIN qcm q ON q.id = a.qcm_id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT 50`,
      [user.id],
    );

    const attempts: QcmAttempt[] = rows.map((r) => ({
      id: r.id,
      qcmId: r.qcm_id,
      qcmTitle: r.qcm_title,
      courseId: r.course_id,
      score: r.score,
      total: r.total,
      createdAt: new Date(r.created_at).toISOString(),
    }));

    return Response.json({ attempts });
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
}
