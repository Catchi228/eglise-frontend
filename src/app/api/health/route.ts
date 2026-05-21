import { isServerConfigured } from "@/lib/authRouteError";

export async function GET() {
  const { db, session } = isServerConfigured();
  const ok = db && session;
  return Response.json(
    {
      ok,
      db,
      session,
      hint: ok
        ? undefined
        : "Ajoutez DATABASE_URL et SESSION_SECRET dans les variables Vercel, puis redéployez.",
    },
    { status: ok ? 200 : 503 },
  );
}
