import { getBadge, getTask } from "@/content";
import { explainAvailable, explainTurn, getExplanation, publicExplanation, startExplanation } from "@/lib/ai/explain";
import { getCurrentScout } from "@/lib/auth";
import { getTaskRecord } from "@/lib/data";
import { overHelperLimit } from "@/lib/helper/openrouter";
import { badgeLockFor, lockMessage } from "@/lib/locks";

const noStore = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore });

/** Find the explain step this request is about, checking it really is one. */
function lookup(badgeId: unknown, taskId: unknown, step: unknown) {
  const badge = typeof badgeId === "string" ? getBadge(badgeId) : undefined;
  const task = badge && typeof taskId === "string" ? getTask(badge, taskId) : undefined;
  const index = Number(step);
  const def = task && Number.isInteger(index) ? task.steps[index]?.explain : undefined;
  return badge && task && def ? { badge, task, index, def } : null;
}

export async function GET(request: Request) {
  const scout = await getCurrentScout();
  if (!scout) return json({ error: "Please log in again." }, 401);
  const url = new URL(request.url);
  const found = lookup(url.searchParams.get("badgeId"), url.searchParams.get("taskId"), url.searchParams.get("step"));
  if (!found) return json({ error: "Not an explain step." }, 404);
  const row = await getExplanation(scout.id, found.badge.id, found.task.id, found.index);
  return json({ available: explainAvailable(), explanation: publicExplanation(row) });
}

export async function POST(request: Request) {
  const scout = await getCurrentScout();
  if (!scout) return json({ error: "Please log in again." }, 401);
  if (!explainAvailable()) return json({ error: "The AI leader isn't switched on. Explain it to a real leader instead." }, 503);
  const body = (await request.json().catch(() => ({}))) as { badgeId?: unknown; taskId?: unknown; step?: unknown; action?: unknown; message?: unknown };
  const found = lookup(body.badgeId, body.taskId, body.step);
  if (!found) return json({ error: "Not an explain step." }, 404);
  const { badge, task, index, def } = found;

  const before = await badgeLockFor(scout.id, badge);
  if (before) return json({ error: lockMessage(before) }, 409);
  const record = await getTaskRecord(scout.id, badge.id, task.id);
  if (record?.status === "submitted" || record?.status === "done") {
    return json({ error: "This task has already been sent to a leader." }, 409);
  }

  const row = await getExplanation(scout.id, badge.id, task.id, index);
  if (body.action === "start" || body.action === "restart") {
    if (row?.status === "passed") return json({ explanation: publicExplanation(row) });
    if (row && body.action === "start") return json({ explanation: publicExplanation(row) });
    return json({ explanation: publicExplanation(await startExplanation(scout, badge.id, task.id, index, def)) });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return json({ error: "Type your explanation first." }, 400);
  if (!row) return json({ error: "Start the chat first." }, 409);
  if (row.status !== "chatting") return json({ explanation: publicExplanation(row) });
  if (overHelperLimit(`explain:${scout.id}`)) return json({ error: "That's a lot of messages! Have a short break, or explain it to a real leader." }, 429);

  try {
    const updated = await explainTurn({ scout, badge, task, def, row, message });
    return json({ explanation: publicExplanation(updated) });
  } catch (error) {
    console.error("Explain turn failed", error);
    return json({ error: "Sorry, the AI leader couldn't answer just now. Try again in a minute, or explain it to a real leader." }, 502);
  }
}
