import type { Metadata } from "next";
import Link from "next/link";
import { Download, MessagesSquare, Search, X } from "lucide-react";
import { SectionPill } from "@/components/status";
import { buttonClass, Card, cn, inputClass, PageTitle } from "@/components/ui";
import { getBadge, getTask } from "@/content";
import type { Section } from "@/lib/db/schema";
import { requireLeader } from "@/lib/auth";
import { chatStats, listConversations, type ChatFilter } from "@/lib/chat-logs";
import { getScout, requestTime } from "@/lib/data";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Helper chats" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

const FILTERS: { id: ChatFilter; label: string; count: "conversations" | "young" | "leaders" | "flagged" }[] = [
  { id: "all", label: "All", count: "conversations" },
  { id: "young", label: "Young people", count: "young" },
  { id: "leaders", label: "Leaders", count: "leaders" },
  { id: "flagged", label: "🚩 Flagged", count: "flagged" },
];

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ChatsPage({ searchParams }: PageProps<"/admin/chats">) {
  await requireLeader();
  const params = await searchParams;
  const filter = (FILTERS.find((f) => f.id === one(params.filter))?.id ?? "all") as ChatFilter;
  const q = one(params.q)?.slice(0, 100) ?? "";
  const scoutId = one(params.scout);
  const limit = Math.min(500, Math.max(60, Number(one(params.limit)) || 60));

  const [conversations, stats, scout] = await Promise.all([
    listConversations({ filter, q, scoutId, limit: limit + 1 }),
    chatStats(),
    scoutId ? getScout(scoutId) : Promise.resolve(null),
  ]);
  const now = await requestTime();
  const more = conversations.length > limit;

  const href = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { filter: filter === "all" ? undefined : filter, q: q || undefined, scout: scoutId, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/chats?${s}` : "/admin/chats";
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Helper chats"
        subtitle={`Every question asked to the AI helper, with its full answers. ${stats.questionsToday} question${stats.questionsToday === 1 ? "" : "s"} in the last 24 hours.`}
        actions={
          <a href="/api/admin/export/chats" className={buttonClass("secondary", "sm")}>
            <Download className="size-4" /> Download all (CSV)
          </a>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-line" data-tour="chats-filters">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={href({ filter: f.id === "all" ? undefined : f.id, limit: undefined })}
              className={cn(
                "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-bold",
                filter === f.id ? (f.id === "flagged" ? "bg-rose-600 text-white" : "bg-brand-500 text-white") : "text-muted hover:text-ink",
              )}
            >
              {f.label} ({stats[f.count]})
            </Link>
          ))}
        </div>
        <form action="/admin/chats" className="relative flex-1" data-tour="chats-search">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          {scoutId && <input type="hidden" name="scout" value={scoutId} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search questions, answers or names" className={cn(inputClass, "pl-9")} />
        </form>
      </div>

      {scout && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          Showing chats from <b>{scout.firstName} {scout.lastName}</b>
          <Link href={href({ scout: undefined })} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 font-bold text-muted hover:text-ink">
            <X className="size-3.5" /> Show everyone
          </Link>
        </p>
      )}

      {conversations.length === 0 ? (
        <Card className="p-10 text-center">
          <MessagesSquare className="mx-auto size-10 text-brand-300" />
          <p className="mt-2 font-bold">{q || filter !== "all" || scoutId ? "No chats match." : "No helper chats yet."}</p>
          <p className="text-sm text-muted">Conversations appear here as soon as someone asks the helper something.</p>
        </Card>
      ) : (
        <div className="space-y-2" data-tour="chats-list">
          {conversations.slice(0, limit).map((c) => {
            const badge = c.badgeId ? getBadge(c.badgeId) : undefined;
            const task = badge && c.taskId ? getTask(badge, c.taskId) : undefined;
            return (
              <Link
                key={c.key}
                href={`/admin/chats/${encodeURIComponent(c.key)}`}
                className={cn(
                  "flex flex-col gap-1.5 rounded-2xl bg-white p-4 ring-1 ring-line transition hover:shadow-card hover:ring-brand-300 sm:flex-row sm:items-center sm:gap-4",
                  c.flagged && "ring-2 ring-rose-300",
                )}
              >
                <div className="flex shrink-0 items-center gap-2 sm:w-56">
                  {c.scout ? (
                    <>
                      <span className="font-extrabold">
                        {c.scout.firstName} {c.scout.lastName}
                      </span>
                      <SectionPill section={c.scout.section as Section} />
                    </>
                  ) : (
                    <span className="font-extrabold">
                      {c.leaderName ?? "A leader"} <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-muted">Leader</span>
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[15px]">“{c.firstQuestion}”</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs font-semibold text-muted">
                    <span>{timeAgo(c.lastAt, now)}</span>
                    <span>
                      {c.questions} question{c.questions === 1 ? "" : "s"}
                    </span>
                    {task ? <span>{task.emoji} {task.title}</span> : c.page && <span>on {c.page}</span>}
                    {c.flagged && <span className="text-rose-600">🚩 Flagged</span>}
                  </p>
                </div>
              </Link>
            );
          })}
          {more && (
            <Link href={href({ limit: String(limit + 100) })} className={buttonClass("secondary", "md", "w-full")}>
              Show more
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
