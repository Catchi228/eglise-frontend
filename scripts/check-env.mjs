/**
 * Vérifie la présence des variables critiques (sans afficher leur valeur).
 * Usage : node scripts/check-env.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localPath = resolve(root, ".env.local");

function parseEnvFile(p) {
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    out[k] = v;
  }
  return out;
}

const local = parseEnvFile(localPath);
const issues = [];

if (!existsSync(localPath)) issues.push(".env.local manquant (copier depuis .env.example)");

const sec = local.SESSION_SECRET;
if (!sec) issues.push("SESSION_SECRET vide ou absent");
else if (sec.length < 32) issues.push("SESSION_SECRET doit faire au moins 32 caractères");


let exitCode = 0;
for (const m of issues) {
  if (m.startsWith("(doc)") || m.startsWith("(info)")) {
    console.warn(`  ${m}`);
  } else {
    console.error(`  ${m}`);
    exitCode = 1;
  }
}

if (exitCode !== 0) {
  console.error("check-env : échec");
  process.exit(1);
}

console.log("check-env : OK");
