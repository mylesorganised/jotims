import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, CircleCheck, Eye, RotateCcw, Trash2, Undo2 } from "lucide-react";
import {
  deleteScoutAction,
  leaderMarkDoneAction,
  leaderReopenTaskAction,
  revokeBadgeAction,
  signOffBadgeAction,
} from "@/app/actions/leader";
import { SubmitButton } from "@/components/admin/form-bits";
import { EditScoutForm } from "@/components/admin/scout-forms";
import { BadgeEmblem } from "@/components/badge-emblem";
import { BadgeStatusPill, SectionPill, TaskStatusPill } from "@/components/status";
import { buttonClass, Card, cn, inputClass, ProgressBar } from "@/components/ui";
import { BADGES, badgeName, getTask, groupParts, type BadgeDef, type TaskDef } from "@/content";
import { requireLeader } from "@/lib/auth";
import { ageOn, getScout, getScoutActivity, getScoutOverview, requestTime, type ProgressRow } from "@/lib/data";
import { formatDate, timeAgo } from "@/lib/format";
import { badgeProgress } from "@/lib/progress";
import { formatDob } from "@/lib/validate";

export const metadata: Metadata = { title: "Young person" };

export default async function ScoutDetailPage({ params }: PageProps<"/admin/scouts/[id]">) {
  await requireLeader();
  const { id } = await params;
  const scout = await getScout(id);
  if (!scout) notFound();
  const [{ rows, statuses, awards }, activity] = await Promise.all([getScoutOverview(scout.id), getScoutActivity(scout.id)]);
  const now = await requestTime();

  const byTask = new Map(rows.map((r) => [`${r.badgeId}/${r.taskId}`, r]));
  // Their section's badges, plus any others they've started (e.g. after moving section).
  const badges = BADGES.filter((b) => b.sections.includes(scout.section) || statuses[b.id] || awards.has(b.id));

  return (
    <div className="space-y-8">
      <Link href="/admin/scouts" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-600">
        <ArrowLeft className="size-4" /> Young people
      </Link>

      <Card className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
        <span className="grid size-16 place-items-center rounded-full bg-brand-100 text-2xl font-black text-brand-700">
          {scout.firstName[0]}
          {scout.lastName[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black">
              {scout.firstName} {scout.lastName}
            </h1>
            <SectionPill section={scout.section} />
          </div>
          <p className="text-sm text-muted">
            Age {ageOn(scout.dob)} · born {formatDob(scout.dob)} · joined {formatDate(scout.createdAt)} · last seen{" "}
            {timeAgo(scout.lastSeenAt, now)}
          </p>
          {scout.notes && <p className="mt-1 text-sm italic">{scout.notes}</p>}
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-black">{rows.filter((r) => r.status === "done").length}</div>
            <div className="text-xs font-bold text-muted">tasks done</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{awards.size}</div>
            <div className="text-xs font-bold text-muted">badges</div>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {badges.map((badge) => (
          <BadgeSection
            key={badge.id}
            badge={badge}
            scoutId={scout.id}
            firstName={scout.firstName}
            statuses={statuses[badge.id] ?? {}}
            award={awards.get(badge.id)}
            byTask={byTask}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Details</h2>
          <EditScoutForm scout={scout} />
          <form action={deleteScoutAction.bind(null, scout.id)} className="mt-6 border-t border-line pt-4">
            <SubmitButton
              variant="danger"
              size="sm"
              confirm={`Delete ${scout.firstName} ${scout.lastName} and all their work? This can't be undone.`}
            >
              <Trash2 className="size-4" /> Delete {scout.firstName} and their work
            </SubmitButton>
          </form>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-extrabold">History</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">Nothing yet.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="w-24 shrink-0 text-xs text-muted">{timeAgo(a.createdAt, now)}</span>
                  <span>
                    <b>{a.actor}</b> {a.message}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

function BadgeSection({
  badge,
  scoutId,
  firstName,
  statuses,
  award,
  byTask,
}: {
  badge: BadgeDef;
  scoutId: string;
  firstName: string;
  statuses: Record<string, ProgressRow["status"]>;
  award: { signedOffBy: string; signedOffAt: Date; note: string | null } | undefined;
  byTask: Map<string, ProgressRow>;
}) {
  const progress = badgeProgress(badge, statuses, Boolean(award));
  const counted = new Set(progress.requiredTaskIds);

  const taskLine = (task: TaskDef) => {
    const row = byTask.get(`${badge.id}/${task.id}`);
    const state = row?.status ?? "todo";
    return (
      <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <span className="text-lg">{task.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="font-semibold">{task.title}</span>
          {row?.reviewedBy && state === "done" && <span className="ml-2 text-xs text-muted">✓ {row.reviewedBy}</span>}
          {task.review === "leader" && state !== "done" && <span className="ml-2 text-xs font-bold text-amber-700">leader check</span>}
        </span>
        <TaskStatusPill state={state} short />
        <span className="flex gap-1">
          {row && (
            <Link href={`/admin/review/${row.id}`} className={buttonClass("ghost", "sm")} title="See their answers">
              <Eye className="size-4" /> View
            </Link>
          )}
          {state !== "done" ? (
            <form action={leaderMarkDoneAction.bind(null, scoutId, badge.id, task.id)}>
              <SubmitButton variant="secondary" size="sm">
                <CircleCheck className="size-4" /> Tick off
              </SubmitButton>
            </form>
          ) : (
            <form action={leaderReopenTaskAction.bind(null, scoutId, badge.id, task.id)}>
              <SubmitButton variant="ghost" size="sm" confirm="Put this task back to 'in progress'?">
                <RotateCcw className="size-4" />
              </SubmitButton>
            </form>
          )}
        </span>
      </li>
    );
  };

  return (
    <Card id={badge.id} className="scroll-mt-32 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 border-b border-line p-4 sm:p-5">
        <BadgeEmblem badge={badge} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold">{badgeName(badge)}</h2>
            <BadgeStatusPill state={progress.state} />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={progress.percent} color={award ? "#059669" : badge.ring} className="max-w-xs" />
            <span className="text-sm font-semibold text-muted">
              {progress.done}/{progress.required}
            </span>
          </div>
        </div>
        {award ? (
          <div className="text-right text-sm">
            <p className="font-bold text-emerald-700">
              <Award className="mr-1 inline size-4" />
              Signed off by {award.signedOffBy}
            </p>
            <p className="text-muted">{formatDate(award.signedOffAt)}</p>
            <form action={revokeBadgeAction.bind(null, scoutId, badge.id)} className="mt-1">
              <SubmitButton variant="ghost" size="sm" confirm="Remove this sign-off?">
                <Undo2 className="size-4" /> Undo
              </SubmitButton>
            </form>
          </div>
        ) : (
          <form action={signOffBadgeAction.bind(null, scoutId, badge.id)} className="flex flex-wrap items-center gap-2">
            <input name="note" placeholder="Note (optional)" className={cn(inputClass, "h-9 w-44 py-1.5 text-sm")} />
            <SubmitButton
              variant={progress.state === "ready" ? "success" : "secondary"}
              size="sm"
              confirm={
                progress.state === "ready"
                  ? `Sign off ${badgeName(badge)} for ${firstName}?`
                  : `Not every task is done yet. Sign off ${badgeName(badge)} for ${firstName} anyway?`
              }
            >
              <Award className="size-4" /> {progress.state === "ready" ? "Sign off badge" : "Sign off anyway"}
            </SubmitButton>
          </form>
        )}
      </div>
      <div className="px-4 pb-3 sm:px-5">
        {groupParts(badge.parts).map((part, i) => {
          if (part.kind === "tasks")
            return (
              <ul key={i} className="divide-y divide-line">
                {part.taskIds.map((t) => taskLine(getTask(badge, t)!))}
              </ul>
            );
          return (
            <div key={part.id} className="pt-3">
              <p className="text-xs font-black uppercase tracking-wider text-muted">{part.title}</p>
              {part.options.map((o) => {
                const op = progress.options[part.id]?.find((x) => x.id === o.id);
                const isCounted = o.taskIds.every((t) => counted.has(t));
                return (
                  <div key={o.id} className={cn("mt-2 rounded-xl px-3", isCounted ? "bg-brand-50/50" : "bg-zinc-50")}>
                    <p className="flex items-center gap-2 pt-2 text-sm font-bold">
                      {o.emoji} {o.title}
                      <span className="text-xs font-semibold text-muted">
                        {op?.done}/{op?.total}
                      </span>
                      {op?.complete && <CircleCheck className="size-4 text-emerald-600" />}
                    </p>
                    <ul className="divide-y divide-line">{o.taskIds.map((t) => taskLine(getTask(badge, t)!))}</ul>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
