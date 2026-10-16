import Link from "next/link";
import { ChevronRight, Clock, Users } from "lucide-react";
import { badgeName, getBadge, getTask } from "@/content";
import type { ProgressRow, ScoutRow } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { BadgeEmblem } from "../badge-emblem";
import { SectionPill, TaskStatusPill } from "../status";

export function SubmissionCard({ progress, scout, now }: { progress: ProgressRow; scout: ScoutRow; now: number }) {
  const badge = getBadge(progress.badgeId);
  const task = badge && getTask(badge, progress.taskId);
  if (!badge || !task) return null;
  return (
    <Link
      href={`/admin/review/${progress.id}`}
      className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line transition hover:shadow-card hover:ring-brand-300"
    >
      <BadgeEmblem badge={badge} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-extrabold">
            {scout.firstName} {scout.lastName}
          </span>
          <SectionPill section={scout.section} />
        </div>
        <div className="truncate text-sm">
          {task.emoji} {task.title} <span className="text-muted">· {badgeName(badge)}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {timeAgo(progress.submittedAt ?? progress.updatedAt, now)}
          </span>
          {task.review === "leader" && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Users className="size-3.5" /> Needs a leader
            </span>
          )}
        </div>
      </div>
      <TaskStatusPill state={progress.status} short />
      <ChevronRight className="size-5 text-zinc-300 group-hover:text-brand-500" />
    </Link>
  );
}
