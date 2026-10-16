import "server-only";
import { sql } from "drizzle-orm";
import { connection } from "next/server";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { bootstrapSql } from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * DATABASE_URL set   -> real Postgres (Neon on Vercel, or any Postgres you like).
 * DATABASE_URL unset -> PGlite, an embedded Postgres stored in ./.data/pglite.
 *                       Zero setup for local development.
 */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function databaseMode(): "postgres" | "pglite" {
  return databaseUrl() ? "postgres" : "pglite";
}

async function connect(): Promise<Database> {
  const url = databaseUrl();
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    // prepare: false keeps us compatible with poolers such as Neon's pgbouncer.
    const client = postgres(url, { prepare: false, max: 5 });
    return drizzle(client, { schema });
  }

  if (process.env.VERCEL) {
    throw new Error(
      "No database configured. Add a Postgres database (for example Neon from the Vercel Marketplace) so DATABASE_URL is set, then redeploy.",
    );
  }

  const path = await import("node:path");
  const fs = await import("node:fs");
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  return drizzle(client, { schema }) as unknown as Database;
}

async function bootstrap(db: Database) {
  for (const statement of bootstrapSql) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error) {
      // Two cold starts racing to create the same table can collide; the
      // second attempt sees the table and moves on.
      await db.execute(sql.raw(statement)).catch(() => {
        throw error;
      });
    }
  }
}

const globalForDb = globalThis as unknown as { __jotiDb?: Promise<Database> };

/**
 * Shared connection, created (and the tables bootstrapped) on first use.
 * Awaiting connection() first tells Next.js this is request-time data, so
 * pages never try to prerender database reads at build time.
 */
export async function getDb(): Promise<Database> {
  await connection();
  if (!globalForDb.__jotiDb) {
    globalForDb.__jotiDb = connect()
      .then(async (db) => {
        await bootstrap(db);
        return db;
      })
      .catch((error) => {
        globalForDb.__jotiDb = undefined;
        throw error;
      });
  }
  return globalForDb.__jotiDb;
}

export { schema };
