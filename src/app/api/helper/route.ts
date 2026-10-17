import { getBadge, getTask } from "@/content";
import { getCurrentScout, getLeader } from "@/lib/auth";
import { getScoutOverview, logHelperMessages } from "@/lib/data";
import { flagForLeaders, shouldFlagMessage } from "@/lib/ai/safeguarding";
import { leaderSystemPrompt, scoutSystemPrompt } from "@/lib/helper/knowledge";
import { helperEnabled, overHelperLimit, streamChat, type ChatMessage } from "@/lib/helper/openrouter";

type Body = {
  mode?: "scout" | "leader";
  conversationId?: string;
  messages?: { role?: string; content?: string }[];
  context?: { badgeId?: string; taskId?: string; step?: number; path?: string };
};

const MAX_HISTORY = 12;
const MAX_CHARS = 1200;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only a plain app path like /badges/x, never arbitrary text. */
function safePath(path: unknown) {
  return typeof path === "string" && /^\/[\w\-/]{0,120}$/.test(path) ? path : undefined;
}

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
  let leader: { id: string; name: string } | null = null;
  const conversationId = typeof body.conversationId === "string" && UUID.test(body.conversationId) ? body.conversationId : crypto.randomUUID();
  const page = safePath(body.context?.path) ?? null;
  let badgeId: string | undefined;
  let taskId: string | undefined;
  let flagged: Promise<boolean> = Promise.resolve(false);

  if (body.mode === "leader") {
    leader = await getLeader();
    if (!leader) return text("Please log in again.", 401);
    if (overHelperLimit(`leader:${leader.id}`)) return text("That's a lot of questions! Have a short break and try again soon.", 429);
    system = leaderSystemPrompt(safePath(body.context?.path));
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
    system = scoutSystemPrompt({
      section: scout.section,
      badgeId,
      taskId,
      step,
      statuses,
      awardedBadgeIds: [...awards.keys()],
      path: safePath(body.context?.path),
    });

    // Checked alongside the reply so it doesn't slow the helper down.
    const earlier = history.slice(0, -1).filter((m) => m.role === "user").map((m) => m.content);
    flagged = shouldFlagMessage(question.content, earlier).then(async (worry) => {
      if (worry) await flagForLeaders(scout.id, scout.firstName, badgeId, taskId, "helper chat");
      return worry;
    });
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
      // Every chat is kept for leaders to read in Helper chats.
      const who = scoutId ? { scoutId } : { leaderId: leader?.id, leaderName: leader?.name };
      const where = { ...who, conversationId, page, badgeId, taskId };
      await logHelperMessages([
        { ...where, role: "user", content: question.content, flagged: (await flagged.catch(() => false)) ? 1 : 0 },
        { ...where, role: "assistant", content: reply || "(no reply)" },
      ]).catch((error) => console.error("Could not log helper chat", error));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
