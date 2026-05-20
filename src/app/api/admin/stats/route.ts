import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { query, type RowDataPacket } from "@/lib/db";

const ACTIVE_MS = 2 * 60 * 1000;

type PresenceRow = RowDataPacket & {
  email: string;
  role: "USER" | "ADMIN";
  last_seen: number;
};

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const now = Date.now();
  const since = now - ACTIVE_MS;
  const rows = await query<PresenceRow[]>(
    "SELECT email, role, last_seen FROM presence WHERE last_seen >= ? ORDER BY last_seen DESC LIMIT 30",
    [since],
  );
  const counts = rows.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.role] += 1;
      return acc;
    },
    { total: 0, USER: 0, ADMIN: 0 },
  );
  return Response.json({
    activeWindowMs: ACTIVE_MS,
    counts,
    recent: rows.map((r) => ({
      email: r.email,
      role: r.role,
      lastSeen: Number(r.last_seen),
    })),
  });
}
