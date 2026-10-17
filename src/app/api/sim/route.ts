import { getBadge, getTask } from "@/content";
import { getExplanation } from "@/lib/ai/explain";
import { publicSim, simAvailable, simTurn, startSim, type SimKind } from "@/lib/ai/sim";
import { getCurrentScout } from "@/lib/auth";
import { getTaskRecord } from "@/lib/data";
import { overHelperLimit } from "@/lib/helper/openrouter";
import { badgeLockFor, lockMessage } from "@/lib/locks";

const noStore = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore });

/** The pretend-message step this request is about, checking it really is one. */
function lookup(badgeId: unknown, taskId: unknown, step: unknown) {
  const badge = typeof badgeId === "string" ? getBadge(badgeId) : undefined;
  const task = badge && typeof taskId === "string" ? getTask(badge, taskId) : undefined;
  const index = Number(step);
  const def = task && Number.isInteger(index) ? task.steps[index]?.simulate : undefined;
  return badge && task && def ? { badge, task, index, def } : null;
}

function kindFor(def: { kind: "email" | "sms" | "either" }, asked: unknown): SimKind {
  if (def.kind !== "either") return def.kind;
  return asked === "sms" ? "sms" : "email";
}

export async function GET(request: Request) {
  const scout = await getCurrentScout();
  if (!scout) return json({ error: "Please log in again." }, 401);
  const url = new URL(request.url);
  const found = lookup(url.searchParams.get("badgeId"), url.searchParams.get("taskId"), url.searchParams.get("step"));
  if (!found) return json({ error: "Not a messaging step." }, 404);
  const row = await getExplanation(scout.id, found.badge.id, found.task.id, found.index);
  return json({ available: simAvailable(), sim: publicSim(row) });
}

export async function POST(request: Request) {
  const scout = await getCurrentScout();
  if (!scout) return json({ error: "Please log in again." }, 401);
  if (!simAvailable()) return json({ error: "The AI leader isn't switched on. Send a real message to a leader instead." }, 503);
  const body = (await request.json().catch(() => ({}))) as {
    badgeId?: unknown;
    taskId?: unknown;
    step?: unknown;
    action?: unknown;
    kind?: unknown;
    subject?: unknown;
    text?: unknown;
    typingMs?: unknown;
  };
  const found = lookup(body.badgeId, body.taskId, body.step);
  if (!found) return json({ error: "Not a messaging step." }, 404);
  const { badge, task, index, def } = found;

  const before = await badgeLockFor(scout.id, badge);
  if (before) return json({ error: lockMessage(before) }, 409);
  const record = await getTaskRecord(scout.id, badge.id, task.id);
  if (record?.status === "submitted" || record?.status === "done") {
    return json({ error: "This task has already been sent." }, 409);
  }

  if (body.action === "start") {
    const row = await startSim(scout, badge.id, task.id, index, def, kindFor(def, body.kind));
    return json({ sim: publicSim(row) });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return json({ error: "Write your message first." }, 400);
  const row = await getExplanation(scout.id, badge.id, task.id, index);
  if (!row || row.kind === "explain") return json({ error: "Open the inbox or phone first." }, 409);
  if (row.status === "passed") return json({ sim: publicSim(row) });
  if (overHelperLimit(`sim:${scout.id}`)) return json({ error: "That's a lot of messages! Have a short break and try again." }, 429);

  try {
    const typingMs = typeof body.typingMs === "number" && body.typingMs > 0 ? body.typingMs : undefined;
    const subject = typeof body.subject === "string" ? body.subject : undefined;
    const result = await simTurn({ scout, badge, task, step: index, def, row, message: { subject, text }, typingMs });
    return json({ sim: publicSim(result.row), filled: result.filled, finishing: result.finishing });
  } catch (error) {
    console.error("Sim turn failed", error);
    return json({ error: "Akela couldn't reply just now. Try again in a minute." }, 502);
  }
}
