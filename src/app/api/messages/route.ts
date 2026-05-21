import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import { authErrorResponse, getCurrentUser, requireAdmin } from "@/lib/auth";
import { execute, getPool, query, type RowDataPacket } from "@/lib/db";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

type AdminMessage = {
  id: string;
  from: string;
  subject: string;
  body: string;
  status: "nouveau" | "lu" | "répondu";
  createdAt: string;
  courseRef?: string;
};

type MessageRow = RowDataPacket & {
  id: string;
  from_email: string;
  subject: string;
  body: string;
  status: "nouveau" | "lu" | "répondu";
  course_ref: string | null;
  created_at: Date;
};

async function fetchAll(): Promise<AdminMessage[]> {
  const rows = await query<MessageRow[]>(
    "SELECT id, from_email, subject, body, status, course_ref, created_at FROM messages ORDER BY created_at DESC",
  );
  return rows.map((r) => ({
    id: r.id,
    from: r.from_email,
    subject: r.subject,
    body: r.body,
    status: r.status,
    courseRef: r.course_ref ?? undefined,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const messages = await fetchAll();
  return Response.json({ messages });
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  let payload: { list?: AdminMessage[] };
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
    await conn.query("DELETE FROM messages");
    for (const m of list) {
      await conn.execute(
        `INSERT INTO messages (id, from_email, subject, body, status, course_ref, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          m.from,
          m.subject,
          m.body,
          m.status,
          m.courseRef ?? null,
          new Date(m.createdAt || Date.now()),
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
    "INSERT INTO activity (type, label, ts) VALUES ('messages', 'Messages mis à jour', ?)",
    [Date.now()],
  );

  const messages = await fetchAll();
  return Response.json({ messages });
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch (e) {
    return securityErrorResponse(e) ?? Response.json({ error: "Refusé" }, { status: 403 });
  }

  const user = await getCurrentUser();
  let payload: { from?: unknown; subject?: unknown; body?: unknown; courseRef?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  const from = user
    ? user.email
    : sanitizeEmail(typeof payload.from === "string" ? payload.from : "");
  const subject = sanitizeText(typeof payload.subject === "string" ? payload.subject : "", 255);
  const body = sanitizeText(typeof payload.body === "string" ? payload.body : "");
  const courseRef = typeof payload.courseRef === "string" ? payload.courseRef : null;

  if (!from || !subject || !body) {
    return Response.json({ error: "from, subject, body requis" }, { status: 400 });
  }

  const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await execute(
    `INSERT INTO messages (id, from_email, subject, body, status, course_ref, created_at)
     VALUES (?, ?, ?, ?, 'nouveau', ?, NOW())`,
    [id, from, subject, body, courseRef],
  );

  await execute(
    "INSERT INTO notifications (text, is_read, ts) VALUES (?, FALSE, ?)",
    [`Nouveau message: ${subject}`, Date.now()],
  );

  return Response.json({ ok: true, id });
}
