import "server-only";

import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { execute, query, type RowDataPacket } from "@/lib/db";

export const SESSION_COOKIE = "eglise_sid";
export const ROLE_COOKIE = "eglise_role";
export const ADMIN_GATE_COOKIE = "eglise_admin_gate";
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export type Role = "USER" | "ADMIN";

export type SessionUser = {
  id: number;
  email: string;
  role: Role;
  isPrincipal: boolean;
};

const WEAK_SECRETS = new Set([
  "dev-secret-change-me-please-32-bytes",
  "change-me",
  "secret",
]);

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET manquant ou trop court (min. 32 caractères)");
  }
  if (process.env.NODE_ENV === "production" && WEAK_SECRETS.has(s)) {
    throw new Error("SESSION_SECRET par défaut interdit en production");
  }
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function pack(sid: string): string {
  return `${sid}.${sign(sid)}`;
}

function unpack(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const sid = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!sid || !sig) return null;
  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(sig, "hex");
    b = Buffer.from(sign(sid), "hex");
  } catch {
    return null;
  }
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? sid : null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
  is_principal: number;
};

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow[]>(
    "SELECT id, email, password_hash, role, is_principal FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  password: string,
  role: Role = "USER",
): Promise<UserRow> {
  const normalized = email.trim().toLowerCase();
  const hash = await hashPassword(password);
  await execute(
    "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
    [normalized, hash, role],
  );
  const user = await findUserByEmail(normalized);
  if (!user) throw new Error("Création utilisateur échouée");
  return user;
}

export async function createSession(userId: number): Promise<string> {
  const sid = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await execute(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    [sid, userId, expiresAt],
  );
  return sid;
}

export async function destroySession(sid: string): Promise<void> {
  await execute("DELETE FROM sessions WHERE id = ?", [sid]);
}

export async function setSessionCookie(sid: string, role: Role): Promise<void> {
  const jar = await cookies();
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === "production";

  jar.set(SESSION_COOKIE, pack(sid), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });

  // Cookie d'indication de rôle (signé HMAC, lisible par le proxy/front).
  jar.set(ROLE_COOKIE, pack(role), {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  for (const name of [SESSION_COOKIE, ROLE_COOKIE, ADMIN_GATE_COOKIE]) {
    jar.set(name, "", {
      httpOnly: name === SESSION_COOKIE,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    });
  }
}

export async function setAdminGateCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_GATE_COOKIE, pack("1"), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/**
 * Valide la signature HMAC d'un cookie (utilisable en environnement Edge ou Node).
 * Réimplémenté pour le proxy.
 */
export function verifyCookieSignature(raw: string | undefined): string | null {
  return unpack(raw);
}

export async function readSessionIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return unpack(jar.get(SESSION_COOKIE)?.value);
}

type SessionJoinRow = RowDataPacket & {
  user_id: number;
  email: string;
  role: Role;
  is_principal: number;
  expires_at: Date;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const sid = await readSessionIdFromCookie();
  if (!sid) return null;

  const rows = await query<SessionJoinRow[]>(
    `SELECT s.user_id, u.email, u.role, u.is_principal, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = ? LIMIT 1`,
    [sid],
  );
  const row = rows[0];
  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await destroySession(sid);
    return null;
  }

  return {
    id: row.user_id,
    email: row.email,
    role: row.role,
    isPrincipal: Boolean(row.is_principal),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("UNAUTHENTICATED");
    err.name = "Unauthorized";
    throw err;
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const err = new Error("FORBIDDEN");
    err.name = "Forbidden";
    throw err;
  }
  return user;
}

export function authErrorResponse(err: unknown): Response | null {
  if (err instanceof Error) {
    if (err.name === "Unauthorized") {
      return Response.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (err.name === "Forbidden") {
      return Response.json({ error: "Accès interdit" }, { status: 403 });
    }
  }
  return null;
}
