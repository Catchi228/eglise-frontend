// Couche client : cache + fetch. Bundle public (annonces+cours) et bootstrap admin
// réduisent le nombre d’allers-retours réseau.

import type { Announcement, Course } from "@/lib/types";

export type AdminQcmEntry = {
  id: string;
  courseId: string;
  title: string;
  questionCount: number;
  updatedAt: string;
};

export type AdminMessage = {
  id: string;
  from: string;
  subject: string;
  body: string;
  status: "nouveau" | "lu" | "répondu";
  createdAt: string;
  courseRef?: string;
};

export type ActivityEntry = {
  id: string;
  type: string;
  label: string;
  ts: number;
};

export type AdminNotification = {
  id: string;
  text: string;
  read: boolean;
  ts: number;
};

type CacheState = {
  announcements: Announcement[];
  courses: Course[];
  qcm: AdminQcmEntry[];
  messages: AdminMessage[];
  activity: ActivityEntry[];
  notifications: AdminNotification[];
  admins: string[];
  principal: string | null;
};

const cache: CacheState = {
  announcements: [],
  courses: [],
  qcm: [],
  messages: [],
  activity: [],
  notifications: [],
  admins: [],
  principal: null,
};

const loaded: Partial<Record<keyof CacheState, boolean>> = {};
const pending: Partial<Record<keyof CacheState, Promise<unknown>>> = {};

let publicBundlePromise: Promise<void> | null = null;

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("eglise:admin-data"));
}

const DEFAULT_FETCH_MS = 5000;

function needsNoStore(url: string): boolean {
  return (
    url.includes("/api/admin/") ||
    url.includes("/api/messages") ||
    url.includes("/api/auth/") ||
    url.includes("/api/uploads/")
  );
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number | false },
): Promise<T> {
  const { timeoutMs: timeoutOpt, ...rest } = init ?? {};
  const timeoutMs =
    timeoutOpt === false ? false : (typeof timeoutOpt === "number" ? timeoutOpt : DEFAULT_FETCH_MS);
  const signal =
    rest.signal ??
    (timeoutMs === false ? undefined : AbortSignal.timeout(timeoutMs as number));

  const r = await fetch(url, {
    credentials: "same-origin",
    cache: needsNoStore(url) ? "no-store" : "default",
    ...rest,
    ...(signal ? { signal } : {}),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Erreur ${r.status}`);
  }
  return (await r.json()) as T;
}

function lazyLoad<K extends keyof CacheState>(
  key: K,
  loader: () => Promise<CacheState[K]>,
) {
  if (loaded[key] || pending[key]) return;
  pending[key] = loader()
    .then((value) => {
      cache[key] = value;
      loaded[key] = true;
      emit();
    })
    .catch(() => {
      // DB indisponible ou non autorisé : nouvel essai au prochain read*
    })
    .finally(() => {
      pending[key] = undefined;
    });
}

/** True dès que le bundle public a rempli annonces + cours. */
export function isPublicContentLoaded(): boolean {
  return Boolean(loaded.announcements && loaded.courses);
}

/** Précharge annonces + cours (une seule requête). */
export function prefetchPublicContent(): void {
  ensurePublicBundle();
}

/** Réinitialise le cache portail (ex. après connexion pour charger les cours). */
export function resetPublicContentCache(): void {
  loaded.announcements = false;
  loaded.courses = false;
  publicBundlePromise = null;
  ensurePublicBundle();
}

function ensurePublicBundle() {
  if (loaded.announcements && loaded.courses) return;
  if (publicBundlePromise) return;
  publicBundlePromise = (async () => {
    try {
      const d = await fetchJson<{ announcements: Announcement[]; courses: Course[] }>(
        "/api/public/bundle",
      );
      cache.announcements = d.announcements ?? [];
      cache.courses = d.courses ?? [];
      loaded.announcements = true;
      loaded.courses = true;
      emit();
    } catch {
      // réessaiera au prochain accès
    } finally {
      publicBundlePromise = null;
    }
  })();
}

/**
 * Appelle `cb` une fois les données portail disponibles, ou après 5 s max (affichage dégradé).
 */
export function whenPublicContentReady(cb: () => void): () => void {
  if (isPublicContentLoaded()) {
    queueMicrotask(cb);
    return () => {};
  }
  ensurePublicBundle();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cb();
  };
  const onData = () => {
    if (isPublicContentLoaded()) finish();
  };
  window.addEventListener("eglise:admin-data", onData);
  const t = window.setTimeout(finish, DEFAULT_FETCH_MS);
  return () => {
    window.removeEventListener("eglise:admin-data", onData);
    window.clearTimeout(t);
  };
}

type AdminBootstrapPayload = {
  announcements: Announcement[];
  courses: Course[];
  qcm: AdminQcmEntry[];
  messages: AdminMessage[];
  activity: ActivityEntry[];
  notifications: AdminNotification[];
  admins: string[];
  principal: string | null;
};

export async function refreshAdminData(): Promise<void> {
  try {
    const d = await fetchJson<AdminBootstrapPayload>("/api/admin/bootstrap");
    cache.announcements = d.announcements ?? [];
    cache.courses = d.courses ?? [];
    cache.qcm = d.qcm ?? [];
    cache.messages = d.messages ?? [];
    cache.activity = d.activity ?? [];
    cache.notifications = d.notifications ?? [];
    cache.admins = d.admins ?? [];
    cache.principal = d.principal ?? null;

    loaded.announcements = true;
    loaded.courses = true;
    loaded.qcm = true;
    loaded.messages = true;
    loaded.activity = true;
    loaded.notifications = true;
    loaded.admins = true;
    loaded.principal = true;
    emit();
  } catch {
    // session expirée ou hors-ligne : ne pas vider le cache (évite flash vide)
  }
}

// -----------------------------------------------------------------------------
// Annonces
// -----------------------------------------------------------------------------
export function readAnnouncements(): Announcement[] {
  ensurePublicBundle();
  return cache.announcements;
}

export async function writeAnnouncements(list: Announcement[]): Promise<void> {
  const d = await fetchJson<{ announcements: Announcement[] }>("/api/announcements", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ list }),
    timeoutMs: 60_000,
  });
  cache.announcements = d.announcements ?? [];
  loaded.announcements = true;
  emit();
}

// -----------------------------------------------------------------------------
// Cours
// -----------------------------------------------------------------------------
export function readCourses(): Course[] {
  ensurePublicBundle();
  return cache.courses;
}

export async function writeCourses(list: Course[]): Promise<void> {
  const d = await fetchJson<{ courses: Course[] }>("/api/courses", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ list }),
    timeoutMs: 60_000,
  });
  cache.courses = d.courses ?? [];
  loaded.courses = true;
  emit();
}

// -----------------------------------------------------------------------------
// QCM
// -----------------------------------------------------------------------------
export function readQcmList(): AdminQcmEntry[] {
  lazyLoad("qcm", async () => {
    const d = await fetchJson<{ qcm: AdminQcmEntry[] }>("/api/qcm");
    return d.qcm ?? [];
  });
  return cache.qcm;
}

export async function writeQcmList(list: AdminQcmEntry[]): Promise<void> {
  const d = await fetchJson<{ qcm: AdminQcmEntry[] }>("/api/qcm", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ list }),
    timeoutMs: 60_000,
  });
  cache.qcm = d.qcm ?? [];
  loaded.qcm = true;
  emit();
}

// -----------------------------------------------------------------------------
// Messages
// -----------------------------------------------------------------------------
export function readMessages(): AdminMessage[] {
  lazyLoad("messages", async () => {
    const d = await fetchJson<{ messages: AdminMessage[] }>("/api/messages");
    return d.messages ?? [];
  });
  return cache.messages;
}

export async function writeMessages(list: AdminMessage[]): Promise<void> {
  const d = await fetchJson<{ messages: AdminMessage[] }>("/api/messages", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ list }),
    timeoutMs: 60_000,
  });
  cache.messages = d.messages ?? [];
  loaded.messages = true;
  emit();
}

// -----------------------------------------------------------------------------
// Activité & notifications
// -----------------------------------------------------------------------------
export function readActivity(): ActivityEntry[] {
  lazyLoad("activity", async () => {
    const d = await fetchJson<{ activity: ActivityEntry[] }>("/api/admin/activity");
    return d.activity ?? [];
  });
  return cache.activity;
}

export function readNotifications(): AdminNotification[] {
  lazyLoad("notifications", async () => {
    const d = await fetchJson<{ notifications: AdminNotification[] }>(
      "/api/admin/notifications",
    );
    return d.notifications ?? [];
  });
  return cache.notifications;
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetchJson("/api/admin/notifications", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  cache.notifications = cache.notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  emit();
}

export function pushNotification(_text: string): void {
  // no-op : notifications créées côté serveur
}

// -----------------------------------------------------------------------------
// Administrateurs
// -----------------------------------------------------------------------------
export function readAdminEmails(): string[] {
  lazyLoad("admins", async () => {
    const d = await fetchJson<{ admins: string[] }>("/api/admin/admins");
    return d.admins ?? [];
  });
  return cache.admins;
}

export async function writeAdminEmails(list: string[]): Promise<void> {
  const d = await fetchJson<{ admins: string[] }>("/api/admin/admins", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ emails: list }),
    timeoutMs: 15_000,
  });
  cache.admins = d.admins ?? [];
  loaded.admins = true;
  emit();
}

export function getPrincipalEmail(): string | null {
  lazyLoad("principal", async () => {
    const d = await fetchJson<{ email: string | null }>("/api/settings/principal");
    return d.email ?? null;
  });
  return cache.principal;
}

export function setPrincipalEmailIfUnset(email: string): void {
  if (cache.principal) return;
  fetchJson<{ email: string | null }>("/api/settings/principal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  })
    .then((d) => {
      cache.principal = d.email ?? null;
      loaded.principal = true;
      emit();
    })
    .catch(() => {});
}

export function isPrincipalAdmin(email: string): boolean {
  const p = getPrincipalEmail();
  if (!p) return false;
  return p === email.trim().toLowerCase();
}
