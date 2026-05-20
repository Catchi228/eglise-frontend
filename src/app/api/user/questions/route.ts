import { authErrorResponse, requireUser } from "@/lib/auth";
import { query, type RowDataPacket } from "@/lib/db";

type Row = RowDataPacket & {
  id: string;
  body: string;
  status: "nouveau" | "lu" | "répondu";
  course_ref: string | null;
  created_at: Date;
};

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await query<Row[]>(
      `SELECT id, body, status, course_ref, created_at FROM messages
        WHERE from_email = ? AND subject LIKE 'Question cours:%'
        ORDER BY created_at DESC`,
      [user.email],
    );
    return Response.json({
      questions: rows.map((r) => ({
        id: r.id,
        body: r.body,
        status: r.status,
        courseId: r.course_ref,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    });
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
}
