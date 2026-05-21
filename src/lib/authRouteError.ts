import "server-only";

/** Erreur JSON pour les routes d'authentification (évite le message générique côté client). */
export function authRouteError(err: unknown): Response {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[auth]", err);

  if (msg.includes("DATABASE_URL")) {
    return Response.json(
      { error: "Base de données non configurée sur le serveur (DATABASE_URL)." },
      { status: 503 },
    );
  }
  if (msg.includes("SESSION_SECRET")) {
    return Response.json(
      { error: "Session non configurée sur le serveur (SESSION_SECRET)." },
      { status: 503 },
    );
  }

  return Response.json(
    { error: "Erreur serveur. Réessayez dans un instant." },
    { status: 500 },
  );
}

export function isServerConfigured(): { db: boolean; session: boolean } {
  const session = Boolean(process.env.SESSION_SECRET?.trim() && process.env.SESSION_SECRET.length >= 32);
  const db = Boolean(process.env.DATABASE_URL?.trim());
  return { db, session };
}
