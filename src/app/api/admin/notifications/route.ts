import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";

type NotifRow = RowDataPacket & {
  id: number;
  text: string;
  is_read: number;
  ts: number;
};

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const rows = await query<NotifRow[]>(
    "SELECT id, text, is_read, ts FROM notifications ORDER BY ts DESC LIMIT 30",
  );
  return Response.json({
    notifications: rows.map((r) => ({
      id: `n-${r.id}`,
      text: r.text,
      read: Boolean(r.is_read),
      ts: Number(r.ts),
    })),
  });
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  let payload: { id?: unknown; markAllRead?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (payload.markAllRead === true) {
    await execute("UPDATE notifications SET is_read = 1 WHERE is_read = 0");
    return Response.json({ ok: true });
  }
  const idStr = typeof payload.id === "string" ? payload.id : "";
  const numeric = idStr.startsWith("n-") ? Number(idStr.slice(2)) : Number(idStr);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return Response.json({ error: "id invalide" }, { status: 400 });
  }
  await execute("UPDATE notifications SET is_read = 1 WHERE id = ?", [numeric]);
  return Response.json({ ok: true });
}
