import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, getPool, query, type RowDataPacket } from "@/lib/db";
import { fetchAnnouncementsFromDb } from "@/lib/server/siteContent";
import { deleteUpload } from "@/lib/uploads";
import type { Announcement } from "@/lib/types";

type ImageRow = RowDataPacket & {
  announcement_id: string;
  path: string;
  position: number;
};

export async function GET() {
  const announcements = await fetchAnnouncementsFromDb();
  return Response.json(
    { announcements },
    {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120",
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

  let payload: { list?: Announcement[] };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  const list = Array.isArray(payload.list) ? payload.list : null;
  if (!list) return Response.json({ error: "Liste requise" }, { status: 400 });

  const existing = await query<ImageRow[]>(
    "SELECT announcement_id, path, position FROM announcement_images",
  );
  const newPaths = new Set<string>();
  for (const a of list) {
    const urls = collectImages(a);
    for (const u of urls) newPaths.add(u);
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM announcement_images");
    await conn.query("DELETE FROM announcements");

    for (const a of list) {
      await conn.execute(
        `INSERT INTO announcements
           (id, category, status, title, body, city, start_at, end_at, contact_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.category,
          a.status,
          a.title,
          a.body,
          a.city ?? null,
          a.startAt ?? null,
          a.endAt ?? null,
          a.contactEmail ?? null,
        ],
      );
      const urls = collectImages(a);
      let pos = 0;
      for (const url of urls) {
        await conn.execute(
          "INSERT INTO announcement_images (announcement_id, path, position) VALUES (?, ?, ?)",
          [a.id, url, pos++],
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

  for (const old of existing) {
    if (old.path.startsWith("/uploads/") && !newPaths.has(old.path)) {
      await deleteUpload(old.path);
    }
  }

  await execute(
    "INSERT INTO activity (type, label, ts) VALUES ('annonces', 'Annonces enregistrées', ?)",
    [Date.now()],
  );
  await execute(
    "INSERT INTO notifications (text, is_read, ts) VALUES ('Annonces mises à jour.', 0, ?)",
    [Date.now()],
  );

  const refreshed = await fetchAnnouncementsFromDb();
  return Response.json({ announcements: refreshed });
}

function collectImages(a: Announcement): string[] {
  const arr: string[] = [];
  if (a.imageUrls?.length) arr.push(...a.imageUrls);
  if (a.imageUrl && !arr.includes(a.imageUrl)) arr.push(a.imageUrl);
  return arr.filter(Boolean);
}
