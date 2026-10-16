import "server-only";
import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";

export type LeaderRow = typeof schema.leaders.$inferSelect;

export function normaliseUsername(username: string) {
  return username.trim().toLowerCase();
}

export function usernameProblem(username: string): string | null {
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return "Usernames are 3–32 letters, numbers, dots, dashes or underscores.";
  return null;
}

export async function leaderCount() {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(schema.leaders);
  return Number(row?.n ?? 0);
}

export async function findLeaderByUsername(username: string) {
  const db = await getDb();
  const [leader] = await db.select().from(schema.leaders).where(eq(schema.leaders.username, normaliseUsername(username)));
  return leader ?? null;
}

export async function createLeader(input: { username: string; displayName: string; password: string }) {
  const db = await getDb();
  const row = {
    id: crypto.randomUUID(),
    username: normaliseUsername(input.username),
    displayName: input.displayName.trim() || input.username.trim(),
    passwordHash: await hashPassword(input.password),
  };
  await db.insert(schema.leaders).values(row);
  return row;
}

export async function listLeaders() {
  const db = await getDb();
  return db.select().from(schema.leaders).orderBy(schema.leaders.displayName);
}

export async function setLeaderPassword(id: string, password: string) {
  const db = await getDb();
  await db
    .update(schema.leaders)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(schema.leaders.id, id));
}

/**
 * How the first leader account gets made:
 * - ADMIN_USERNAME + ADMIN_PASSWORD env vars create it automatically (use this on Vercel).
 * - Locally, with no env vars, the login page offers a one-time "create account" form.
 */
export async function leaderSetupState(): Promise<"ready" | "first-run" | "needs-env"> {
  if ((await leaderCount()) > 0) return "ready";
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (username && password) {
    await createLeader({ username, displayName: process.env.ADMIN_NAME || username, password }).catch(() => {});
    return "ready";
  }
  return process.env.NODE_ENV === "production" ? "needs-env" : "first-run";
}
