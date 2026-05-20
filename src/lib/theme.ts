export const THEME_KEY = "eglise_theme";

export type SiteTheme = "light" | "dark";

export function applyTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("eglise:theme"));
}

/** À appeler au montage client : idempotent avec le script inline du layout. */
export function initTheme() {
  if (typeof window === "undefined") return;
  try {
    const s = localStorage.getItem(THEME_KEY);
    if (s === "light" || s === "dark") {
      applyTheme(s);
      return;
    }
  } catch {
    /* ignore */
  }
  applyTheme("light");
}

export function subscribeTheme(callback: () => void) {
  window.addEventListener("eglise:theme", callback);
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => {
    window.removeEventListener("eglise:theme", callback);
    obs.disconnect();
  };
}

export function getThemeIsDark() {
  return document.documentElement.classList.contains("dark");
}
