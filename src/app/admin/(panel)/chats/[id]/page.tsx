import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { Transcript } from "@/components/admin/transcript";
import { SectionPill } from "@/components/status";
import { buttonClass, Callout, Card } from "@/components/ui";
import { badgeName, getBadge, getTask } from "@/content";
import { requireLeader } from "@/lib/auth";
import { getConversation } from "@/lib/chat-logs";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Helper chat" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

export default async function ChatPage({ params }: PageProps<"/admin/chats/[id]">) {
  await requireLeader();
  const { id } = await params;
  const chat = await getConversation(decodeURIComponent(id));
  if (!chat) notFound();
  const { messages, scout, leaderName } = chat;

  const flagged = messages.some((m) => m.flagged === 1);
  const questions = messages.filter((m) => m.role === "user").length;
  const places = [...new Map(messages.filter((m) => m.badgeId).map((m) => [`${m.badgeId}/${m.taskId}`, m])).values()].map((m) => {
    const badge = getBadge(m.badgeId!);
    const task = badge && m.taskId ? getTask(badge, m.taskId) : undefined;
    return badge ? (task ? `${task.title} (${badgeName(badge)})` : badgeName(badge)) : null;
  });
  const page = messages.find((m) => m.page)?.page;
  const askedBy = scout ? scout.firstName : (leaderName ?? "Leader");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/chats" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-600">
        <ArrowLeft className="size-4" /> Helper chats
      </Link>

      <Card className="flex flex-wrap items-center gap-3 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black">
              {scout ? `${scout.firstName} ${scout.lastName}` : `${leaderName ?? "A leader"} (leader)`}
            </h1>
            {scout && <SectionPill section={scout.section} />}
          </div>
          <p className="text-sm text-muted">
            {formatDateTime(messages[0].createdAt)} · {questions} question{questions === 1 ? "" : "s"}
          </p>
          {(places.some(Boolean) || page) && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-4" /> {places.filter(Boolean).join(", ") || page}
            </p>
          )}
        </div>
        {scout && (
          <Link href={`/admin/scouts/${scout.id}`} className={buttonClass("secondary", "sm")}>
            {scout.firstName}&apos;s page
          </Link>
        )}
      </Card>

      {flagged && (
        <Callout tone="warning" title="Flagged for a leader">
          Something in this chat suggested {askedBy} might need a trusted adult to check in. It also put their hand up on the dashboard.
          Follow your safeguarding procedures.
        </Callout>
      )}

      <Card className="bg-canvas p-4 sm:p-6">
        <Transcript messages={messages} askedBy={askedBy} scope={scout ? "scout" : "leader"} />
      </Card>
    </div>
  );
}
