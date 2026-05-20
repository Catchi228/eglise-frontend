// Liste des emails ayant le rôle ADMIN.
// PUT remplace la liste (seul l'admin principal peut faire cette opération).
// Un email présent dans la liste mais inexistant dans users est ignoré.

import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, getPool, query, type RowDataPacket } from "@/lib/db";

type EmailRow = RowDataPacket & { email: string };

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const rows = await query<EmailRow[]>(
    "SELECT email FROM users WHERE role = 'ADMIN' ORDER BY email",
  );
  return Response.json({ admins: rows.map((r) => r.email) });
}

export async function PUT(req: Request) {
  let me;
  try {
    me = await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  if (!me.isPrincipal) {
    return Response.json(
      { error: "Seul l'administrateur principal peut modifier cette liste." },
      { status: 403 },
    );
  }

  let payload: { emails?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!Array.isArray(payload.emails)) {
    return Response.json({ error: "emails requis" }, { status: 400 });
  }
  const wanted = new Set(
    payload.emails
      .filter((e): e is string => typeof e === "string")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  wanted.add(me.email);

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Rétrograde tous les non-principaux qui ne sont plus dans la liste.
    await conn.query("UPDATE users SET role = 'USER' WHERE role = 'ADMIN' AND is_principal = 0");
    if (wanted.size > 0) {
      const placeholders = Array.from(wanted).map(() => "?").join(",");
      await conn.query(
        `UPDATE users SET role = 'ADMIN' WHERE email IN (${placeholders})`,
        Array.from(wanted),
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
    "INSERT INTO activity (type, label, ts) VALUES ('admins', 'Liste des administrateurs modifiée', ?)",
    [Date.now()],
  );

  const rows = await query<EmailRow[]>(
    "SELECT email FROM users WHERE role = 'ADMIN' ORDER BY email",
  );
  return Response.json({ admins: rows.map((r) => r.email) });
}
