import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import { execute } from "@/lib/db";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch (e) {
    return securityErrorResponse(e) ?? Response.json({ error: "Refusé" }, { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const title = sanitizeText(String(payload.title ?? ""), 255);
  const body = sanitizeText(String(payload.body ?? ""));
  const city = sanitizeText(String(payload.city ?? ""), 120);
  const category = payload.category;
  const startAt = sanitizeText(String(payload.startAt ?? ""), 20) || null;
  const endAt = sanitizeText(String(payload.endAt ?? ""), 20) || null;
  const contactEmail = payload.contactEmail
    ? sanitizeEmail(String(payload.contactEmail))
    : null;
  const contactPhone = sanitizeText(String(payload.contactPhone ?? ""), 20) || null;

  if (!title || !body || !city) {
    return Response.json({ error: "Titre, description et ville requis" }, { status: 400 });
  }
  if (!contactEmail && !contactPhone) {
    return Response.json({ error: "Email ou téléphone requis" }, { status: 400 });
  }
  if (
    category !== "Événement" &&
    category !== "Recherche" &&
    category !== "Autre"
  ) {
    return Response.json({ error: "Catégorie invalide" }, { status: 400 });
  }

  const id = `ar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await execute(
    `INSERT INTO announcement_requests
       (id, category, title, body, city, start_at, end_at, contact_email, contact_phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, category, title, body, city, startAt, endAt, contactEmail, contactPhone],
  );

  await execute(
    "INSERT INTO notifications (text, is_read, ts) VALUES (?, FALSE, ?)",
    [`Nouvelle demande d'annonce: ${title}`, Date.now()],
  );

  return Response.json({ ok: true, id });
}
