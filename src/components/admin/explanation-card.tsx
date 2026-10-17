import { Bot, CheckCircle2, Hand, Mail, MessageCircle, MessagesSquare, Video } from "lucide-react";
import { Card, cn } from "@/components/ui";
import type { schema } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

type Row = typeof schema.explanations.$inferSelect;

const STATUS = {
  passed: { label: "Explained it ✅", tone: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  chatting: { label: "Still chatting", tone: "bg-sky-100 text-sky-800", icon: MessagesSquare },
  referred: { label: "Needs a real leader", tone: "bg-amber-100 text-amber-800", icon: Hand },
};

/** The young person's "explain it to a leader" chat with the AI leader. */
export function ExplanationCard({ row, stepTitle, firstName }: { row: Row; stepTitle: string; firstName: string }) {
  const s = STATUS[row.status];
  const kind = row.kind;
  const Icon = kind === "email" ? Mail : kind === "sms" ? MessageCircle : kind === "video" ? Video : MessagesSquare;
  const title =
    kind === "email"
      ? "Email to the AI leader"
      : kind === "sms"
        ? "Texts with the AI leader"
        : kind === "video"
          ? "Video message (watch it, then approve)"
          : "Explained to the AI leader";
  const label = row.status === "passed" && kind !== "explain" ? "Received ✅" : s.label;
  return (
    <Card className="space-y-3 p-5" data-tour="review-explain">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 font-extrabold">
          <Icon className="size-5 text-brand-500" /> {title}
        </h2>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", s.tone)}>
          <s.icon className="size-3.5" /> {label}
        </span>
      </div>
      <p className="text-sm text-muted">
        {stepTitle} · {formatDateTime(row.updatedAt)}
        {kind === "explain" && " · copy and paste was switched off"}
        {row.scores.wpm ? ` · ${row.scores.words} words in ${row.scores.seconds}s (${row.scores.wpm} words a minute, pasting switched off)` : ""}
      </p>
      <ol className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-canvas p-3 ring-1 ring-line">
        {row.messages.map((m, i) => (
          <li key={i} className={cn("flex", m.role === "scout" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                m.role === "scout" ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md bg-white ring-1 ring-line",
              )}
            >
              <span className={cn("mb-0.5 flex items-center gap-1 text-[11px] font-bold", m.role === "scout" ? "text-white/80" : "text-brand-600")}>
                {m.role === "ai" && <Bot className="size-3" />} {m.role === "ai" ? "AI leader" : firstName}
              </span>
              {m.subject && <span className="mb-1 block font-bold">Subject: {m.subject}</span>}
              {m.uploadId && (
                <video src={`/api/files/${m.uploadId}`} controls playsInline preload="metadata" className="mb-1.5 max-h-72 w-full rounded-xl bg-black" />
              )}
              {m.uploadId && m.seconds ? `🎬 ${m.seconds}s · ` : ""}
              {m.text}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
