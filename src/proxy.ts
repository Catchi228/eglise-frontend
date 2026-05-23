import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "eglise_sid";
const ROLE_COOKIE = "eglise_role";
const ADMIN_GATE_COOKIE = "eglise_admin_gate";

function getSecret(): string {
  return process.env.SESSION_SECRET || "";
}

function verifySigned(raw: string | undefined): string | null {
  if (!raw) return null;
  const secret = getSecret();
  if (!secret) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const value = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(sig, "hex");
    b = Buffer.from(createHmac("sha256", secret).update(value).digest("hex"), "hex");
  } catch {
    return null;
  }
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? value : null;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const sid = verifySigned(req.cookies.get(SESSION_COOKIE)?.value);
  const role = verifySigned(req.cookies.get(ROLE_COOKIE)?.value);
  const adminGate = verifySigned(req.cookies.get(ADMIN_GATE_COOKIE)?.value) === "1";

  const hasSession = Boolean(sid);
  const isAdmin = role === "ADMIN";

  if (pathname === "/admin/connexion" || pathname.startsWith("/admin/connexion/")) {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (hasSession && isAdmin && adminGate) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.search = pathname !== "/admin" ? `?next=${encodeURIComponent(pathname + search)}` : "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)"],
};
