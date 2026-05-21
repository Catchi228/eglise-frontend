import "server-only";
import { Pool as PgPool, type PoolClient } from "pg";

declare global {
  var __egliseDbPool: DbPool | undefined;
}

export type RowDataPacket = Record<string, unknown>;

export type ResultSetHeader = {
  insertId: number;
  affectedRows: number;
};

function getConnectionString(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL manquant (Supabase → Settings → Database → Connection string)",
    );
  }
  return url;
}

function buildPgPool(): PgPool {
  const ssl =
    process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false };

  return new PgPool({
    connectionString: getConnectionString(),
    ssl,
    max: 10,
  });
}

function normalizeSql(sql: string): string {
  return sql.replace(/`/g, '"');
}

function toPgParams(
  sql: string,
  params?: unknown[],
): { text: string; values: unknown[] } {
  const values = params ?? [];
  let idx = 0;
  const text = normalizeSql(sql).replace(/\?/g, () => `$${++idx}`);
  return { text, values };
}

export class DbConnection {
  constructor(private client: PoolClient) {}

  async query<T extends RowDataPacket[] = RowDataPacket[]>(
    sql: string,
    params?: unknown[],
  ): Promise<T> {
    const { text, values } = toPgParams(sql, params);
    const result = await this.client.query(text, values);
    return result.rows as T;
  }

  async execute(sql: string, params?: unknown[]): Promise<ResultSetHeader> {
    const { text, values } = toPgParams(sql, params);
    const result = await this.client.query(text, values);
    const insertId =
      result.rows.length === 1 &&
      result.rows[0] &&
      typeof result.rows[0] === "object" &&
      "id" in result.rows[0]
        ? Number((result.rows[0] as { id: unknown }).id)
        : 0;
    return {
      insertId,
      affectedRows: result.rowCount ?? 0,
    };
  }

  async beginTransaction(): Promise<void> {
    await this.client.query("BEGIN");
  }

  async commit(): Promise<void> {
    await this.client.query("COMMIT");
  }

  async rollback(): Promise<void> {
    await this.client.query("ROLLBACK");
  }

  release(): void {
    this.client.release();
  }
}

export class DbPool {
  constructor(private pool: PgPool) {}

  async getConnection(): Promise<DbConnection> {
    const client = await this.pool.connect();
    return new DbConnection(client);
  }
}

function buildPool(): DbPool {
  if (!globalThis.__egliseDbPool) {
    globalThis.__egliseDbPool = new DbPool(buildPgPool());
  }
  return globalThis.__egliseDbPool;
}

export function getPool(): DbPool {
  return buildPool();
}

export async function query<T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  params?: unknown[],
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    return await conn.query<T>(sql, params);
  } finally {
    conn.release();
  }
}

export async function execute(
  sql: string,
  params?: unknown[],
): Promise<ResultSetHeader> {
  const conn = await getPool().getConnection();
  try {
    return await conn.execute(sql, params);
  } finally {
    conn.release();
  }
}
