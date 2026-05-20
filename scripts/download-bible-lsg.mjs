/**
 * Télécharge la Bible Louis Segond 1910 (fra_lsg) vers public/bible/data/
 * pour lecture 100 % locale (sans API à l’affichage).
 *
 * Usage :
 *   npm run bible:download              # manque seulement
 *   npm run bible:download -- --force   # tout réécrire
 *   npm run bible:download -- --book jhn
 */
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BIBLE_BOOKS,
  BOOK_ID_TO_HELLOAO,
  HELLOAO_TRANSLATION,
  totalChapterCount,
} from "./bible-download-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_ROOT = path.join(ROOT, "public", "bible", "data");
const DELAY_MS = Number(process.env.BIBLE_DOWNLOAD_DELAY_MS ?? 150);
const FORCE = process.argv.includes("--force");
const bookArg = process.argv.find((a) => a.startsWith("--book="))?.split("=")[1]
  ?? (process.argv.includes("--book") ? process.argv[process.argv.indexOf("--book") + 1] : null);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function flattenVersePart(part) {
  if (typeof part === "string") return part;
  if (part && typeof part === "object" && "text" in part) {
    const t = part.text;
    return typeof t === "string" ? t : "";
  }
  return "";
}

function parseHelloaoVerses(payload) {
  const blocks = payload.chapter?.content;
  if (!Array.isArray(blocks)) return [];
  const seen = new Set();
  const out = [];
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

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadChapter(book, chapter) {
  const code = BOOK_ID_TO_HELLOAO[book.id];
  if (!code) throw new Error(`Code helloao manquant pour ${book.id}`);

  const url = `https://bible.helloao.org/api/${HELLOAO_TRANSLATION}/${code}/${chapter}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const verses = parseHelloaoVerses(json);
  if (verses.length === 0) throw new Error("Aucun verset");

  return {
    bookId: book.id,
    bookName: book.name,
    chapter,
    verses,
  };
}

const books = bookArg
  ? BIBLE_BOOKS.filter((b) => b.id === bookArg)
  : BIBLE_BOOKS;

if (bookArg && books.length === 0) {
  console.error(`Livre inconnu : ${bookArg}`);
  process.exit(1);
}

let ok = 0;
let skip = 0;
let fail = 0;
const failures = [];

console.log(
  `Téléchargement LSG → ${DATA_ROOT}\n` +
    `Livres : ${books.length} · Chapitres attendus : ${books.reduce((s, b) => s + b.chapters, 0)}` +
    (FORCE ? " · mode --force" : ""),
);

for (const book of books) {
  const dir = path.join(DATA_ROOT, book.id);
  await mkdir(dir, { recursive: true });

  for (let ch = 1; ch <= book.chapters; ch++) {
    const outPath = path.join(dir, `${ch}.json`);
    if (!FORCE && (await fileExists(outPath))) {
      skip++;
      continue;
    }

    process.stdout.write(`  ${book.id} ${ch}/${book.chapters}… `);
    try {
      const data = await downloadChapter(book, ch);
      await writeFile(outPath, JSON.stringify(data, null, 0) + "\n", "utf8");
      ok++;
      console.log("OK");
    } catch (e) {
      fail++;
      const msg = e instanceof Error ? e.message : String(e);
      failures.push(`${book.id}:${ch} — ${msg}`);
      console.log(`ÉCHEC (${msg})`);
    }
    await sleep(DELAY_MS);
  }
}

const manifest = {
  translation: HELLOAO_TRANSLATION,
  label: "Louis Segond 1910",
  downloadedAt: new Date().toISOString(),
  books: books.length,
  expectedChapters: books.reduce((s, b) => s + b.chapters, 0),
  ok,
  skipped: skip,
  failed: fail,
};
await writeFile(
  path.join(DATA_ROOT, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8",
);

console.log(`\nTerminé : ${ok} écrits, ${skip} déjà présents, ${fail} échecs.`);
if (failures.length) {
  console.log("Échecs :");
  for (const f of failures.slice(0, 20)) console.log(`  - ${f}`);
  if (failures.length > 20) console.log(`  … et ${failures.length - 20} autres`);
  process.exit(1);
}

console.log(`Manifeste : public/bible/data/manifest.json`);
console.log(`Vérification : npm run bible:verify`);
console.log(`Production : définir BIBLE_LOCAL_ONLY=1 dans .env`);
