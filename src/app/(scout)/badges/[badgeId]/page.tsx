import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, CircleCheck, ExternalLink, Info, Printer } from "lucide-react";
import { BadgeEmblem } from "@/components/badge-emblem";
import { BadgeStatusPill } from "@/components/status";
import { TaskRow } from "@/components/task-row";
import { buttonClass, Callout, Card, cn, ProgressRing } from "@/components/ui";
import { badgeName, getBadge, getTask, groupParts } from "@/content";
import { requireScout } from "@/lib/auth";
import { getScoutOverview } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { badgeProgress } from "@/lib/progress";

export async function generateMetadata({ params }: PageProps<"/badges/[badgeId]">): Promise<Metadata> {
  const badge = getBadge((await params).badgeId);
  return { title: badge ? badgeName(badge) : "Badge" };
}

export default async function BadgePage({ params }: PageProps<"/badges/[badgeId]">) {
  const { badgeId } = await params;
  const badge = getBadge(badgeId);
  if (!badge) notFound();

  const scout = await requireScout();
  const { statuses, awards } = await getScoutOverview(scout.id);
  const mine = statuses[badge.id] ?? {};
  const award = awards.get(badge.id);
  const progress = badgeProgress(badge, mine, Boolean(award));
  const prerequisite = badge.prerequisite ? getBadge(badge.prerequisite) : undefined;
  const prereqDone = prerequisite
    ? awards.has(prerequisite.id) || badgeProgress(prerequisite, statuses[prerequisite.id] ?? {}, false).state === "ready"
    : true;

  return (
    <div className="space-y-8">
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-600">
        <ArrowLeft className="size-4" /> All badges
      </Link>

      <Card className="overflow-hidden">
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${badge.ring}, ${badge.color})` }} />
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <BadgeEmblem badge={badge} size={104} />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black tracking-tight">{badgeName(badge)}</h1>
            <p className="mt-1 text-lg text-muted">{badge.tagline}</p>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">{badge.intro}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {badge.sheet && (
                <a href={badge.sheet.url} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                  <Printer className="size-4" /> {badge.sheet.label}
                </a>
              )}
              <a href={badge.officialUrl} target="_blank" rel="noreferrer" className={buttonClass("ghost", "sm")}>
                <ExternalLink className="size-4" /> Official badge page
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2">
            <ProgressRing value={progress.percent} size={92} stroke={9} color={progress.state === "awarded" ? "#059669" : badge.ring}>
              <span className="text-xl font-black">{progress.percent}%</span>
            </ProgressRing>
            <div className="text-center">
              <BadgeStatusPill state={progress.state} />
              <div className="mt-1 text-xs font-semibold text-muted">
                {progress.done} of {progress.required} tasks
              </div>
            </div>
          </div>
        </div>
      </Card>

      {award && (
        <Callout tone="success" title="Badge signed off! 🎉">
          {award.signedOffBy} signed off this badge on {formatDate(award.signedOffAt)}. Amazing work, {scout.firstName}!
          {award.note && <p className="mt-1 italic">“{award.note}”</p>}
        </Callout>
      )}
      {!award && progress.state === "ready" && (
        <Callout tone="info" title="You've done everything!">
          A leader will now check your work and sign off your badge.
        </Callout>
      )}
      {!prereqDone && prerequisite && (
        <Callout tone="tip" title={`Finish ${badgeName(prerequisite)} first`}>
          You need to have done {badgeName(prerequisite)} before this stage.{" "}
          <Link href={`/badges/${prerequisite.id}`} className="font-bold underline">
            Go to {badgeName(prerequisite)}
          </Link>
          . Already did it at another time? Tell a leader.
        </Callout>
      )}

      <div className="space-y-8">
        {groupParts(badge.parts).map((part, i) => {
          if (part.kind === "tasks") {
            return (
              <section key={i} className="space-y-3">
                {part.taskIds.map((taskId) => (
                  <TaskRow key={taskId} badge={badge} task={getTask(badge, taskId)!} state={mine[taskId] ?? "todo"} />
                ))}
              </section>
            );
          }
          const opts = progress.options[part.id] ?? [];
          const complete = opts.filter((o) => o.complete).length;
          return (
            <section key={part.id} className={cn(i > 0 && "pt-2")}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold">{part.title}</h2>
                  <p className="text-sm text-muted">{part.description}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold",
                    complete >= part.pick ? "bg-emerald-100 text-emerald-800" : "bg-brand-50 text-brand-700",
                  )}
                >
                  {complete >= part.pick ? <CircleCheck className="size-4" /> : <Award className="size-4" />}
                  {Math.min(complete, part.pick)} of {part.pick} done
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {part.options.map((option) => {
                  const o = opts.find((x) => x.id === option.id)!;
                  return (
                    <Card key={option.id} className={cn("p-4 sm:p-5", o.complete && "ring-2 ring-emerald-300")}>
                      <div className="mb-3 flex items-start gap-3">
                        <span className="text-3xl">{option.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold">{option.title}</h3>
                          <p className="text-sm text-muted">{option.summary}</p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-muted">
                          {o.done}/{o.total}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {option.taskIds.map((taskId) => {
                          const task = getTask(badge, taskId)!;
                          return <TaskRow key={taskId} badge={badge} task={task} state={mine[taskId] ?? "todo"} compact />;
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0" />
        Tasks marked “Leader checks this” go to a leader when you finish them. When every task is done, a leader signs off
        your badge.
      </p>
    </div>
  );
}

