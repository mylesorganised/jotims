import Link from "next/link";
import { ChevronRight, Lock, Star } from "lucide-react";
import { badgeName, type BadgeDef, type Section } from "@/content";
import type { BadgeProgress } from "@/lib/progress";
import { BadgeEmblem } from "./badge-emblem";
import { BadgeStatusPill } from "./status";
import { cn, ProgressBar } from "./ui";

export function BadgeCard({
  badge,
  progress,
  section,
  lockedBy,
}: {
  badge: BadgeDef;
  progress: BadgeProgress;
  section: Section;
  /** the stage that has to be finished before this one opens */
  lockedBy?: BadgeDef | null;
}) {
  const recommended = badge.recommendedFor.includes(section);
  return (
    <Link
      href={`/badges/${badge.id}`}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl p-5 ring-1 ring-line transition",
        lockedBy ? "bg-zinc-50" : "bg-white shadow-card hover:-translate-y-0.5 hover:shadow-lift hover:ring-brand-200",
      )}
    >
      <div className="flex items-start gap-4">
        <BadgeEmblem badge={badge} size={60} dim={Boolean(lockedBy)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-lg font-extrabold leading-tight">{badgeName(badge)}</h3>
          </div>
          <p className="mt-0.5 text-sm text-muted">{badge.tagline}</p>
          {!lockedBy && recommended && progress.state === "not-started" && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-700">
              <Star className="size-3.5 fill-amber-400 text-amber-400" /> Great one to start with
            </span>
          )}
        </div>
        <ChevronRight className="mt-1 size-5 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
      </div>
      {lockedBy ? (
        <div className="mt-auto flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-muted ring-1 ring-line">
          <Lock className="size-4 shrink-0" /> Finish {badgeName(lockedBy)} first
        </div>
      ) : (
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted">
              {progress.done} of {progress.required} tasks
            </span>
            <BadgeStatusPill state={progress.state} />
          </div>
          <ProgressBar value={progress.percent} color={progress.state === "awarded" ? "#059669" : badge.ring} />
        </div>
      )}
    </Link>
  );
}
