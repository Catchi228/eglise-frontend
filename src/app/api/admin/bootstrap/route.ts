import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { loadAdminBootstrap } from "@/lib/server/adminBootstrapData";

/** Toutes les données admin en un seul aller-retour (DB en parallèle côté serveur). */
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }

  const payload = await loadAdminBootstrap();
  return Response.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
