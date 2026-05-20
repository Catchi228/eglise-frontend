import { authErrorResponse, findUserByEmail, requireUser, verifyPassword } from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";

export async function POST(req: Request) {
  let me;
  try {
    me = await requireUser();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  let payload: { newEmail?: unknown; password?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const newEmail =
    typeof payload.newEmail === "string" ? payload.newEmail.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!password) {
    return Response.json({ error: "Mot de passe requis" }, { status: 400 });
  }

  const rows = await query<(RowDataPacket & { password_hash: string })[]>(
    "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
    [me.id],
  );
  const row = rows[0];
  if (!row) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return Response.json({ error: "Mot de passe incorrect" }, { status: 400 });

  if (newEmail !== me.email) {
    const conflict = await findUserByEmail(newEmail);
    if (conflict) return Response.json({ error: "Email déjà utilisé" }, { status: 409 });
    await execute("UPDATE users SET email = ? WHERE id = ?", [newEmail, me.id]);
  }

  return Response.json({ ok: true, email: newEmail });
}
