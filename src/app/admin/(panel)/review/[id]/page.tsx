import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleCheck, Hand, MessageSquare, RotateCcw, Users } from "lucide-react";
import {
  approveTaskAction,
  leaderMarkDoneAction,
  leaderReopenTaskAction,
  requestChangesAction,
  resolveHelpAction,
} from "@/app/actions/leader";
import { AiReviewCard } from "@/components/admin/ai-review-card";
import { AnswerView } from "@/components/admin/answer-view";
import { SubmitButton } from "@/components/admin/form-bits";
import { BadgeEmblem } from "@/components/badge-emblem";
import { SectionPill, TaskStatusPill } from "@/components/status";
import { buttonClass, Callout, Card, inputClass } from "@/components/ui";
import { badgeName, getBadge, getTask } from "@/content";
import { aiReviewerAvailable, getLatestAiReviews } from "@/lib/ai/reviewer";
import { requireLeader } from "@/lib/auth";
import { ageOn, getProgressById, getReviewQueue, getTaskUploads, requestTime } from "@/lib/data";
import { formatDateTime, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Review submission" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

export default async function ReviewDetailPage({ params }: PageProps<"/admin/review/[id]">) {
  await requireLeader();
  const { id } = await params;
  const row = await getProgressById(id);
  if (!row) notFound();
  const { progress, scout } = row;
  const badge = getBadge(progress.badgeId);
  const task = badge && getTask(badge, progress.taskId);
  if (!badge || !task) notFound();

  const [uploads, queue, aiReviews] = await Promise.all([
    getTaskUploads(scout.id, badge.id, task.id),
    getReviewQueue(),
    getLatestAiReviews([progress.id]),
  ]);
  const aiReview = aiReviews.get(progress.id) ?? null;
  const now = await requestTime();
  const nextInQueue = queue.find((q) => q.progress.id !== progress.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/review" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-600">
          <ArrowLeft className="size-4" /> Review queue
        </Link>
        {nextInQueue && (
          <Link href={`/admin/review/${nextInQueue.progress.id}`} className={buttonClass("secondary", "sm")}>
            Next waiting: {nextInQueue.scout.firstName} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      <Card className="flex flex-wrap items-center gap-4 p-5">
        <BadgeEmblem badge={badge} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/scouts/${scout.id}`} className="text-xl font-black hover:underline">
              {scout.firstName} {scout.lastName}
            </Link>
            <SectionPill section={scout.section} />
            <span className="text-sm text-muted">age {ageOn(scout.dob)}</span>
          </div>
          <p className="mt-0.5 font-bold">
            {task.emoji} {task.title} <span className="font-semibold text-muted">· {badgeName(badge)}</span>
          </p>
          <p className="text-sm text-muted">
            {progress.submittedAt ? `Sent ${timeAgo(progress.submittedAt, now)} (${formatDateTime(progress.submittedAt)})` : "Not sent yet"}
            {progress.reviewedBy && ` · last reviewed by ${progress.reviewedBy}`}
          </p>
        </div>
        <TaskStatusPill state={progress.status} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {task.leaderCheck && (
            <div data-tour="review-look-for">
              <Callout tone="info" title="What to look for">
                {task.leaderCheck}
              </Callout>
            </div>
          )}
          <Card className="p-5 sm:p-6" data-tour="review-answers">
            <AnswerView task={task} answers={progress.answers} uploads={uploads} firstName={scout.firstName} />
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          {progress.helpRequestedAt && (
            <Card className="border-l-4 border-l-rose-400 p-4">
              <p className="flex items-center gap-2 font-bold text-rose-700">
                <Hand className="size-4" /> Asked for help {timeAgo(progress.helpRequestedAt, now)}
              </p>
              {progress.helpMessage && <p className="mt-1 text-sm">“{progress.helpMessage}”</p>}
              <form action={resolveHelpAction.bind(null, progress.id)} className="mt-3">
                <SubmitButton variant="secondary" size="sm">
                  <CircleCheck className="size-4" /> Sorted
                </SubmitButton>
              </form>
            </Card>
          )}

          <Card className="space-y-4 p-5" data-tour="review-decision">
            <h2 className="font-extrabold">
              {progress.status === "submitted" ? "Your decision" : progress.status === "done" ? "Finished" : "Leader actions"}
            </h2>

            {progress.status === "done" && (
              <p className="flex items-start gap-2 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {progress.reviewedBy ? `Approved by ${progress.reviewedBy}.` : `${scout.firstName} ticked this off themselves.`}
              </p>
            )}
            {progress.status === "changes" && (
              <p className="flex items-start gap-2 text-sm">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-rose-500" />
                Waiting for {scout.firstName} to make changes{progress.feedback && <>: “{progress.feedback}”</>}
              </p>
            )}
            {progress.status === "draft" && (
              <p className="flex items-start gap-2 text-sm text-muted">
                <Users className="mt-0.5 size-4 shrink-0" />
                {scout.firstName} is still working on this and hasn&apos;t sent it yet.
              </p>
            )}

            <form className="space-y-3">
              <label className="block">
                <span className="text-sm font-bold">Message for {scout.firstName}</span>
                <textarea
                  name="feedback"
                  rows={3}
                  defaultValue={progress.status === "submitted" ? "" : (progress.feedback ?? "")}
                  placeholder={progress.status === "submitted" ? "Well done! / Could you add…" : "Optional"}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <div className="flex flex-col gap-2">
                {progress.status !== "done" && (
                  <SubmitButton variant="success" formAction={approveTaskAction.bind(null, progress.id)}>
                    <CircleCheck className="size-4" /> Approve, it&apos;s done
                  </SubmitButton>
                )}
                <SubmitButton variant="secondary" formAction={requestChangesAction.bind(null, progress.id)}>
                  <MessageSquare className="size-4" /> Ask for changes
                </SubmitButton>
              </div>
            </form>

            {progress.status === "done" && (
              <form action={leaderReopenTaskAction.bind(null, scout.id, badge.id, task.id)}>
                <SubmitButton variant="ghost" size="sm" confirm="Put this back to 'in progress'?">
                  <RotateCcw className="size-4" /> Reopen this task
                </SubmitButton>
              </form>
            )}
            {progress.status === "draft" && (
              <form action={leaderMarkDoneAction.bind(null, scout.id, badge.id, task.id)}>
                <SubmitButton variant="ghost" size="sm">
                  <CircleCheck className="size-4" /> Tick it off anyway
                </SubmitButton>
              </form>
            )}
          </Card>

          {(aiReview || aiReviewerAvailable()) && (
            <AiReviewCard
              review={aiReview}
              progressId={progress.id}
              canAsk={aiReviewerAvailable() && progress.status === "submitted"}
              now={now}
            />
          )}

          <Link href={`/admin/scouts/${scout.id}#${badge.id}`} className={buttonClass("ghost", "sm", "w-full")}>
            See all of {scout.firstName}&apos;s {badgeName(badge)} work
          </Link>
        </aside>
      </div>
    </div>
  );
}
