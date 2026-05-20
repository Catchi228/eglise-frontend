/**
 * Vérifie que tous les chapitres existent sous public/bible/data/
 */
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BIBLE_BOOKS, totalChapterCount } from "./bible-download-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_ROOT = path.join(ROOT, "public", "bible", "data");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

const missing = [];
for (const book of BIBLE_BOOKS) {
  for (let ch = 1; ch <= book.chapters; ch++) {
    const p = path.join(DATA_ROOT, book.id, `${ch}.json`);
    if (!(await exists(p))) missing.push(`${book.id}/${ch}.json`);
  }
}

const expected = totalChapterCount();
const have = expected - missing.length;

if (missing.length === 0) {
  console.log(`bible:verify OK — ${have}/${expected} chapitres présents.`);
  process.exit(0);
}

console.error(`bible:verify ÉCHEC — ${have}/${expected} chapitres (${missing.length} manquants).`);
console.error("Exécutez : npm run bible:download");
for (const m of missing.slice(0, 15)) console.error(`  - ${m}`);
if (missing.length > 15) console.error(`  … et ${missing.length - 15} autres`);
process.exit(1);
