import "server-only";
import mysql, {
  type Pool,
  type RowDataPacket,
  type ResultSetHeader,
  type ExecuteValues,
} from "mysql2/promise";

declare global {
  // Évite de recréer le pool à chaque rechargement HMR pendant `next dev`.
  var __egliseDbPool: Pool | undefined;
}

function buildPool(): Pool {
  const {
    DB_HOST = "127.0.0.1",
    DB_PORT = "3306",
    DB_USER = "root",
    DB_PASSWORD = "",
    DB_NAME = "eglise",
  } = process.env;

  return mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
    timezone: "Z",
    dateStrings: false,
  });
}

export function getPool(): Pool {
  if (!globalThis.__egliseDbPool) {
    globalThis.__egliseDbPool = buildPool();
  }
  return globalThis.__egliseDbPool;
}

export async function query<T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  params?: unknown[],
): Promise<T> {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params?: ExecuteValues,
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}

export type { RowDataPacket, ResultSetHeader };
