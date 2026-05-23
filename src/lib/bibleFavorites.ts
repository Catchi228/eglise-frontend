export type FavoriteVerse = {
  id: string;
  bookId: string;
  chapter: number;
  verse: number;
  ref: string;
  text: string;
  createdAt: string;
};

export const FAVORITES_KEY = "eglise.bible.favoris.v1";
const FAVORITES_EVENT = "eglise:bible-favoris";

let snapshotVersion = 0;
let cachedSnapshot: FavoriteVerse[] = [];

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function parseVerseId(id: string): Pick<FavoriteVerse, "bookId" | "chapter" | "verse"> | null {
  const m = /^(.+):(\d+):(\d+)$/.exec(id);
  if (!m) return null;
  return { bookId: m[1], chapter: Number(m[2]), verse: Number(m[3]) };
}

function normalizeFavorite(raw: Partial<FavoriteVerse> & { id: string; ref: string; text: string; createdAt: string }): FavoriteVerse {
  const parsed = parseVerseId(raw.id);
  return {
    id: raw.id,
    bookId: raw.bookId ?? parsed?.bookId ?? "",
    chapter: raw.chapter ?? parsed?.chapter ?? 0,
    verse: raw.verse ?? parsed?.verse ?? 0,
    ref: raw.ref,
    text: raw.text,
    createdAt: raw.createdAt,
  };
}

function readFromStorage(): FavoriteVerse[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<Array<Partial<FavoriteVerse> & { id: string; ref: string; text: string; createdAt: string }>>(
    window.localStorage.getItem(FAVORITES_KEY),
  );
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((x) => x?.id && x.ref && x.text && x.createdAt)
    .map((x) => normalizeFavorite(x as FavoriteVerse));
}

function refreshCache() {
  cachedSnapshot = readFromStorage();
  snapshotVersion++;
}

function writeFavorites(items: FavoriteVerse[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  refreshCache();
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function makeVerseId(bookId: string, chapter: number, verse: number) {
  return `${bookId}:${chapter}:${verse}`;
}

export function makeVerseRef(bookName: string, chapter: number, verse: number) {
  return `${bookName} ${chapter}:${verse}`;
}

export function getFavoritesSnapshot(): FavoriteVerse[] {
  if (typeof window === "undefined") return [];
  if (snapshotVersion === 0) refreshCache();
  return cachedSnapshot;
}

export function subscribeFavorites(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === FAVORITES_KEY || e.key === null) {
      refreshCache();
      callback();
    }
  };
  const onCustom = () => {
    refreshCache();
    callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(FAVORITES_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FAVORITES_EVENT, onCustom);
  };
}

export function isVerseFavorite(bookId: string, chapter: number, verse: number): boolean {
  const id = makeVerseId(bookId, chapter, verse);
  return getFavoritesSnapshot().some((x) => x.id === id);
}

export function toggleBibleFavorite(input: {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}): boolean {
  const id = makeVerseId(input.bookId, input.chapter, input.verse);
  const items = getFavoritesSnapshot();
  const exists = items.some((x) => x.id === id);
  if (exists) {
    writeFavorites(items.filter((x) => x.id !== id));
    return false;
  }
  const entry: FavoriteVerse = {
    id,
    bookId: input.bookId,
    chapter: input.chapter,
    verse: input.verse,
    ref: makeVerseRef(input.bookName, input.chapter, input.verse),
    text: input.text,
    createdAt: new Date().toISOString(),
  };
  writeFavorites([entry, ...items]);
  return true;
}

export function removeBibleFavorite(id: string) {
  writeFavorites(getFavoritesSnapshot().filter((x) => x.id !== id));
}
