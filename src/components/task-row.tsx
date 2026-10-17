import Link from "next/link";
import { ChevronRight, Clock, Lock, ShieldCheck, Users } from "lucide-react";
import type { BadgeDef, TaskDef } from "@/content/types";
import type { TaskState } from "@/lib/progress";
import { TaskStatusPill } from "./status";
import { cn } from "./ui";

export function TaskRow({
  badge,
  task,
  state,
  compact = false,
  locked = false,
}: {
  badge: BadgeDef;
  task: TaskDef;
  state: TaskState;
  compact?: boolean;
  locked?: boolean;
}) {
  if (locked) {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl bg-zinc-50 p-3.5 ring-1 ring-line sm:p-4" aria-disabled data-tour={`task:${badge.id}/${task.id}`}>
        <span className={cn("grid shrink-0 place-items-center rounded-xl bg-zinc-100 text-2xl grayscale", compact ? "size-11" : "size-12")}>
          {task.emoji}
        </span>
        <span className="min-w-0 flex-1 text-zinc-500">
          <span className="block font-extrabold leading-snug">{task.title}</span>
          {!compact && <span className="block text-sm">{task.summary}</span>}
        </span>
        <Lock className="size-5 shrink-0 text-zinc-400" />
      </div>
    );
  }
  return (
    <Link
      href={`/badges/${badge.id}/${task.id}`}
      data-tour={`task:${badge.id}/${task.id}`}
      className={cn(
        "group flex items-center gap-3.5 rounded-2xl bg-white p-3.5 ring-1 ring-line transition hover:ring-brand-300 hover:shadow-card sm:p-4",
        state === "changes" && "ring-2 ring-rose-300",
        state === "done" && "bg-emerald-50/40",
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl text-2xl",
          compact ? "size-11" : "size-12",
          state === "done" ? "bg-emerald-100" : "bg-brand-50",
        )}
      >
        {task.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold leading-snug">{task.title}</span>
        {!compact && <span className="block text-sm text-muted">{task.summary}</span>}
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
          {task.minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {task.minutes} min
            </span>
          )}
          {task.review === "leader" ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Users className="size-3.5" /> Leader checks this
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-teal-brand">
              <ShieldCheck className="size-3.5" /> You tick this off
            </span>
          )}
        </span>
      </span>
      <span className="hidden sm:block">
        <TaskStatusPill state={state} short />
      </span>
      <ChevronRight className="size-5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
    </Link>
  );
}
