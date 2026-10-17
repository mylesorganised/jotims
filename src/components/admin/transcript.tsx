import { Bot, Compass, Eye } from "lucide-react";
import { RichText } from "@/components/rich-text";
import { cn } from "@/components/ui";
import type { schema } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getTour, resolveAnchor } from "@/lib/tour/registry";

type Row = typeof schema.helperMessages.$inferSelect;

const MARKER = /\[\[(show|tour):([a-z0-9:/,_ -]+)\]\]/gi;

/** The helper's reply with its on-screen buttons shown as labels. */
function Reply({ text, scope }: { text: string; scope: "scout" | "leader" }) {
  const chips: { icon: "show" | "tour"; label: string }[] = [];
  const clean = text.replace(MARKER, (_whole, kind: string, ids: string) => {
    const list = ids.split(",").map((i) => i.trim());
    if (kind === "show") chips.push({ icon: "show", label: `Show me: ${resolveAnchor(list[0], scope)?.title ?? list[0]}` });
    else if (list.length === 1 && getTour(list[0])) chips.push({ icon: "tour", label: `Take the tour: ${getTour(list[0])!.title}` });
    else chips.push({ icon: "tour", label: `Walk me through it (${list.length} places)` });
    return "";
  });
  return (
    <>
      <div className="space-y-2">
        {clean
          .trim()
          .split(/\n{2,}/)
          .map((para, i) => (
            <p key={i} className="whitespace-pre-wrap">
              <RichText text={para} />
            </p>
          ))}
      </div>
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
              {c.icon === "show" ? <Eye className="size-3.5" /> : <Compass className="size-3.5" />} {c.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

/** A whole helper conversation, as chat bubbles. */
export function Transcript({ messages, askedBy, scope }: { messages: Row[]; askedBy: string; scope: "scout" | "leader" }) {
  return (
    <ol className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
          <div
            className={cn(
              "max-w-[min(42rem,90%)] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
              m.role === "user" ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md bg-white ring-1 ring-line",
              m.flagged === 1 && "bg-rose-600 ring-4 ring-rose-200",
            )}
          >
            <p className={cn("mb-1 flex flex-wrap items-center gap-x-2 text-xs font-bold", m.role === "user" ? "text-white/80" : "text-muted")}>
              {m.role === "assistant" && <Bot className="size-3.5" />}
              <span>{m.role === "user" ? askedBy : "Helper"}</span>
              <span className="font-semibold">{formatDateTime(m.createdAt)}</span>
              {m.flagged === 1 && <span className="rounded-full bg-white px-2 text-rose-700">🚩 Flagged: a leader should check in</span>}
            </p>
            {m.role === "user" ? <p className="whitespace-pre-wrap">{m.content}</p> : <Reply text={m.content} scope={scope} />}
          </div>
        </li>
      ))}
    </ol>
  );
}
