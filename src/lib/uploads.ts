import "server-only";
import { getDb, schema } from "@/lib/db";
import { getBadge, getTask } from "@/content";

export type UploadMode = "local" | "blob" | "none";

/**
 * local = files saved in ./.data/uploads (development)
 * blob  = Vercel Blob (production; set BLOB_READ_WRITE_TOKEN by connecting a Blob store)
 * none  = deployed without a Blob store: uploads are switched off
 */
export function uploadMode(): UploadMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return process.env.VERCEL ? "none" : "local";
}

/** Blob stores are private by default; set BLOB_ACCESS=public if yours is a public store. */
export function blobAccess(): "private" | "public" {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function uploadDir() {
  return `${process.cwd()}/.data/uploads`;
}

/** Checks the badge/task/field really exist and the field takes uploads. */
export function validUploadTarget(badgeId: string, taskId: string, fieldId: string) {
  const badge = getBadge(badgeId);
  const task = badge && getTask(badge, taskId);
  const field = task?.steps.flatMap((s) => s.fields ?? []).find((f) => f.id === fieldId);
  return badge && task && field?.kind === "upload" ? { badge, task, field } : null;
}

export function safeFileName(name: string) {
  const cleaned = name.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, "_").slice(-100);
  return cleaned || "file";
}

export async function recordUpload(row: typeof schema.uploads.$inferInsert) {
  const db = await getDb();
  await db.insert(schema.uploads).values(row);
}

/** Make sure a progress row exists so the task shows as started. */
export async function ensureProgressRow(scoutId: string, badgeId: string, taskId: string) {
  const db = await getDb();
  await db
    .insert(schema.taskProgress)
    .values({ id: crypto.randomUUID(), scoutId, badgeId, taskId })
    .onConflictDoNothing();
}
