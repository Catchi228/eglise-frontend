import { cache } from "react";
import type { BibleChapterJson } from "@/lib/bibleChapter";
import { bibleBooks } from "@/lib/mock";
import {
  BOOK_ID_TO_HELLOAO_CODE,
  type HelloaoChapterPayload,
  helloaoChapterUrl,
  parseHelloaoChapterVerses,
} from "@/lib/bibleHelloao";

/** Slugs des dossiers `books/<slug>/chapters/` sur wldeh/bible-api (en-kjv, etc.). */
export const BIBLE_BOOK_REMOTE_SLUG: Record<string, string> = {
  gen: "genesis",
  exo: "exodus",
  lev: "leviticus",
  num: "numbers",
  deu: "deuteronomy",
  jos: "joshua",
  jdg: "judges",
  rut: "ruth",
  "1sa": "1samuel",
  "2sa": "2samuel",
  "1ki": "1kings",
  "2ki": "2kings",
  "1ch": "1chronicles",
  "2ch": "2chronicles",
  ezr: "ezra",
  neh: "nehemiah",
  est: "esther",
  job: "job",
  psa: "psalms",
  pro: "proverbs",
  ecc: "ecclesiastes",
  sng: "songofsolomon",
  isa: "isaiah",
  jer: "jeremiah",
  lam: "lamentations",
  ezk: "ezekiel",
  dan: "daniel",
  hos: "hosea",
  joe: "joel",
  amo: "amos",
  oba: "obadiah",
  jon: "jonah",
  mic: "micah",
  nah: "nahum",
  hab: "habakkuk",
  zep: "zephaniah",
  hag: "haggai",
  zec: "zechariah",
  mal: "malachi",
  mat: "matthew",
  mrk: "mark",
  luk: "luke",
  jhn: "john",
  act: "acts",
  rom: "romans",
  "1co": "1corinthians",
  "2co": "2corinthians",
  gal: "galatians",
  eph: "ephesians",
  phi: "philippians",
  col: "colossians",
  "1th": "1thessalonians",
  "2th": "2thessalonians",
  "1ti": "1timothy",
  "2ti": "2timothy",
  tit: "titus",
  phm: "philemon",
  heb: "hebrews",
  jas: "james",
  "1pe": "1peter",
  "2pe": "2peter",
  "1jn": "1john",
  "2jn": "2john",
  "3jn": "3john",
  jud: "jude",
  rev: "revelation",
};

type RemoteVerseRow = {
  verse?: string;
  text?: string;
};

type RemoteChapterPayload = {
  data?: RemoteVerseRow[];
};

export type BibleRemoteProvider = "helloao" | "wldeh";

function remoteProvider(): BibleRemoteProvider {
  const raw =
    process.env.BIBLE_REMOTE_PROVIDER?.trim().toLowerCase() ||
    process.env.NEXT_PUBLIC_BIBLE_REMOTE_PROVIDER?.trim().toLowerCase() ||
    "";
  if (raw === "wldeh" || raw === "jsdelivr" || raw === "cdn") {
    return "wldeh";
  }
  return "helloao";
}

/** Identifiant traduction helloao (ex. fra_lsg, fra_ost, BSB). */
function helloaoTranslationId(): string {
  return (
    process.env.BIBLE_HELLOAO_TRANSLATION?.trim() ||
    process.env.NEXT_PUBLIC_BIBLE_HELLOAO_TRANSLATION?.trim() ||
    "fra_lsg"
  );
}

function wldehVersion(): string {
  return (
    process.env.BIBLE_REMOTE_VERSION?.trim() ||
    process.env.NEXT_PUBLIC_BIBLE_REMOTE_VERSION?.trim() ||
    "en-kjv"
  );
}

/** Libellé pour l’UI quand le texte ne vient pas du JSON métadonnées API. */
export function bibleRemoteTranslationLabel(): string {
  if (remoteProvider() === "helloao") {
    const id = helloaoTranslationId();
    if (id === "fra_lsg") {
      return "Louis Segond 1910 (français) — chargé via bible.helloao.org. Voir la fiche licence sur eBible.";
    }
    return `Traduction ${id} — bible.helloao.org (vérifier la licence indiquée par l’API).`;
  }
  const v = wldehVersion();
  if (v === "en-kjv" || v === "en_kjv") {
    return "King James Version (anglais) — texte intégral via wldeh/bible-api (jsDelivr).";
  }
  return `Traduction distante (${v}) — wldeh/bible-api ; vérifiez la licence de cette version.`;
}

function dedupeVerses(rows: RemoteVerseRow[]): Array<{ n: number; t: string }> {
  const seen = new Set<number>();
  const out: Array<{ n: number; t: string }> = [];
  for (const row of rows) {
    const n = Number.parseInt(String(row.verse ?? ""), 10);
    const t = typeof row.text === "string" ? row.text : "";
    if (!Number.isFinite(n) || n < 1 || seen.has(n)) continue;
    seen.add(n);
    out.push({ n, t });
  }
  out.sort((a, b) => a.n - b.n);
  return out;
}

function helloaoTranslationLine(
  name: string | undefined,
  licenseUrl: string | undefined,
): string {
  const n = name?.trim() || helloaoTranslationId();
  if (licenseUrl) {
    return `${n} — API bible.helloao.org (licence : ${licenseUrl})`;
  }
  return `${n} — API bible.helloao.org`;
}

async function fetchHelloaoChapter(
  bookId: string,
  chapter: number,
): Promise<BibleChapterJson | null> {
  const code = BOOK_ID_TO_HELLOAO_CODE[bookId];
  if (!code || chapter < 1) return null;

  const translationId = helloaoTranslationId();
  const url = helloaoChapterUrl(translationId, code, chapter);

  try {
    const res = await fetch(url, {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as HelloaoChapterPayload;
    const verses = parseHelloaoChapterVerses(json);
    if (verses.length === 0) return null;

    const meta = bibleBooks.find((b) => b.id === bookId);
    const translation = helloaoTranslationLine(
      json.translation?.name,
      json.translation?.licenseUrl,
    );

    return {
      translation,
      bookId,
      bookName: meta?.name ?? bookId,
      chapter,
      verses,
    };
  } catch {
    return null;
  }
}

async function fetchWldehChapter(
  bookId: string,
  chapter: number,
): Promise<BibleChapterJson | null> {
  if (chapter < 1) return null;
  const slug = BIBLE_BOOK_REMOTE_SLUG[bookId];
  if (!slug) return null;

  const version = wldehVersion();
  const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${version}/books/${slug}/chapters/${chapter}.json`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as RemoteChapterPayload;
    const rows = Array.isArray(json.data) ? json.data : [];
    const verses = dedupeVerses(rows);
    if (verses.length === 0) return null;

    const meta = bibleBooks.find((b) => b.id === bookId);
    const translation = bibleRemoteTranslationLabel();

    return {
      translation,
      bookId,
      bookName: meta?.name ?? bookId,
      chapter,
      verses,
    };
  } catch {
    return null;
  }
}

/**
 * Chapitre distant si aucun JSON local : par défaut **helloao** (français Louis Segond),
 * ou **wldeh** si `BIBLE_REMOTE_PROVIDER=wldeh`.
 */
export const fetchRemoteBibleChapter = cache(
  async (
    bookId: string,
    chapter: number,
  ): Promise<BibleChapterJson | null> => {
    if (remoteProvider() === "wldeh") {
      return fetchWldehChapter(bookId, chapter);
    }
    return fetchHelloaoChapter(bookId, chapter);
  },
);
