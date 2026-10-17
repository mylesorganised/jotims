import { getBadge, getTask } from "@/content";
import { getLeader } from "@/lib/auth";
import { allHelperMessages } from "@/lib/chat-logs";
import { csvCell } from "@/lib/csv";

/** Every helper chat message, one row each, grouped by conversation. */
export async function GET() {
  const leader = await getLeader();
  if (!leader) return new Response("Not allowed", { status: 403 });

  const rows = await allHelperMessages();
  const header = ["Conversation", "Time (UTC)", "Who", "Section", "Role", "Message", "Flagged", "Badge", "Task", "Page"];
  const lines = [header.map(csvCell).join(",")];
  for (const { message: m, firstName, lastName, section, key } of rows) {
    const badge = m.badgeId ? getBadge(m.badgeId) : undefined;
    const task = badge && m.taskId ? getTask(badge, m.taskId) : undefined;
    const who = m.scoutId ? `${firstName ?? ""} ${lastName ?? ""}`.trim() : `Leader: ${m.leaderName ?? "unknown"}`;
    lines.push(
      [key, m.createdAt.toISOString().replace("T", " ").slice(0, 19), who, section ?? "", m.role === "user" ? "Question" : "Helper", m.content, m.flagged ? "yes" : "", badge?.title ?? "", task?.title ?? "", m.page ?? ""]
        .map(csvCell)
        .join(","),
    );
  }
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="helper-chats-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
