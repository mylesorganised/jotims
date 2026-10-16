import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb, schema } from "@/lib/db";
import {
  LEADER_COOKIE,
  LEADER_SESSION_DAYS,
  SCOUT_COOKIE,
  SCOUT_SESSION_DAYS,
  signLeaderToken,
  signScoutToken,
  verifyLeaderToken,
  verifyScoutToken,
} from "@/lib/tokens";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export type CurrentScout = typeof schema.scouts.$inferSelect;

export const getCurrentScout = cache(async (): Promise<CurrentScout | null> => {
  const session = await verifyScoutToken((await cookies()).get(SCOUT_COOKIE)?.value);
  if (!session) return null;
  const db = await getDb();
  const [scout] = await db.select().from(schema.scouts).where(eq(schema.scouts.id, session.scoutId));
  return scout ?? null;
});

export async function requireScout(): Promise<CurrentScout> {
  const scout = await getCurrentScout();
  if (!scout) redirect("/");
  return scout;
}

export async function setScoutSession(scoutId: string) {
  (await cookies()).set(SCOUT_COOKIE, await signScoutToken(scoutId), {
    ...cookieBase,
    maxAge: SCOUT_SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearScoutSession() {
  (await cookies()).delete(SCOUT_COOKIE);
}

export type CurrentLeader = { id: string; username: string; name: string };

/** The signed-in leader, checked against the database so removed leaders lose access. */
export const getLeader = cache(async (): Promise<CurrentLeader | null> => {
  const token = await verifyLeaderToken((await cookies()).get(LEADER_COOKIE)?.value);
  if (!token) return null;
  const db = await getDb();
  const [leader] = await db.select().from(schema.leaders).where(eq(schema.leaders.id, token.leaderId));
  return leader ? { id: leader.id, username: leader.username, name: leader.displayName } : null;
});

export async function requireLeader(): Promise<CurrentLeader> {
  const leader = await getLeader();
  if (!leader) redirect("/admin/login");
  return leader;
}

export async function setLeaderSession(leaderId: string, name: string) {
  (await cookies()).set(LEADER_COOKIE, await signLeaderToken(leaderId, name), {
    ...cookieBase,
    maxAge: LEADER_SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearLeaderSession() {
  (await cookies()).delete(LEADER_COOKIE);
}
