import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import {
  createSession,
  findUserByEmail,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch (e) {
    return securityErrorResponse(e) ?? Response.json({ error: "Refusé" }, { status: 403 });
  }
  let payload: { email?: unknown; password?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    return Response.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return Response.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return Response.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const sid = await createSession(user.id);
  await setSessionCookie(sid, user.role);

  return Response.json({
    user: {
      email: user.email,
      role: user.role,
      isPrincipal: Boolean(user.is_principal),
    },
  });
}
