// Email de l'administrateur principal (référent). Lecture publique côté front.
// Écriture limitée : seulement si aucun référent n'est défini.

import { execute, query, type RowDataPacket } from "@/lib/db";

const KEY = "principal_email";

type Row = RowDataPacket & { value: string };

async function readEmail(): Promise<string | null> {
  const rows = await query<Row[]>("SELECT value FROM settings WHERE `key` = ? LIMIT 1", [KEY]);
  return rows[0]?.value ?? null;
}

export async function GET() {
  const email = await readEmail();
  return Response.json({ email });
}

export async function POST(req: Request) {
  let payload: { email?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }

  const current = await readEmail();
  if (current) {
    return Response.json({ email: current });
  }
  await execute(
    `INSERT INTO settings (\`key\`, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [KEY, email],
  );
  return Response.json({ email });
}
