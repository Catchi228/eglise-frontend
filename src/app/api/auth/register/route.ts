import { assertSameOrigin, securityErrorResponse } from "@/lib/apiSecurity";
import { authRouteError } from "@/lib/authRouteError";
import {
  createSession,
  createUser,
  findUserByEmail,
  setSessionCookie,
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

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json(
      { error: "Mot de passe trop court (6 caractères minimum)" },
      { status: 400 },
    );
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return Response.json({ error: "Compte déjà existant" }, { status: 409 });
    }

    const user = await createUser(email, password, "USER");
    const sid = await createSession(user.id);
    await setSessionCookie(sid, user.role);

    return Response.json({
      user: {
        email: user.email,
        role: user.role,
        isPrincipal: Boolean(user.is_principal),
      },
    });
  } catch (e) {
    return authRouteError(e);
  }
}
