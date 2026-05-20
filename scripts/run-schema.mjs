// Exécute db/schema.sql via mysql2. Ne dépend pas du binaire `mysql` dans le PATH,
// donc fonctionne directement avec une installation XAMPP.

import fs from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import mysql from "mysql2/promise";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "",
} = process.env;

const sql = await fs.readFile(path.join("db", "schema.sql"), "utf8");

const conn = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  multipleStatements: true,
  charset: "utf8mb4",
});

console.log(`Application du schéma sur ${DB_HOST}:${DB_PORT}...`);
await conn.query(sql);
await conn.end();
console.log("Schéma appliqué.");
