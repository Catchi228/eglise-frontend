import {
  clearSessionCookie,
  destroySession,
  readSessionIdFromCookie,
} from "@/lib/auth";

export async function POST() {
  const sid = await readSessionIdFromCookie();
  if (sid) {
    try {
      await destroySession(sid);
    } catch {
      // session déjà supprimée — on continue
    }
  }
  await clearSessionCookie();
  return Response.json({ ok: true });
}
