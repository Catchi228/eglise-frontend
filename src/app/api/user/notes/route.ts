import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";

type NoteRow = RowDataPacket & {
  course_id: string;
  body: string;
  updated_at: Date;
};

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await query<NoteRow[]>(
      "SELECT course_id, body, updated_at FROM user_notes WHERE user_id = ? ORDER BY updated_at DESC",
      [user.id],
    );
    return Response.json({
      notes: rows.map((r) => ({
        courseId: r.course_id,
        body: r.body,
        updatedAt: new Date(r.updated_at).toISOString(),
      })),
    });
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();

    let payload: { courseId?: unknown; body?: unknown };
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "JSON invalide" }, { status: 400 });
    }

    const courseId = typeof payload.courseId === "string" ? payload.courseId.trim() : "";
    const body = sanitizeText(String(payload.body ?? ""));
    if (!courseId) {
      return Response.json({ error: "courseId requis" }, { status: 400 });
    }

    await execute(
      `INSERT INTO user_notes (user_id, course_id, body) VALUES (?, ?, ?)
       ON CONFLICT (user_id, course_id) DO UPDATE SET body = EXCLUDED.body, updated_at = NOW()`,
      [user.id, courseId, body],
    );

    return Response.json({ ok: true });
  } catch (e) {
    const sec = securityErrorResponse(e);
    if (sec) return sec;
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
}
