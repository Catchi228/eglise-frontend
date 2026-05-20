// Logo du site : cache en mémoire + fetch /api/settings/logo.
// API synchrone pour les composants existants (getSiteLogo() retourne
// la valeur courante du cache, hydrate en arrière-plan au premier appel).

let cached: string | null = null;
let hydrated = false;
let pending: Promise<void> | null = null;

function dispatchLogoChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("eglise:logo"));
}

function lazyHydrate() {
  if (hydrated || pending || typeof window === "undefined") return;
  pending = fetch("/api/settings/logo", {
    cache: "no-store",
    credentials: "same-origin",
    signal: AbortSignal.timeout(5000),
  })
    .then(async (r) => {
      if (!r.ok) return;
      const data = (await r.json()) as { path?: string | null };
      cached = data.path ?? null;
      hydrated = true;
      dispatchLogoChange();
    })
    .catch(() => {})
    .finally(() => {
      pending = null;
    });
}

export function getSiteLogo(): string | null {
  lazyHydrate();
  return cached;
}

export async function refreshSiteLogo(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const r = await fetch("/api/settings/logo", {
      cache: "no-store",
      credentials: "same-origin",
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return cached;
    const data = (await r.json()) as { path?: string | null };
    cached = data.path ?? null;
    hydrated = true;
    dispatchLogoChange();
    return cached;
  } catch {
    return cached;
  }
}

export async function setSiteLogo(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/settings/logo", {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  if (!r.ok) {
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Erreur upload logo");
  }
  const data = (await r.json()) as { path: string };
  cached = data.path;
  hydrated = true;
  dispatchLogoChange();
  return cached;
}

export async function clearSiteLogo(): Promise<void> {
  const r = await fetch("/api/settings/logo", {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!r.ok) {
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Erreur");
  }
  cached = null;
  hydrated = true;
  dispatchLogoChange();
}
