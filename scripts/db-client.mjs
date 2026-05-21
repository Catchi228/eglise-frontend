/**
 * Client PostgreSQL partagé pour les scripts CLI (seed, schema).
 */
import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const { Pool } = pg;

function normalizeSql(sql) {
  return sql.replace(/`/g, '"');
}

function toPgParams(sql, params = []) {
  let idx = 0;
  const text = normalizeSql(sql).replace(/\?/g, () => `$${++idx}`);
  return { text, values: params };
}

export function createDbClient() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    const legacy = ["DB_HOST", "DB_USER", "DB_NAME"].filter((k) => process.env[k]);
    let hint =
      "Ajoutez DATABASE_URL dans .env.local (Supabase → Settings → Database → Connection string, mode Transaction).";
    if (legacy.length > 0) {
      hint +=
        `\nVariables MariaDB obsolètes détectées (${legacy.join(", ")}). Remplacez-les par DATABASE_URL.`;
    }
    throw new Error(`DATABASE_URL manquant.\n${hint}`);
  }

  const pool = new Pool({
    connectionString: url,
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
  });

  return {
    async query(sql, params) {
      const { text, values } = toPgParams(sql, params);
      const result = await pool.query(text, values);
      return result.rows;
    },
    async execute(sql, params) {
      const { text, values } = toPgParams(sql, params);
      const result = await pool.query(text, values);
      return { rowCount: result.rowCount ?? 0 };
    },
    async end() {
      await pool.end();
    },
  };
}
