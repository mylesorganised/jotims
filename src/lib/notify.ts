import "server-only";
import { and, count, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export type NotificationRow = typeof schema.notifications.$inferSelect;
type Kind = NotificationRow["kind"];

/** Tell a young person something happened (shown in their bell, as a pop-up, and as a browser alert). */
export async function notify(scoutId: string, n: { kind: Kind; title: string; body?: string | null; href?: string | null }) {
  const db = await getDb();
  await db.insert(schema.notifications).values({ scoutId, kind: n.kind, title: n.title, body: n.body ?? null, href: n.href ?? null });
}

export async function getNotifications(scoutId: string, afterId = 0, limit = 20) {
  const db = await getDb();
  const where = afterId
    ? and(eq(schema.notifications.scoutId, scoutId), gt(schema.notifications.id, afterId))
    : eq(schema.notifications.scoutId, scoutId);
  return db.select().from(schema.notifications).where(where).orderBy(desc(schema.notifications.id)).limit(limit);
}

export async function unreadCount(scoutId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ n: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.scoutId, scoutId), isNull(schema.notifications.readAt)));
  return row?.n ?? 0;
}

export async function markRead(scoutId: string, ids: number[] | "all") {
  const db = await getDb();
  const mine = eq(schema.notifications.scoutId, scoutId);
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(ids === "all" ? and(mine, isNull(schema.notifications.readAt)) : and(mine, inArray(schema.notifications.id, ids.length ? ids : [-1])));
}
