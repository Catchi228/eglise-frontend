import { cookies } from "next/headers";
import {
  ADMIN_GATE_COOKIE,
  authErrorResponse,
  requireAdmin,
  setAdminGateCookie,
} from "@/lib/auth";

export async function POST() {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e) ?? Response.json({ error: "Erreur" }, { status: 500 });
  }
  await setAdminGateCookie();
  return Response.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(ADMIN_GATE_COOKIE, "", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return Response.json({ ok: true });
}
