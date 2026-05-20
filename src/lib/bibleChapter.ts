import { access, constants, readFile } from "fs/promises";
import path from "path";
import { fetchRemoteBibleChapter } from "@/lib/bibleRemote";

/** Contenu attendu pour `public/bible/data/{bookId}/{chapter}.json` */
export type BibleChapterJson = {
  translation?: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verses: Array<{ n: number; t: string }>;
};

/**
 * Lit un chapitre depuis le disque (build / SSR).
 * Pour ajouter du texte : place un fichier JSON sous `public/bible/data/<bookId>/<n>.json`.
 */
/** Indique si un fichier chapitre existe (sans tout charger). */
export async function bibleChapterFileExists(
  bookId: string,
  chapter: number,
): Promise<boolean> {
  if (chapter < 1) return false;
  try {
    const file = path.join(
      process.cwd(),
      "public",
      "bible",
      "data",
      bookId,
      `${chapter}.json`,
    );
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function loadBibleChapterFromDisk(
  bookId: string,
  chapter: number,
): Promise<BibleChapterJson | null> {
  try {
    const file = path.join(
      process.cwd(),
      "public",
      "bible",
      "data",
      bookId,
      `${chapter}.json`,
    );
    const raw = await readFile(file, "utf-8");
    const data = JSON.parse(raw) as BibleChapterJson;
    if (
      !data ||
      typeof data.bookId !== "string" ||
      typeof data.bookName !== "string" ||
      typeof data.chapter !== "number" ||
      !Array.isArray(data.verses)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function bibleLocalOnly(): boolean {
  const v = process.env.BIBLE_LOCAL_ONLY?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Fichiers locaux d’abord ; API distante seulement si BIBLE_LOCAL_ONLY n’est pas activé. */
export async function loadBibleChapter(
  bookId: string,
  chapter: number,
): Promise<BibleChapterJson | null> {
  const local = await loadBibleChapterFromDisk(bookId, chapter);
  if (local) return local;
  if (bibleLocalOnly()) return null;
  return fetchRemoteBibleChapter(bookId, chapter);
}

export { bibleLocalOnly };
