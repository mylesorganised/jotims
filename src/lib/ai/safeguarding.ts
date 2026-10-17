import "server-only";
import { logActivity } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import { needsLeaderAttention } from "@/lib/helper/knowledge";
import { jevAsk, jevEnabled, noulOf } from "./jev";

/**
 * Should a leader check in with this young person, based on what they just
 * typed to the helper? Jev reads it in context (so "my Scratch cat is scared
 * of the dog" doesn't trip it); the keyword list is the fallback.
 */
export async function shouldFlagMessage(message: string, earlier: string[] = []) {
  if (!jevEnabled()) return needsLeaderAttention(message);
  try {
    const answers = await jevAsk(
      { young_person_message: message, earlier_messages_from_them: earlier.slice(-3) },
      {
        worry: {
          type: "noul",
          instructions:
            "Does `young_person_message` (read with `earlier_messages_from_them` for context) suggest the young person may be unsafe, upset, bullied, harmed, at risk of harming themselves, or being contacted or pressured by someone in a worrying way, so a trusted adult should check in with them? Talk about characters, games, stories or badge topics like online safety is not a worry on its own.",
        },
      },
    );
    const p = noulOf(answers.worry);
    return Number.isFinite(p) ? p >= 0.5 : needsLeaderAttention(message);
  } catch (error) {
    console.error("Safeguarding check failed, using keywords", error);
    return needsLeaderAttention(message);
  }
}

/** Puts the young person's hand up (if we know the task) and notes it in the activity feed. */
export async function flagForLeaders(scoutId: string, firstName: string, badgeId: string | undefined, taskId: string | undefined, where: string) {
  await logActivity({
    scoutId,
    badgeId,
    taskId,
    kind: "flag",
    actor: firstName,
    message: `said something in the ${where} that a leader should check (see their page)`,
  });
  if (!badgeId || !taskId) return;
  const db = await getDb();
  const now = new Date();
  const helpMessage = `🚩 Flagged from the ${where}: please check in with them.`;
  await db
    .insert(schema.taskProgress)
    .values({ id: crypto.randomUUID(), scoutId, badgeId, taskId, helpRequestedAt: now, helpMessage })
    .onConflictDoUpdate({
      target: [schema.taskProgress.scoutId, schema.taskProgress.badgeId, schema.taskProgress.taskId],
      set: { helpRequestedAt: now, helpMessage },
    });
}
