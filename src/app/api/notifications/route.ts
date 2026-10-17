import { getCurrentScout } from "@/lib/auth";
import { getNotifications, markRead, unreadCount } from "@/lib/notify";

const noStore = { "Cache-Control": "no-store" };

/** New notifications for the signed-in young person (polled by the bell in the header). */
export async function GET(request: Request) {
  const scout = await getCurrentScout();
  if (!scout) return Response.json({ items: [], unread: 0 }, { status: 401, headers: noStore });
  const after = Math.max(0, Math.floor(Number(new URL(request.url).searchParams.get("after")) || 0));
  const [items, unread] = await Promise.all([getNotifications(scout.id, after), unreadCount(scout.id)]);
  return Response.json({ items, unread }, { headers: noStore });
}

/** Mark some (or all) as read: { ids: number[] } or { all: true }. */
export async function POST(request: Request) {
  const scout = await getCurrentScout();
  if (!scout) return Response.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown; all?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is number => Number.isInteger(id)).slice(0, 100) : [];
  await markRead(scout.id, body.all === true ? "all" : ids);
  return Response.json({ ok: true });
}
