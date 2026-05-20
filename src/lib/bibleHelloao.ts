/** Codes livres API bible.helloao.org (ex. fra_lsg). */
export const BOOK_ID_TO_HELLOAO_CODE: Record<string, string> = {
  gen: "GEN",
  exo: "EXO",
  lev: "LEV",
  num: "NUM",
  deu: "DEU",
  jos: "JOS",
  jdg: "JDG",
  rut: "RUT",
  "1sa": "1SA",
  "2sa": "2SA",
  "1ki": "1KI",
  "2ki": "2KI",
  "1ch": "1CH",
  "2ch": "2CH",
  ezr: "EZR",
  neh: "NEH",
  est: "EST",
  job: "JOB",
  psa: "PSA",
  pro: "PRO",
  ecc: "ECC",
  sng: "SNG",
  isa: "ISA",
  jer: "JER",
  lam: "LAM",
  ezk: "EZK",
  dan: "DAN",
  hos: "HOS",
  joe: "JOL",
  amo: "AMO",
  oba: "OBA",
  jon: "JON",
  mic: "MIC",
  nah: "NAM",
  hab: "HAB",
  zep: "ZEP",
  hag: "HAG",
  zec: "ZEC",
  mal: "MAL",
  mat: "MAT",
  mrk: "MRK",
  luk: "LUK",
  jhn: "JHN",
  act: "ACT",
  rom: "ROM",
  "1co": "1CO",
  "2co": "2CO",
  gal: "GAL",
  eph: "EPH",
  phi: "PHP",
  col: "COL",
  "1th": "1TH",
  "2th": "2TH",
  "1ti": "1TI",
  "2ti": "2TI",
  tit: "TIT",
  phm: "PHM",
  heb: "HEB",
  jas: "JAS",
  "1pe": "1PE",
  "2pe": "2PE",
  "1jn": "1JN",
  "2jn": "2JN",
  "3jn": "3JN",
  jud: "JUD",
  rev: "REV",
};

type HelloaoVerseBlock = {
  type?: string;
  number?: number;
  content?: unknown[];
};

export type HelloaoChapterPayload = {
  translation?: {
    name?: string;
    licenseUrl?: string;
    website?: string;
  };
  chapter?: {
    content?: HelloaoVerseBlock[];
  };
};

function flattenVersePart(part: unknown): string {
  if (typeof part === "string") return part;
  if (part && typeof part === "object" && "text" in part) {
    const t = (part as { text?: unknown }).text;
    return typeof t === "string" ? t : "";
  }
  return "";
}

/** Extrait les versets depuis le JSON helloao (versets + parties « paroles de Jésus »). */
export function parseHelloaoChapterVerses(
  payload: HelloaoChapterPayload,
): Array<{ n: number; t: string }> {
  const blocks = payload.chapter?.content;
  if (!Array.isArray(blocks)) return [];

  const seen = new Set<number>();
  const out: Array<{ n: number; t: string }> = [];

  for (const block of blocks) {
    if (!block || block.type !== "verse") continue;
    const n = typeof block.number === "number" ? block.number : 0;
    if (n < 1 || seen.has(n)) continue;
    const parts = Array.isArray(block.content) ? block.content : [];
    const t = parts.map(flattenVersePart).filter(Boolean).join(" ").trim();
    if (!t) continue;
    seen.add(n);
    out.push({ n, t });
  }

  out.sort((a, b) => a.n - b.n);
  return out;
}

export function helloaoChapterUrl(
  translationId: string,
  bookCode: string,
  chapter: number,
): string {
  return `https://bible.helloao.org/api/${translationId}/${bookCode}/${chapter}.json`;
}
