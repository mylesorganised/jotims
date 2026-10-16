"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getBadge, getTask, type TaskDef } from "@/content";
import { missingFields, type Missing } from "@/lib/answers";
import { clearScoutSession, requireScout, setScoutSession, type CurrentScout } from "@/lib/auth";
import { createScout, findScoutByLogin, getTaskRecord, getTaskUploads, logActivity, touchScout } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import type { Answers } from "@/lib/db/schema";
import { badgeLockFor, lockMessage } from "@/lib/locks";
import { getSettings } from "@/lib/settings";
import { removeStoredFile } from "@/lib/storage";
import { ensureProgressRow, recordUpload, uploadMode, validUploadTarget } from "@/lib/uploads";
import { isSection, makeDob, sanitiseAnswers } from "@/lib/validate";

// ------------------------------------------------------------------ login

export type LoginState = {
  error?: string;
  /** "signup" = we didn't find them, ask which section they're in */
  step?: "signup";
  values?: { first: string; last: string; day: string; month: string; year: string; code: string };
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const values = {
    first: String(formData.get("first") ?? "").trim(),
    last: String(formData.get("last") ?? "").trim(),
    day: String(formData.get("day") ?? ""),
    month: String(formData.get("month") ?? ""),
    year: String(formData.get("year") ?? ""),
    code: String(formData.get("code") ?? "").trim(),
  };
  const section = formData.get("section");

  if (!values.first || !values.last) return { error: "Please type your first name and last name.", values };
  const dob = makeDob(values.day, values.month, values.year);
  if (!dob) return { error: "Please choose your birthday (day, month and year).", values };

  const settings = await getSettings();
  if (settings.groupCode && values.code.toLowerCase() !== settings.groupCode.toLowerCase()) {
    return { error: "That group code isn't right. Ask a leader for the code.", values };
  }

  let scout: { id: string; firstName: string } | null = await findScoutByLogin(values.first, values.last, dob);

  if (!scout) {
    if (!settings.allowSignup) {
      return {
        error: "We couldn't find you. Check your name and birthday are spelt the same as when you joined, or ask a leader to add you.",
        values,
      };
    }
    if (!isSection(section)) return { step: "signup", values };
    scout = await createScout({ firstName: values.first, lastName: values.last, dob, section });
    await logActivity({ scoutId: scout.id, kind: "joined", actor: scout.firstName, message: "joined the badge tracker" });
  }

  await touchScout(scout.id);
  await setScoutSession(scout.id);
  redirect("/home");
}

export async function logoutAction() {
  await clearScoutSession();
  redirect("/");
}

// ------------------------------------------------------------------ tasks

function lookup(badgeId: string, taskId: string) {
  const badge = getBadge(badgeId);
  const task = badge && getTask(badge, taskId);
  if (!badge || !task) throw new Error("Unknown badge or task");
  return { badge, task };
}

function isLocked(task: TaskDef, status: string | undefined) {
  return status === "submitted" || (status === "done" && task.review === "leader");
}

async function upsertAnswers(scout: CurrentScout, badgeId: string, task: TaskDef, answers: Answers, stepReached: number) {
  const db = await getDb();
  const now = new Date();
  await db
    .insert(schema.taskProgress)
    .values({
      id: crypto.randomUUID(),
      scoutId: scout.id,
      badgeId,
      taskId: task.id,
      answers,
      stepReached,
    })
    .onConflictDoUpdate({
      target: [schema.taskProgress.scoutId, schema.taskProgress.badgeId, schema.taskProgress.taskId],
      set: {
        answers,
        stepReached: sql`greatest(${schema.taskProgress.stepReached}, ${stepReached})`,
        updatedAt: now,
      },
    });
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveAnswersAction(
  badgeId: string,
  taskId: string,
  rawAnswers: unknown,
  stepReached: number,
): Promise<SaveResult> {
  const scout = await requireScout();
  const { badge, task } = lookup(badgeId, taskId);
  const before = await badgeLockFor(scout.id, badge);
  if (before) return { ok: false, error: lockMessage(before) };
  const existing = await getTaskRecord(scout.id, badgeId, taskId);
  if (isLocked(task, existing?.status)) return { ok: false, error: "This task is locked while a leader looks at it." };
  const step = Math.max(0, Math.min(task.steps.length, Math.floor(Number(stepReached) || 0)));
  await upsertAnswers(scout, badgeId, task, sanitiseAnswers(task, rawAnswers), step);
  return { ok: true };
}

export type SubmitResult = { ok: true; status: "done" | "submitted" } | { ok: false; error?: string; missing?: Missing[] };

export async function submitTaskAction(badgeId: string, taskId: string, rawAnswers: unknown): Promise<SubmitResult> {
  const scout = await requireScout();
  const { badge, task } = lookup(badgeId, taskId);
  const before = await badgeLockFor(scout.id, badge);
  if (before) return { ok: false, error: lockMessage(before) };
  const existing = await getTaskRecord(scout.id, badgeId, taskId);
  if (isLocked(task, existing?.status)) return { ok: false, error: "This task has already been sent to a leader." };

  const answers = sanitiseAnswers(task, rawAnswers);
  await upsertAnswers(scout, badgeId, task, answers, task.steps.length);

  const uploads = await getTaskUploads(scout.id, badgeId, taskId);
  const counts: Record<string, number> = {};
  for (const u of uploads) counts[u.fieldId] = (counts[u.fieldId] ?? 0) + 1;
  // If uploads are switched off on this deployment, don't block on them.
  if (uploadMode() === "none") {
    for (const f of task.steps.flatMap((s) => s.fields ?? [])) if (f.kind === "upload") counts[f.id] = 1;
  }
  const missing = missingFields(task, answers, counts);
  if (missing.length) return { ok: false, missing };

  const status = task.review === "self" ? "done" : "submitted";
  const db = await getDb();
  const now = new Date();
  await db
    .update(schema.taskProgress)
    .set({ status, submittedAt: now, updatedAt: now, helpRequestedAt: null, helpMessage: null })
    .where(
      and(
        eq(schema.taskProgress.scoutId, scout.id),
        eq(schema.taskProgress.badgeId, badgeId),
        eq(schema.taskProgress.taskId, taskId),
      ),
    );
  await logActivity({
    scoutId: scout.id,
    badgeId,
    taskId,
    kind: status,
    actor: scout.firstName,
    message: status === "done" ? `finished "${task.title}"` : `sent "${task.title}" to a leader`,
  });
  refresh();
  return { ok: true, status };
}

/** Pull a task back to edit it: a finished self-check task, or one still waiting for a leader. */
export async function reopenTaskAction(badgeId: string, taskId: string) {
  const scout = await requireScout();
  const { task } = lookup(badgeId, taskId);
  const existing = await getTaskRecord(scout.id, badgeId, taskId);
  if (!existing) return;
  const allowed = existing.status === "submitted" || (existing.status === "done" && task.review === "self");
  if (!allowed) return;
  const db = await getDb();
  await db
    .update(schema.taskProgress)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(schema.taskProgress.id, existing.id));
  refresh();
}

export async function requestHelpAction(badgeId: string, taskId: string, message: string) {
  const scout = await requireScout();
  const { badge, task } = lookup(badgeId, taskId);
  if (await badgeLockFor(scout.id, badge)) return;
  const db = await getDb();
  const now = new Date();
  const helpMessage = message.trim().slice(0, 500) || null;
  await db
    .insert(schema.taskProgress)
    .values({ id: crypto.randomUUID(), scoutId: scout.id, badgeId, taskId, helpRequestedAt: now, helpMessage })
    .onConflictDoUpdate({
      target: [schema.taskProgress.scoutId, schema.taskProgress.badgeId, schema.taskProgress.taskId],
      set: { helpRequestedAt: now, helpMessage },
    });
  await logActivity({
    scoutId: scout.id,
    badgeId,
    taskId,
    kind: "help",
    actor: scout.firstName,
    message: `asked for help with "${task.title}"`,
  });
  refresh();
}

export async function cancelHelpAction(badgeId: string, taskId: string) {
  const scout = await requireScout();
  const db = await getDb();
  await db
    .update(schema.taskProgress)
    .set({ helpRequestedAt: null, helpMessage: null })
    .where(
      and(
        eq(schema.taskProgress.scoutId, scout.id),
        eq(schema.taskProgress.badgeId, badgeId),
        eq(schema.taskProgress.taskId, taskId),
      ),
    );
  refresh();
}

// ---------------------------------------------------------------- uploads

export async function deleteUploadAction(uploadId: string): Promise<SaveResult> {
  const scout = await requireScout();
  const db = await getDb();
  const [upload] = await db
    .select()
    .from(schema.uploads)
    .where(and(eq(schema.uploads.id, uploadId), eq(schema.uploads.scoutId, scout.id)));
  if (!upload) return { ok: false, error: "File not found" };
  const { task } = lookup(upload.badgeId, upload.taskId);
  const record = await getTaskRecord(scout.id, upload.badgeId, upload.taskId);
  if (isLocked(task, record?.status)) return { ok: false, error: "This task is locked while a leader looks at it." };
  await db.delete(schema.uploads).where(eq(schema.uploads.id, upload.id));
  await removeStoredFile(upload);
  return { ok: true };
}

export type RecordedUpload = { id: string; fileName: string; contentType: string; size: number };

/** Called after the browser has uploaded straight to Vercel Blob. */
export async function recordBlobUploadAction(input: {
  pathname: string;
  fileName: string;
  badgeId: string;
  taskId: string;
  fieldId: string;
}): Promise<{ ok: true; upload: RecordedUpload } | { ok: false; error: string }> {
  const scout = await requireScout();
  if (uploadMode() !== "blob") return { ok: false, error: "Blob uploads are not enabled" };
  const target = validUploadTarget(input.badgeId, input.taskId, input.fieldId);
  if (!target) return { ok: false, error: "Unknown upload field" };
  const before = await badgeLockFor(scout.id, target.badge);
  if (before) return { ok: false, error: lockMessage(before) };
  if (!input.pathname.startsWith(`evidence/${scout.id}/`)) return { ok: false, error: "Not your file" };

  const { head } = await import("@vercel/blob");
  const info = await head(input.pathname).catch(() => null);
  if (!info) return { ok: false, error: "Upload not found" };

  const upload = {
    id: crypto.randomUUID(),
    scoutId: scout.id,
    badgeId: input.badgeId,
    taskId: input.taskId,
    fieldId: input.fieldId,
    storage: "blob" as const,
    storageKey: info.pathname,
    fileName: input.fileName.slice(0, 200),
    contentType: info.contentType || "application/octet-stream",
    size: info.size,
  };
  await ensureProgressRow(scout.id, input.badgeId, input.taskId);
  await recordUpload(upload);
  return { ok: true, upload: { id: upload.id, fileName: upload.fileName, contentType: upload.contentType, size: upload.size } };
}
