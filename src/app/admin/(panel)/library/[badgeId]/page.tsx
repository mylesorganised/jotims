import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ExternalLink, Eye, Printer, ShieldCheck, Users } from "lucide-react";
import { BadgeEmblem } from "@/components/badge-emblem";
import { buttonClass, Callout, Card } from "@/components/ui";
import { badgeName, getBadge, getTask, groupParts, sectionName, type BadgeDef, type TaskDef } from "@/content";
import { requireLeader } from "@/lib/auth";

export const metadata: Metadata = { title: "Badge library" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

export default async function LibraryBadgePage({ params }: PageProps<"/admin/library/[badgeId]">) {
  await requireLeader();
  const { badgeId } = await params;
  const badge = getBadge(badgeId);
  if (!badge) notFound();
  const before = badge.prerequisite ? getBadge(badge.prerequisite) : undefined;

  return (
    <div className="space-y-6">
      <Link href="/admin/library" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-600">
        <ArrowLeft className="size-4" /> Badge library
      </Link>

      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <BadgeEmblem badge={badge} size={88} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black">{badgeName(badge)}</h1>
          <p className="text-muted">{badge.tagline}</p>
          <p className="mt-2 text-[15px]">{badge.intro}</p>
          <p className="mt-2 text-sm text-muted">
            For {badge.sections.map(sectionName).join(", ")} · suggested for {badge.recommendedFor.map(sectionName).join(", ")}
            {before && ` · unlocks after ${badgeName(before)}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {badge.sheet && (
              <a href={badge.sheet.url} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
                <Printer className="size-4" /> {badge.sheet.label}
              </a>
            )}
            <a href={badge.officialUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>
              <ExternalLink className="size-4" /> Official badge page
            </a>
          </div>
        </div>
      </Card>

      {groupParts(badge.parts).map((part, i) =>
        part.kind === "tasks" ? (
          <div key={i} className="space-y-3">
            {part.taskIds.map((id) => (
              <TaskCard key={id} badge={badge} task={getTask(badge, id)!} />
            ))}
          </div>
        ) : (
          <section key={part.id} className="space-y-3">
            <div>
              <h2 className="text-lg font-extrabold">{part.title}</h2>
              <p className="text-sm text-muted">{part.description}</p>
            </div>
            {part.options.map((option) => (
              <div key={option.id} className="space-y-2 rounded-2xl bg-brand-50/40 p-3 ring-1 ring-brand-100">
                <p className="px-1 font-bold">
                  {option.emoji} {option.title} <span className="font-normal text-muted">· {option.summary}</span>
                </p>
                {option.taskIds.map((id) => (
                  <TaskCard key={id} badge={badge} task={getTask(badge, id)!} />
                ))}
              </div>
            ))}
          </section>
        ),
      )}
    </div>
  );
}

function TaskCard({ badge, task }: { badge: BadgeDef; task: TaskDef }) {
  const fields = task.steps.flatMap((s) => s.fields ?? []);
  const uploads = fields.filter((f) => f.kind === "upload");
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl">{task.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{task.title}</p>
          <p className="text-sm text-muted">{task.summary}</p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs font-semibold text-muted">
            {task.minutes && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {task.minutes} min
              </span>
            )}
            {task.review === "leader" ? (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Users className="size-3.5" /> Leader checks
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-teal-brand">
                <ShieldCheck className="size-3.5" /> Self check
              </span>
            )}
            <span>
              {task.steps.length} steps · {fields.length} questions{uploads.length ? ` · ${uploads.length} uploads` : ""}
            </span>
          </p>
        </div>
        <Link href={`/admin/library/${badge.id}/${task.id}`} className={buttonClass("primary", "sm")}>
          <Eye className="size-4" /> Preview
        </Link>
      </div>
      {task.leaderCheck && (
        <Callout tone="info" className="mt-3" title="What to look for">
          {task.leaderCheck}
        </Callout>
      )}
      <ol className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {task.steps.map((s, i) => (
          <li key={i} className="rounded-full bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-600">
            {i + 1}. {s.title}
          </li>
        ))}
      </ol>
    </Card>
  );
}
