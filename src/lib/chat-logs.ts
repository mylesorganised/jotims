import "server-only";
import { and, asc, eq, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const h = schema.helperMessages;
const s = schema.scouts;

/**
 * One chat. Chats logged before conversation ids existed are grouped by
 * person and day instead ("day:<scoutId>:<YYYY-MM-DD>").
 */
const conversationKey = sql<string>`coalesce(${h.conversationId}, 'day:' || coalesce(${h.scoutId}, ${h.leaderId}, '') || ':' || to_char(${h.createdAt} at time zone 'UTC', 'YYYY-MM-DD'))`;

export type ChatFilter = "all" | "young" | "leaders" | "flagged";

export type ConversationSummary = {
  key: string;
  startedAt: Date;
  lastAt: Date;
  questions: number;
  flagged: boolean;
  firstQuestion: string;
  badgeId: string | null;
  taskId: string | null;
  page: string | null;
  scout: { id: string; firstName: string; lastName: string; section: string } | null;
  leaderName: string | null;
};

export async function listConversations(options: { filter?: ChatFilter; q?: string; scoutId?: string; limit?: number }) {
  const db = await getDb();
  const where: SQL[] = [];
  if (options.filter === "young") where.push(isNotNull(h.scoutId));
  if (options.filter === "leaders") where.push(isNull(h.scoutId));
  if (options.scoutId) where.push(eq(h.scoutId, options.scoutId));
  const q = options.q?.trim();

  const having: SQL[] = [];
  if (options.filter === "flagged") having.push(sql`max(${h.flagged}) > 0`);
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    having.push(
      or(
        sql`bool_or(${h.content} ilike ${like})`,
        sql`bool_or(coalesce(${s.firstName} || ' ' || ${s.lastName}, ${h.leaderName}, '') ilike ${like})`,
      )!,
    );
  }

  const rows = await db
    .select({
      key: conversationKey,
      startedAt: sql<string>`min(${h.createdAt})`,
      lastAt: sql<string>`max(${h.createdAt})`,
      questions: sql<number>`count(*) filter (where ${h.role} = 'user')`.mapWith(Number),
      flagged: sql<number>`max(${h.flagged})`.mapWith(Number),
      firstQuestion: sql<string>`(array_agg(${h.content} order by ${h.id}) filter (where ${h.role} = 'user'))[1]`,
      badgeId: sql<string | null>`(array_agg(${h.badgeId} order by ${h.id} desc) filter (where ${h.badgeId} is not null))[1]`,
      taskId: sql<string | null>`(array_agg(${h.taskId} order by ${h.id} desc) filter (where ${h.taskId} is not null))[1]`,
      page: sql<string | null>`(array_agg(${h.page} order by ${h.id}) filter (where ${h.page} is not null))[1]`,
      scoutId: sql<string | null>`max(${h.scoutId})`,
      firstName: sql<string | null>`max(${s.firstName})`,
      lastName: sql<string | null>`max(${s.lastName})`,
      section: sql<string | null>`max(${s.section})`,
      leaderName: sql<string | null>`max(${h.leaderName})`,
    })
    .from(h)
    .leftJoin(s, eq(s.id, h.scoutId))
    .where(where.length ? and(...where) : undefined)
    .groupBy(conversationKey)
    .having(having.length ? and(...having) : undefined)
    .orderBy(sql`max(${h.createdAt}) desc`)
    .limit(options.limit ?? 60);

  return rows.map(
    (r): ConversationSummary => ({
      key: r.key,
      startedAt: new Date(r.startedAt),
      lastAt: new Date(r.lastAt),
      questions: r.questions,
      flagged: r.flagged > 0,
      firstQuestion: r.firstQuestion ?? "",
      badgeId: r.badgeId,
      taskId: r.taskId,
      page: r.page,
      scout: r.scoutId ? { id: r.scoutId, firstName: r.firstName ?? "", lastName: r.lastName ?? "", section: r.section ?? "" } : null,
      leaderName: r.leaderName,
    }),
  );
}

/** Counts for the filter tabs and the summary line. */
export async function chatStats() {
  const db = await getDb();
  const [row] = await db
    .select({
      conversations: sql<number>`count(distinct ${conversationKey})`.mapWith(Number),
      young: sql<number>`count(distinct ${conversationKey}) filter (where ${h.scoutId} is not null)`.mapWith(Number),
      leaders: sql<number>`count(distinct ${conversationKey}) filter (where ${h.scoutId} is null)`.mapWith(Number),
      flagged: sql<number>`count(distinct ${conversationKey}) filter (where ${h.flagged} > 0)`.mapWith(Number),
      questionsToday: sql<number>`count(*) filter (where ${h.role} = 'user' and ${h.createdAt} > now() - interval '24 hours')`.mapWith(Number),
    })
    .from(h);
  return row ?? { conversations: 0, young: 0, leaders: 0, flagged: 0, questionsToday: 0 };
}

export async function getConversation(key: string) {
  const db = await getDb();
  const legacy = key.match(/^day:([^:]*):(\d{4}-\d{2}-\d{2})$/);
  const where = legacy
    ? and(
        isNull(h.conversationId),
        or(eq(h.scoutId, legacy[1]), eq(h.leaderId, legacy[1])),
        sql`to_char(${h.createdAt} at time zone 'UTC', 'YYYY-MM-DD') = ${legacy[2]}`,
      )
    : eq(h.conversationId, key);
  const messages = await db.select().from(h).where(where).orderBy(asc(h.id));
  if (!messages.length) return null;
  const scoutId = messages.find((m) => m.scoutId)?.scoutId;
  const [scout] = scoutId ? await db.select().from(s).where(eq(s.id, scoutId)) : [];
  return { messages, scout: scout ?? null, leaderName: messages.find((m) => m.leaderName)?.leaderName ?? null };
}

/** Every message, oldest first, for the CSV export. */
export async function allHelperMessages() {
  const db = await getDb();
  return db
    .select({ message: h, firstName: s.firstName, lastName: s.lastName, section: s.section, key: conversationKey })
    .from(h)
    .leftJoin(s, eq(s.id, h.scoutId))
    .orderBy(asc(h.id));
}

