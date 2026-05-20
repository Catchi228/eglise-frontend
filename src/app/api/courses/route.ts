import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import { authErrorResponse, requireAdmin, requireUser } from "@/lib/auth";
import { execute, getPool, query, type RowDataPacket } from "@/lib/db";
import { fetchCoursesFromDb } from "@/lib/server/siteContent";
import { deleteUpload } from "@/lib/uploads";
import type { Course } from "@/lib/types";

type PdfRow = RowDataPacket & {
  id: string;
  course_id: string;
  name: string;
  path: string;
};

export async function GET() {
  try {
    await requireUser();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  const courses = await fetchCoursesFromDb();
  return Response.json(
    { courses },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
  } catch (e) {
    const sec = securityErrorResponse(e);
    if (sec) return sec;
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  let payload: { list?: Course[] };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  const list = Array.isArray(payload.list) ? payload.list : null;
  if (!list) return Response.json({ error: "Liste requise" }, { status: 400 });

  const existingPdfs = await query<PdfRow[]>("SELECT id, course_id, name, path FROM course_pdfs");
  const keptPdfPaths = new Set<string>();
  for (const c of list) {
    for (const p of c.pdfFiles ?? []) keptPdfPaths.add(p.dataUrl);
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM course_pdfs");
    await conn.query("DELETE FROM course_sections");
    await conn.query("DELETE FROM course_tags");
    await conn.query("DELETE FROM courses");

    for (const c of list) {
      await conn.execute(
        `INSERT INTO courses (id, title, description, content, status, start_at, end_at, time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id, c.title, c.description,
          c.content ? JSON.stringify(c.content) : null,
          c.status, c.startAt, c.endAt, c.time,
        ],
      );
      for (const tag of c.tags ?? []) {
        await conn.execute("INSERT INTO course_tags (course_id, tag) VALUES (?, ?)", [c.id, tag]);
      }
      let pos = 0;
      for (const s of c.sections ?? []) {
        await conn.execute(
          `INSERT INTO course_sections (id, course_id, title, duration_min, position)
           VALUES (?, ?, ?, ?, ?)`,
          [s.id, c.id, s.title, s.durationMin, pos++],
        );
      }
      for (const p of c.pdfFiles ?? []) {
        await conn.execute(
          "INSERT INTO course_pdfs (id, course_id, name, path) VALUES (?, ?, ?, ?)",
          [p.id, c.id, p.name, p.dataUrl],
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  for (const old of existingPdfs) {
    if (old.path.startsWith("/uploads/") && !keptPdfPaths.has(old.path)) {
      await deleteUpload(old.path);
    }
  }

  await execute(
    "INSERT INTO activity (type, label, ts) VALUES ('cours', 'Cours enregistrés', ?)",
    [Date.now()],
  );
  await execute(
    "INSERT INTO notifications (text, is_read, ts) VALUES ('Cours mis à jour.', 0, ?)",
    [Date.now()],
  );

  const refreshed = await fetchCoursesFromDb();
  return Response.json({ courses: refreshed });
}
