"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { badgeName, getBadge, getTask } from "@/content";
import { aiReviewerAvailable, maybeSignOffBadge, reviewSubmission, reviewWaiting } from "@/lib/ai/reviewer";
import { clearLeaderSession, requireLeader, setLeaderSession } from "@/lib/auth";
import { createScout, getProgressById, logActivity, nameKey, tidyName } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import {
  createLeader,
  findLeaderByUsername,
  leaderCount,
  leaderSetupState,
  listLeaders,
  normaliseUsername,
  setLeaderPassword,
  usernameProblem,
} from "@/lib/leaders";
import { clearLoginFailures, loginBlocked, noteLoginFailure, passwordProblem, verifyPassword } from "@/lib/passwords";
import { notify } from "@/lib/notify";
import { saveSettings } from "@/lib/settings";
import { removeStoredFile } from "@/lib/storage";
import { isSection, parseDob, parseSection } from "@/lib/validate";

export type FormState = { error?: string; ok?: string };

function safeNext(next: unknown) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

// ------------------------------------------------------------- accounts

export async function leaderLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await leaderSetupState();
  const username = normaliseUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${username}|${ip}`;
  if (loginBlocked(key)) return { error: "Too many attempts. Wait 15 minutes and try again." };

  const leader = await findLeaderByUsername(username);
  const ok = leader ? await verifyPassword(password, leader.passwordHash) : false;
  if (!leader || !ok) {
    noteLoginFailure(key);
    return { error: "That username and password don't match." };
  }
  clearLoginFailures(key);

  const db = await getDb();
  await db.update(schema.leaders).set({ lastLoginAt: new Date() }).where(eq(schema.leaders.id, leader.id));
  await setLeaderSession(leader.id, leader.displayName);
  redirect(safeNext(formData.get("next")));
}

/** One-time local setup when there are no leader accounts and no env vars. */
export async function firstRunSetupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if ((await leaderSetupState()) !== "first-run") return { error: "Setup has already been done." };
  const username = normaliseUsername(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const problem = usernameProblem(username) ?? passwordProblem(password);
  if (problem) return { error: problem };
  if (!displayName) return { error: "Enter your name, as scouts know you (e.g. Akela)." };
  const leader = await createLeader({ username, displayName, password });
  await setLeaderSession(leader.id, leader.displayName);
  redirect("/admin");
}

export async function leaderLogoutAction() {
  await clearLeaderSession();
  redirect("/admin/login");
}

export async function addLeaderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireLeader();
  const username = normaliseUsername(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const problem = usernameProblem(username) ?? passwordProblem(password);
  if (problem) return { error: problem };
  if (!displayName) return { error: "Enter the leader's name." };
  if (await findLeaderByUsername(username)) return { error: `There's already a leader called ${username}.` };
  await createLeader({ username, displayName, password });
  await logActivity({ kind: "leader", actor: me.name, message: `added leader ${displayName}` });
  refresh();
  return { ok: `Added ${displayName}. They can log in as "${username}".` };
}

export async function resetLeaderPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireLeader();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  const leaders = await listLeaders();
  const target = leaders.find((l) => l.id === id);
  if (!target) return { error: "Leader not found." };
  await setLeaderPassword(id, password);
  return { ok: `Password updated for ${target.displayName}.` };
}

export async function changeOwnPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireLeader();
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const leader = await findLeaderByUsername(me.username);
  if (!leader || !(await verifyPassword(current, leader.passwordHash))) return { error: "Your current password isn't right." };
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  await setLeaderPassword(leader.id, password);
  return { ok: "Your password has been changed." };
}

export async function removeLeaderAction(id: string) {
  const me = await requireLeader();
  if (id === me.id || (await leaderCount()) <= 1) return;
  const db = await getDb();
  await db.delete(schema.leaders).where(eq(schema.leaders.id, id));
  refresh();
}

// ---------------------------------------------------------------- reviews

export async function approveTaskAction(progressId: string, formData: FormData) {
  const leader = await requireLeader();
  const row = await getProgressById(progressId);
  if (!row) return;
  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  const db = await getDb();
  const now = new Date();
  await db
    .update(schema.taskProgress)
    .set({ status: "done", reviewedAt: now, reviewedBy: leader.name, feedback, helpRequestedAt: null, helpMessage: null, updatedAt: now })
    .where(eq(schema.taskProgress.id, progressId));
  const task = taskTitle(row.progress.badgeId, row.progress.taskId);
  await logActivity({
    scoutId: row.scout.id,
    badgeId: row.progress.badgeId,
    taskId: row.progress.taskId,
    kind: "approved",
    actor: leader.name,
    message: `approved "${task}" for ${row.scout.firstName}`,
  });
  await notify(row.scout.id, {
    kind: "approved",
    title: `"${task}" is approved ✅`,
    body: feedback ? `${leader.name}: ${feedback}` : `${leader.name} approved it.`,
    href: `/badges/${row.progress.badgeId}/${row.progress.taskId}`,
  });
  after(() => maybeSignOffBadge(row.scout.id, row.progress.badgeId));
  refresh();
}

export async function requestChangesAction(progressId: string, formData: FormData) {
  const leader = await requireLeader();
  const row = await getProgressById(progressId);
  if (!row) return;
  const feedback = String(formData.get("feedback") ?? "").trim() || "Please have another look at this one.";
  const db = await getDb();
  const now = new Date();
  await db
    .update(schema.taskProgress)
    .set({ status: "changes", reviewedAt: now, reviewedBy: leader.name, feedback, updatedAt: now })
    .where(eq(schema.taskProgress.id, progressId));
  await logActivity({
    scoutId: row.scout.id,
    badgeId: row.progress.badgeId,
    taskId: row.progress.taskId,
    kind: "changes",
    actor: leader.name,
    message: `asked ${row.scout.firstName} to change "${taskTitle(row.progress.badgeId, row.progress.taskId)}"`,
  });
  await notify(row.scout.id, {
    kind: "changes",
    title: `"${taskTitle(row.progress.badgeId, row.progress.taskId)}" needs a little more ✏️`,
    body: `${leader.name}: ${feedback}`,
    href: `/badges/${row.progress.badgeId}/${row.progress.taskId}`,
  });
  refresh();
}

/** Tick a task off directly, e.g. it was done on paper or watched in person. */
export async function leaderMarkDoneAction(scoutId: string, badgeId: string, taskId: string) {
  const leader = await requireLeader();
  if (!getBadge(badgeId) || !taskTitle(badgeId, taskId)) return;
  const db = await getDb();
  const now = new Date();
  await db
    .insert(schema.taskProgress)
    .values({ id: crypto.randomUUID(), scoutId, badgeId, taskId, status: "done", reviewedAt: now, reviewedBy: leader.name })
    .onConflictDoUpdate({
      target: [schema.taskProgress.scoutId, schema.taskProgress.badgeId, schema.taskProgress.taskId],
      set: { status: "done", reviewedAt: now, reviewedBy: leader.name, helpRequestedAt: null, helpMessage: null, updatedAt: now },
    });
  await logActivity({ scoutId, badgeId, taskId, kind: "approved", actor: leader.name, message: `ticked off "${taskTitle(badgeId, taskId)}"` });
  await notify(scoutId, {
    kind: "approved",
    title: `"${taskTitle(badgeId, taskId)}" is ticked off ✅`,
    body: `${leader.name} marked it as done.`,
    href: `/badges/${badgeId}/${taskId}`,
  });
  after(() => maybeSignOffBadge(scoutId, badgeId));
  refresh();
}

/** Put a task back to "in progress" so the scout can work on it again. */
export async function leaderReopenTaskAction(scoutId: string, badgeId: string, taskId: string) {
  await requireLeader();
  const db = await getDb();
  await db
    .update(schema.taskProgress)
    .set({ status: "draft", updatedAt: new Date() })
    .where(
      and(
        eq(schema.taskProgress.scoutId, scoutId),
        eq(schema.taskProgress.badgeId, badgeId),
        eq(schema.taskProgress.taskId, taskId),
      ),
    );
  refresh();
}

export async function resolveHelpAction(progressId: string) {
  await requireLeader();
  const db = await getDb();
  await db
    .update(schema.taskProgress)
    .set({ helpRequestedAt: null, helpMessage: null })
    .where(eq(schema.taskProgress.id, progressId));
  refresh();
}

export async function signOffBadgeAction(scoutId: string, badgeId: string, formData: FormData) {
  const leader = await requireLeader();
  const badge = getBadge(badgeId);
  if (!badge) return;
  const note = String(formData.get("note") ?? "").trim() || null;
  const db = await getDb();
  const inserted = await db
    .insert(schema.badgeAwards)
    .values({ scoutId, badgeId, signedOffBy: leader.name, note })
    .onConflictDoNothing()
    .returning({ badgeId: schema.badgeAwards.badgeId });
  const name = badgeName(badge);
  await logActivity({ scoutId, badgeId, kind: "awarded", actor: leader.name, message: `signed off the ${name} badge` });
  if (inserted.length) {
    await notify(scoutId, {
      kind: "awarded",
      title: `You've earned ${name}! 🎉`,
      body: note ? `${leader.name}: ${note}` : `${leader.name} signed it off. Brilliant work!`,
      href: `/badges/${badgeId}`,
    });
  }
  refresh();
}

export async function revokeBadgeAction(scoutId: string, badgeId: string) {
  const leader = await requireLeader();
  const db = await getDb();
  await db
    .delete(schema.badgeAwards)
    .where(and(eq(schema.badgeAwards.scoutId, scoutId), eq(schema.badgeAwards.badgeId, badgeId)));
  await logActivity({ scoutId, badgeId, kind: "revoked", actor: leader.name, message: "removed a badge sign-off" });
  refresh();
}

/** Ask the AI leader to look at one submission now. */
export async function aiReviewAction(progressId: string) {
  await requireLeader();
  if (!aiReviewerAvailable()) return;
  await reviewSubmission(progressId, { auto: false });
  refresh();
}

/** Ask the AI leader to work through everything waiting, in the background. */
export async function aiReviewAllAction() {
  await requireLeader();
  if (!aiReviewerAvailable()) return;
  after(async () => {
    await reviewWaiting();
  });
  refresh();
}

function taskTitle(badgeId: string, taskId: string) {
  const badge = getBadge(badgeId);
  return (badge && getTask(badge, taskId)?.title) ?? "";
}

// ----------------------------------------------------------------- scouts

export async function addScoutAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const leader = await requireLeader();
  const first = String(formData.get("first") ?? "").trim();
  const last = String(formData.get("last") ?? "").trim();
  const dob = parseDob(String(formData.get("dob") ?? ""));
  const section = formData.get("section");
  if (!first || !last) return { error: "Enter a first and last name." };
  if (!dob) return { error: "Enter a date of birth like 05/09/2016." };
  if (!isSection(section)) return { error: "Choose a section." };
  try {
    await createScout({ firstName: first, lastName: last, dob, section });
  } catch {
    return { error: `${first} ${last} with that birthday is already on the list.` };
  }
  await logActivity({ kind: "scout", actor: leader.name, message: `added ${tidyName(first)} ${tidyName(last)}` });
  refresh();
  return { ok: `Added ${tidyName(first)} ${tidyName(last)}.` };
}

/** Paste one young person per line: First, Last, DD/MM/YYYY, Section */
export async function importScoutsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const leader = await requireLeader();
  const fallback = formData.get("section");
  const lines = String(formData.get("rows") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let added = 0;
  const problems: string[] = [];
  for (const [i, line] of lines.entries()) {
    const cells = line.split(/\t|,/).map((c) => c.trim());
    if (i === 0 && /first/i.test(cells[0] ?? "")) continue; // header row
    const [first, last, dobText, sectionText] = cells;
    const dob = parseDob(dobText ?? "");
    const section = sectionText ? parseSection(sectionText) : isSection(fallback) ? fallback : null;
    if (!first || !last || !dob || !section) {
      problems.push(`Line ${i + 1}: "${line}"`);
      continue;
    }
    try {
      await createScout({ firstName: first, lastName: last, dob, section });
      added++;
    } catch {
      problems.push(`Line ${i + 1}: ${first} ${last} is already on the list`);
    }
  }
  if (added) await logActivity({ kind: "scout", actor: leader.name, message: `imported ${added} young people` });
  refresh();
  return {
    ok: `Added ${added} ${added === 1 ? "person" : "people"}.`,
    error: problems.length ? `Skipped ${problems.length}: ${problems.slice(0, 8).join("; ")}${problems.length > 8 ? "…" : ""}` : undefined,
  };
}

export async function updateScoutAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireLeader();
  const id = String(formData.get("id") ?? "");
  const first = String(formData.get("first") ?? "").trim();
  const last = String(formData.get("last") ?? "").trim();
  const dob = parseDob(String(formData.get("dob") ?? ""));
  const section = formData.get("section");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!first || !last) return { error: "Enter a first and last name." };
  if (!dob) return { error: "Enter a date of birth like 05/09/2016." };
  if (!isSection(section)) return { error: "Choose a section." };
  const db = await getDb();
  try {
    await db
      .update(schema.scouts)
      .set({ firstName: tidyName(first), lastName: tidyName(last), dob, section, notes, nameKey: nameKey(first, last, dob) })
      .where(eq(schema.scouts.id, id));
  } catch {
    return { error: "Another young person already has that name and birthday." };
  }
  refresh();
  return { ok: "Saved." };
}

export async function deleteScoutAction(id: string) {
  const leader = await requireLeader();
  const db = await getDb();
  const [scout] = await db.select().from(schema.scouts).where(eq(schema.scouts.id, id));
  if (!scout) return;
  const files = await db.select().from(schema.uploads).where(eq(schema.uploads.scoutId, id));
  for (const f of files) await removeStoredFile(f);
  await db.delete(schema.scouts).where(eq(schema.scouts.id, id));
  await logActivity({ kind: "scout", actor: leader.name, message: `removed ${scout.firstName} ${scout.lastName}` });
  redirect("/admin/scouts");
}

// --------------------------------------------------------------- settings

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireLeader();
  await saveSettings({
    allowSignup: formData.get("allowSignup") === "on",
    groupCode: String(formData.get("groupCode") ?? "").trim().slice(0, 40),
    eventName: String(formData.get("eventName") ?? "").trim().slice(0, 80) || "JOTA-JOTI",
    groupJid: String(formData.get("groupJid") ?? "").trim().toUpperCase().slice(0, 20),
    // The AI switches are only on the form when the AI is configured; keep them as they were otherwise.
    ...(formData.get("aiShown")
      ? {
          aiReview: formData.get("aiReview") === "on",
          aiSignOff: formData.get("aiSignOff") === "on",
          aiApproveInPerson: formData.get("aiApproveInPerson") === "on",
        }
      : {}),
  });
  refresh();
  return { ok: "Settings saved." };
}
