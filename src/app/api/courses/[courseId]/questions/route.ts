import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import {
  authErrorResponse,
  getCurrentUser,
  requireUser,
} from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import type { CourseQuestion } from "@/lib/types";

type MessageRow = RowDataPacket & {
  id: string;
  from_email: string;
  body: string;
  status: "nouveau" | "lu" | "répondu";
  created_at: Date;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  try {
    await requireUser();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  const { courseId } = await ctx.params;
  const rows = await query<MessageRow[]>(
    `SELECT id, from_email, body, status, created_at FROM messages
      WHERE course_ref = ? AND subject LIKE 'Question cours:%'
      ORDER BY created_at DESC`,
    [courseId],
  );

  const questions: CourseQuestion[] = rows.map((r) => ({
    id: r.id,
    from: r.from_email,
    body: r.body,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    answer: r.status === "répondu" ? "Réponse disponible dans votre espace." : undefined,
  }));

  return Response.json({ questions });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const { courseId } = await ctx.params;

    let payload: { body?: unknown };
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "JSON invalide" }, { status: 400 });
    }

    const body = sanitizeText(String(payload.body ?? ""));
    if (!body) {
      return Response.json({ error: "Question vide" }, { status: 400 });
    }

    const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await execute(
      `INSERT INTO messages (id, from_email, subject, body, status, course_ref, created_at)
       VALUES (?, ?, ?, ?, 'nouveau', ?, NOW())`,
      [id, user.email, `Question cours: ${courseId}`, body, courseId],
    );

    await execute(
      "INSERT INTO notifications (text, is_read, ts) VALUES (?, FALSE, ?)",
      [`Nouvelle question sur le cours ${courseId}`, Date.now()],
    );

    return Response.json({ ok: true, id });
  } catch (e) {
    const sec = securityErrorResponse(e);
    if (sec) return sec;
    const auth = authErrorResponse(e);
    if (auth) return auth;
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
