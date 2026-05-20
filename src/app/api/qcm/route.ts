import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, getPool, query, type RowDataPacket } from "@/lib/db";

type AdminQcmEntry = {
  id: string;
  courseId: string;
  title: string;
  questionCount: number;
  updatedAt: string;
};

type QcmRow = RowDataPacket & {
  id: string;
  course_id: string;
  title: string;
  question_count: number;
  updated_at: Date;
};

async function fetchAll(): Promise<AdminQcmEntry[]> {
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
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const qcm = await fetchAll();
  return Response.json({ qcm });
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  let payload: { list?: AdminQcmEntry[] };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  const list = Array.isArray(payload.list) ? payload.list : null;
  if (!list) return Response.json({ error: "Liste requise" }, { status: 400 });

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM qcm");
    for (const q of list) {
      await conn.execute(
        `INSERT INTO qcm (id, course_id, title, question_count, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          q.id,
          q.courseId,
          q.title,
          q.questionCount ?? 0,
          new Date(q.updatedAt || Date.now()),
        ],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  await execute(
    "INSERT INTO activity (type, label, ts) VALUES ('qcm', 'QCM enregistrés', ?)",
    [Date.now()],
  );

  const refreshed = await fetchAll();
  return Response.json({ qcm: refreshed });
}
