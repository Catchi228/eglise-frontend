// Client-side session helper.
// Source de vérité : le serveur via /api/auth/*. On garde un cache local
// pour offrir une API synchrone (getSession) aux composants.

export type Role = "USER" | "ADMIN";

export type Session = {
  email: string;
  role: Role;
  isPrincipal?: boolean;
};

const SESSION_EVENT = "eglise:session";
let cached: Session | null = null;
let hydrated = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EVENT));
    window.dispatchEvent(new Event("storage"));
  }
}

export function _setCachedSession(s: Session | null) {
  cached = s;
  hydrated = true;
  emit();
}

export function subscribeSession(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSession(): Session | null {
  return cached;
}

export function isSessionHydrated(): boolean {
  return hydrated;
}

export async function refreshSession(): Promise<Session | null> {
  try {
    const r = await fetch("/api/auth/me", {
      cache: "no-store",
      credentials: "same-origin",
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 401) {
      _setCachedSession(null);
      return null;
    }
    if (!r.ok) {
      return getSession();
    }
    const data = await r.json();
    const user = data.user as Session | null;
    _setCachedSession(user);
    return user;
  } catch {
    return getSession();
  }
}

export type SignInMode = "SIGN_IN" | "SIGN_UP";

export async function signIn(input: {
  email: string;
  password: string;
  mode: SignInMode;
}): Promise<Session> {
  const endpoint = input.mode === "SIGN_UP" ? "/api/auth/register" : "/api/auth/login";
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: input.email.trim().toLowerCase(), password: input.password }),
    credentials: "same-origin",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error((data as { error?: string }).error ?? "Erreur d'authentification");
  }
  const user = (data as { user: Session }).user;
  _setCachedSession(user);
  const { resetPublicContentCache } = await import("@/lib/adminData");
  resetPublicContentCache();
  return user;
}

export async function signOut(redirectHref: string = "/") {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  } catch {
    // ignore
  }
  _setCachedSession(null);
  if (typeof window !== "undefined") {
    window.location.href = redirectHref;
  }
}

export async function setAdminGateCookie(): Promise<boolean> {
  try {
    const r = await fetch("/api/auth/admin-gate", { method: "POST", credentials: "same-origin" });
    return r.ok;
  } catch {
    return false;
  }
}

export async function clearAdminGateCookie(): Promise<void> {
  try {
    await fetch("/api/auth/admin-gate", { method: "DELETE", credentials: "same-origin" });
  } catch {
    // ignore
  }
}

export async function changeEmail(newEmail: string, password: string): Promise<void> {
  const r = await fetch("/api/auth/change-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ newEmail, password }),
    credentials: "same-origin",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error((data as { error?: string }).error ?? "Erreur");
  }
  await refreshSession();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const r = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
    credentials: "same-origin",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error((data as { error?: string }).error ?? "Erreur");
  }
}
