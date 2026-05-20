import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { query, type RowDataPacket } from "@/lib/db";

type ActivityRow = RowDataPacket & {
  id: number;
  type: string;
  label: string;
  ts: number;
};

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const rows = await query<ActivityRow[]>(
    "SELECT id, type, label, ts FROM activity ORDER BY ts DESC LIMIT 40",
  );
  return Response.json({
    activity: rows.map((r) => ({
      id: `a-${r.id}`,
      type: r.type,
      label: r.label,
      ts: Number(r.ts),
    })),
  });
}
