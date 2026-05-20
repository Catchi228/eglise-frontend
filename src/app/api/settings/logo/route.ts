import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { execute, query, type RowDataPacket } from "@/lib/db";
import { deleteUpload, saveUpload } from "@/lib/uploads";

const KEY = "site_logo_path";

type Row = RowDataPacket & { value: string };

async function readPath(): Promise<string | null> {
  const rows = await query<Row[]>("SELECT value FROM settings WHERE `key` = ? LIMIT 1", [KEY]);
  return rows[0]?.value ?? null;
}

async function writePath(value: string | null): Promise<void> {
  if (value === null) {
    await execute("DELETE FROM settings WHERE `key` = ?", [KEY]);
  } else {
    await execute(
      `INSERT INTO settings (\`key\`, value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [KEY, value],
    );
  }
}

export async function GET() {
  const path = await readPath();
  return Response.json({ path });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Multipart attendu" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Image attendue" }, { status: 400 });
  }

  const previous = await readPath();
  const path = await saveUpload(file, "logo");
  await writePath(path);
  if (previous && previous.startsWith("/uploads/")) {
    await deleteUpload(previous);
  }

  return Response.json({ path });
}

export async function DELETE() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  const previous = await readPath();
  await writePath(null);
  if (previous && previous.startsWith("/uploads/")) {
    await deleteUpload(previous);
  }
  return Response.json({ ok: true });
}
