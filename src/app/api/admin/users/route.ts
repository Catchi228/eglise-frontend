import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { query, type RowDataPacket } from "@/lib/db";

type UserRow = RowDataPacket & {
  email: string;
  role: "USER" | "ADMIN";
  is_principal: number;
  created_at: Date;
};

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const rows = await query<UserRow[]>(
    "SELECT email, role, is_principal, created_at FROM users ORDER BY created_at DESC",
  );
  return Response.json({
    users: rows.map((r) => ({
      email: r.email,
      role: r.role,
      isPrincipal: Boolean(r.is_principal),
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
}
