import "server-only";
import { Pool, type PoolConfig } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __agendaCer4SighPool: Pool | undefined;
}

function buildConfig(): PoolConfig {
  return {
    host: process.env.SIGH_DB_HOST,
    port: Number(process.env.SIGH_DB_PORT) || 5432,
    database: process.env.SIGH_DB_NAME,
    user: process.env.SIGH_DB_USER,
    password: process.env.SIGH_DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };
}

export function getSighPool(): Pool {
  if (!globalThis.__agendaCer4SighPool) {
    globalThis.__agendaCer4SighPool = new Pool(buildConfig());
    globalThis.__agendaCer4SighPool.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("[pg:sigh] erro inesperado no pool SIGH:", err.message);
    });
  }
  return globalThis.__agendaCer4SighPool;
}

export async function querySigh<T extends object = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getSighPool();
  try {
    const res = await pool.query(sql, params);
    return res.rows as T[];
  } catch (error) {
    console.error("[pg:sigh] falha na execucao:", error);
    throw error;
  }
}
