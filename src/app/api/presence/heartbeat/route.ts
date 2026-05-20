import { getCurrentUser } from "@/lib/auth";
import { execute } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Non authentifié" }, { status: 401 });
  }

  const email = user.email;
  const role = user.role;

  const now = Date.now();
  await execute(
    `INSERT INTO presence (email, role, last_seen) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), last_seen = VALUES(last_seen)`,
    [email, role, now],
  );

  return Response.json({ ok: true });
}
