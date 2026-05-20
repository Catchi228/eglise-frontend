import "server-only";

export class ApiSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiSecurityError";
  }
}

function hostsMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Vérifie Origin/Referer pour les requêtes mutantes (mitigation CSRF). */
export function assertSameOrigin(req: Request): void {
  const host = req.headers.get("host");
  if (!host) return;

  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const u = new URL(origin);
      if (hostsMatch(u.host, host)) return;
      if (allowed.some((o) => {
        try {
          return hostsMatch(new URL(o).host, u.host);
        } catch {
          return false;
        }
      })) {
        return;
      }
    } catch {
      throw new ApiSecurityError("Origin invalide");
    }
    throw new ApiSecurityError("Origin non autorisée");
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const u = new URL(referer);
      if (hostsMatch(u.host, host)) return;
    } catch {
      throw new ApiSecurityError("Referer invalide");
    }
  }

  if (process.env.NODE_ENV !== "production") return;
  throw new ApiSecurityError("Requête cross-site refusée");
}

export function securityErrorResponse(err: unknown): Response | null {
  if (err instanceof ApiSecurityError) {
    return Response.json({ error: err.message }, { status: 403 });
  }
  return null;
}
