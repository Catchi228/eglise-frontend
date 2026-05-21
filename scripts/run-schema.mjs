// Exécute db/schema.sql via PostgreSQL (Supabase).
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createDbClient } from "./db-client.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = resolve(root, "db", "schema.sql");
const sql = readFileSync(schemaPath, "utf8");

const db = createDbClient();
console.log("Application du schéma PostgreSQL…");

try {
  await db.execute(sql);
  console.log("Schéma appliqué avec succès.");
} catch (err) {
  console.error("Erreur schéma :", err.message);
  process.exit(1);
} finally {
  await db.end();
}
