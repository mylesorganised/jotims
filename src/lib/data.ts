import "server-only";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import type { Section, TaskStatus } from "@/lib/db/schema";

export type ScoutRow = typeof schema.scouts.$inferSelect;
export type ProgressRow = typeof schema.taskProgress.$inferSelect;
export type UploadRow = typeof schema.uploads.$inferSelect;
export type AwardRow = typeof schema.badgeAwards.$inferSelect;

/** "Zoë ", "zoe" -> "zoe"; used so logins forgive capitals, spaces and accents. */
export function normaliseName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function tidyName(name: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function nameKey(first: string, last: string, dob: string) {
  return `${normaliseName(first)}|${normaliseName(last)}|${dob}`;
}

export async function findScoutByLogin(first: string, last: string, dob: string) {
  const db = await getDb();
  const [scout] = await db
    .select()
    .from(schema.scouts)
    .where(eq(schema.scouts.nameKey, nameKey(first, last, dob)));
  return scout ?? null;
}

export async function createScout(input: { firstName: string; lastName: string; dob: string; section: Section }) {
  const db = await getDb();
  const row = {
    id: crypto.randomUUID(),
    firstName: tidyName(input.firstName),
    lastName: tidyName(input.lastName),
    dob: input.dob,
    section: input.section,
    nameKey: nameKey(input.firstName, input.lastName, input.dob),
  };
  await db.insert(schema.scouts).values(row);
  return row;
}

export async function touchScout(scoutId: string) {
  const db = await getDb();
  await db.update(schema.scouts).set({ lastSeenAt: new Date() }).where(eq(schema.scouts.id, scoutId));
}

export type StatusMap = Record<string, Record<string, TaskStatus>>;

export function toStatusMap(rows: Pick<ProgressRow, "badgeId" | "taskId" | "status">[]): StatusMap {
  const map: StatusMap = {};
  for (const r of rows) (map[r.badgeId] ??= {})[r.taskId] = r.status;
  return map;
}

export async function getScoutOverview(scoutId: string) {
  const db = await getDb();
  const [rows, awards] = await Promise.all([
    db.select().from(schema.taskProgress).where(eq(schema.taskProgress.scoutId, scoutId)),
    db.select().from(schema.badgeAwards).where(eq(schema.badgeAwards.scoutId, scoutId)),
  ]);
  return { rows, statuses: toStatusMap(rows), awards: new Map(awards.map((a) => [a.badgeId, a])) };
}

export async function getTaskRecord(scoutId: string, badgeId: string, taskId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.taskProgress)
    .where(
      and(
        eq(schema.taskProgress.scoutId, scoutId),
        eq(schema.taskProgress.badgeId, badgeId),
        eq(schema.taskProgress.taskId, taskId),
      ),
    );
  return row ?? null;
}

export async function getTaskUploads(scoutId: string, badgeId: string, taskId: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.uploads)
    .where(
      and(eq(schema.uploads.scoutId, scoutId), eq(schema.uploads.badgeId, badgeId), eq(schema.uploads.taskId, taskId)),
    )
    .orderBy(schema.uploads.createdAt);
}

export async function logActivity(entry: {
  scoutId?: string | null;
  badgeId?: string | null;
  taskId?: string | null;
  kind: string;
  actor: string;
  message: string;
}) {
  const db = await getDb();
  await db.insert(schema.activity).values(entry);
}

// ------------------------------------------------------------- leader views

export async function getAllScouts() {
  const db = await getDb();
  return db.select().from(schema.scouts).orderBy(schema.scouts.firstName, schema.scouts.lastName);
}

export async function getScout(id: string) {
  const db = await getDb();
  const [scout] = await db.select().from(schema.scouts).where(eq(schema.scouts.id, id));
  return scout ?? null;
}

/** Every scout with their task statuses and awards, for the overview grids. */
export async function getGroupProgress() {
  const db = await getDb();
  const [scouts, rows, awards] = await Promise.all([
    getAllScouts(),
    db
      .select({
        scoutId: schema.taskProgress.scoutId,
        badgeId: schema.taskProgress.badgeId,
        taskId: schema.taskProgress.taskId,
        status: schema.taskProgress.status,
        updatedAt: schema.taskProgress.updatedAt,
      })
      .from(schema.taskProgress),
    db.select().from(schema.badgeAwards),
  ]);
  return scouts.map((scout) => {
    const mine = rows.filter((r) => r.scoutId === scout.id);
    return {
      scout,
      statuses: toStatusMap(mine),
      awards: new Map(awards.filter((a) => a.scoutId === scout.id).map((a) => [a.badgeId, a])),
      lastActivity: mine.reduce<Date | null>((latest, r) => (!latest || r.updatedAt > latest ? r.updatedAt : latest), null),
    };
  });
}

export async function getReviewQueue() {
  const db = await getDb();
  return db
    .select({ progress: schema.taskProgress, scout: schema.scouts })
    .from(schema.taskProgress)
    .innerJoin(schema.scouts, eq(schema.scouts.id, schema.taskProgress.scoutId))
    .where(eq(schema.taskProgress.status, "submitted"))
    .orderBy(schema.taskProgress.submittedAt);
}

export async function getRecentSubmissions(limit = 60) {
  const db = await getDb();
  return db
    .select({ progress: schema.taskProgress, scout: schema.scouts })
    .from(schema.taskProgress)
    .innerJoin(schema.scouts, eq(schema.scouts.id, schema.taskProgress.scoutId))
    .where(isNotNull(schema.taskProgress.submittedAt))
    .orderBy(desc(schema.taskProgress.submittedAt))
    .limit(limit);
}

export async function getHelpRequests() {
  const db = await getDb();
  return db
    .select({ progress: schema.taskProgress, scout: schema.scouts })
    .from(schema.taskProgress)
    .innerJoin(schema.scouts, eq(schema.scouts.id, schema.taskProgress.scoutId))
    .where(isNotNull(schema.taskProgress.helpRequestedAt))
    .orderBy(schema.taskProgress.helpRequestedAt);
}

export async function getRecentActivity(limit = 25) {
  const db = await getDb();
  return db
    .select({ activity: schema.activity, scout: schema.scouts })
    .from(schema.activity)
    .leftJoin(schema.scouts, eq(schema.scouts.id, schema.activity.scoutId))
    .orderBy(desc(schema.activity.createdAt))
    .limit(limit);
}

export async function getProgressById(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({ progress: schema.taskProgress, scout: schema.scouts })
    .from(schema.taskProgress)
    .innerJoin(schema.scouts, eq(schema.scouts.id, schema.taskProgress.scoutId))
    .where(eq(schema.taskProgress.id, id));
  return row ?? null;
}

export async function getScoutActivity(scoutId: string, limit = 30) {
  const db = await getDb();
  return db
    .select()
    .from(schema.activity)
    .where(eq(schema.activity.scoutId, scoutId))
    .orderBy(desc(schema.activity.createdAt))
    .limit(limit);
}

export function ageOn(dob: string, on = new Date()) {
  const [y, m, d] = dob.split("-").map(Number);
  let age = on.getFullYear() - y;
  if (on.getMonth() + 1 < m || (on.getMonth() + 1 === m && on.getDate() < d)) age--;
  return age;
}

/** The time of the current request, for "5 minutes ago" labels. */
export async function requestTime() {
  await connection();
  return Date.now();
}
