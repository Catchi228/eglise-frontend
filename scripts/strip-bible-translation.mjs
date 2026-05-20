/**
 * Retire le champ translation des JSON sous public/bible/data/
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "public", "bible", "data");

let n = 0;
for (const bookId of await readdir(DATA)) {
  const dir = path.join(DATA, bookId);
  const stat = await import("node:fs").then((fs) => fs.promises.stat(dir));
  if (!stat.isDirectory()) continue;
  for (const file of await readdir(dir)) {
    if (!file.endsWith(".json")) continue;
    const p = path.join(dir, file);
    const data = JSON.parse(await readFile(p, "utf8"));
    if (!("translation" in data)) continue;
    delete data.translation;
    await writeFile(p, JSON.stringify(data) + "\n", "utf8");
    n++;
  }
}

console.log(`translation retiré de ${n} fichier(s).`);
