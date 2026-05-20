import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";

const MAX_BYTES = 20_000_000;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
  } catch (e) {
    const sec = securityErrorResponse(e);
    if (sec) return sec;
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
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "PDF attendu" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `Fichier trop volumineux (max ${MAX_BYTES} octets)` },
      { status: 400 },
    );
  }

  const path = await saveUpload(file, "courses");
  return Response.json({ path, name: file.name });
}
