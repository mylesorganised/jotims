import { BADGES, getBadge, getTask } from "@/content";
import { getCurrentScout, getLeader } from "@/lib/auth";
import { getScoutOverview, logActivity, logHelperMessages } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import { leaderSystemPrompt, needsLeaderAttention, scoutSystemPrompt } from "@/lib/helper/knowledge";
import { helperEnabled, overHelperLimit, streamChat, type ChatMessage } from "@/lib/helper/openrouter";
import { lockedBy } from "@/lib/progress";

type Body = {
  mode?: "scout" | "leader";
  messages?: { role?: string; content?: string }[];
  context?: { badgeId?: string; taskId?: string; step?: number };
};

const MAX_HISTORY = 12;
const MAX_CHARS = 1200;

function text(message: string, status: number) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

// Streams the helper's reply as plain text. The system prompt (badge content,
// app guide, safety rules) is built here from IDs, never from client text.
export async function POST(request: Request) {
  if (!helperEnabled()) return text("The helper isn't switched on yet.", 503);
  const body = (await request.json().catch(() => ({}))) as Body;

  const history: ChatMessage[] = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content!.slice(0, MAX_CHARS) }));
  const question = history.at(-1);
  if (!question || question.role !== "user") return text("Ask me something!", 400);

  let system: string;
  let scoutId: string | null = null;
  let badgeId: string | undefined;
  let taskId: string | undefined;

  if (body.mode === "leader") {
    const leader = await getLeader();
    if (!leader) return text("Please log in again.", 401);
    if (overHelperLimit(`leader:${leader.id}`)) return text("That's a lot of questions! Have a short break and try again soon.", 429);
    system = leaderSystemPrompt();
  } else {
    const scout = await getCurrentScout();
    if (!scout) return text("Please log in again.", 401);
    if (overHelperLimit(`scout:${scout.id}`)) return text("That's a lot of questions! Have a short break, or ask a leader.", 429);
    scoutId = scout.id;

    const badge = body.context?.badgeId ? getBadge(body.context.badgeId) : undefined;
    const task = badge && body.context?.taskId ? getTask(badge, body.context.taskId) : undefined;
    badgeId = badge?.id;
    taskId = task?.id;
    const step = typeof body.context?.step === "number" && task ? Math.max(0, Math.min(task.steps.length, body.context.step)) : undefined;

    const { statuses, awards } = await getScoutOverview(scout.id);
    const locked = BADGES.filter((b) => b.sections.includes(scout.section) && lockedBy(b, statuses, (id) => awards.has(id))).map((b) => b.id);
    system = scoutSystemPrompt({ section: scout.section, badgeId, taskId, step, statuses, lockedBadgeIds: locked });

    if (needsLeaderAttention(question.content)) await flagForLeaders(scout.id, scout.firstName, badgeId, taskId);
  }

  const origin = new URL(request.url).origin;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let reply = "";
      try {
        for await (const chunk of streamChat([{ role: "system", content: system }, ...history], origin, request.signal)) {
          reply += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("Helper error", error);
          const sorry = "Sorry, I'm having trouble right now. Try again in a minute, or ask a leader. 🙂";
          const added = reply ? `\n\n${sorry}` : sorry;
          reply += added;
          controller.enqueue(encoder.encode(added));
        }
      }
      if (scoutId) {
        await logHelperMessages([
          { scoutId, badgeId, taskId, role: "user", content: question.content, flagged: needsLeaderAttention(question.content) ? 1 : 0 },
          { scoutId, badgeId, taskId, role: "assistant", content: reply || "(no reply)" },
        ]).catch((error) => console.error("Could not log helper chat", error));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}

/** Puts the young person's hand up (if we know the task) and notes it in the activity feed. */
async function flagForLeaders(scoutId: string, firstName: string, badgeId?: string, taskId?: string) {
  await logActivity({
    scoutId,
    badgeId,
    taskId,
    kind: "flag",
    actor: firstName,
    message: "said something to the helper that a leader should check (see their page)",
  });
  if (!badgeId || !taskId) return;
  const db = await getDb();
  const now = new Date();
  const helpMessage = "🚩 Flagged from the helper chat: please check in with them (their chat is on their page).";
  await db
    .insert(schema.taskProgress)
    .values({ id: crypto.randomUUID(), scoutId, badgeId, taskId, helpRequestedAt: now, helpMessage })
    .onConflictDoUpdate({
      target: [schema.taskProgress.scoutId, schema.taskProgress.badgeId, schema.taskProgress.taskId],
      set: { helpRequestedAt: now, helpMessage },
    });
}
