import {
  authErrorResponse,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";

export async function POST(req: Request) {
  let me;
  try {
    me = await requireUser();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  let payload: { currentPassword?: unknown; newPassword?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const current = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
  const next = typeof payload.newPassword === "string" ? payload.newPassword : "";

  if (next.length < 6) {
    return Response.json({ error: "Nouveau mot de passe trop court" }, { status: 400 });
  }

  const rows = await query<(RowDataPacket & { password_hash: string })[]>(
    "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
    [me.id],
  );
  const row = rows[0];
  if (!row) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const ok = await verifyPassword(current, row.password_hash);
  if (!ok) return Response.json({ error: "Mot de passe actuel invalide" }, { status: 400 });

  const hash = await hashPassword(next);
  await execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, me.id]);

  return Response.json({ ok: true });
}
