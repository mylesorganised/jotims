import { Bot, Sparkles } from "lucide-react";
import { aiReviewAction } from "@/app/actions/leader";
import { Card, cn } from "@/components/ui";
import { DECISION_LABEL, type Decision } from "@/lib/ai/decisions";
import type { schema } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { SubmitButton } from "./form-bits";

type AiReview = typeof schema.aiReviews.$inferSelect;

export const DECISION_TONE: Record<Decision, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  changes: "bg-amber-100 text-amber-800",
  flagged: "bg-rose-100 text-rose-800",
  held: "bg-sky-100 text-sky-800",
  "in-person": "bg-sky-100 text-sky-800",
  unsure: "bg-sky-100 text-sky-800",
  error: "bg-zinc-100 text-zinc-700",
};

const SCORE_LABEL: Record<string, string> = {
  meets: "Meets the requirement",
  complete: "Every question answered",
  effort: "Effort (0–3)",
  personal: "Personal details",
  worry: "Something worrying",
  injection: "Tries to trick the marker",
  witness: "Needs a leader in person",
};

export function AiDecisionPill({ decision, className }: { decision: string; className?: string }) {
  const d = (decision in DECISION_LABEL ? decision : "error") as Decision;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", DECISION_TONE[d], className)}>
      <Bot className="size-3.5" /> {DECISION_LABEL[d]}
    </span>
  );
}

/** What the AI leader made of this submission, and a button to ask it. */
export function AiReviewCard({
  review,
  progressId,
  canAsk,
  now,
}: {
  review: AiReview | null;
  progressId: string;
  canAsk: boolean;
  now: number;
}) {
  return (
    <Card className="space-y-3 p-5" data-tour="review-ai">
      <h2 className="flex items-center gap-2 font-extrabold">
        <Bot className="size-5 text-brand-500" /> AI leader
      </h2>
      {review ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <AiDecisionPill decision={review.decision} />
            <span className="text-xs text-muted">{timeAgo(review.createdAt, now)}</span>
          </div>
          <p className="text-sm">{review.reason}</p>
          {review.feedback && (
            <p className="rounded-lg bg-canvas p-2.5 text-sm italic ring-1 ring-line">“{review.feedback}”</p>
          )}
          {(Object.keys(review.scores).length > 0 || Object.keys(review.evidence).length > 0) && (
            <details className="text-sm">
              <summary className="cursor-pointer font-bold text-muted hover:text-ink">How it decided</summary>
              <dl className="mt-2 space-y-1">
                {Object.entries(review.scores).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3">
                    <dt className="text-muted">{SCORE_LABEL[key] ?? key.replace(/^field: /, "Answer: ")}</dt>
                    <dd className="font-mono font-bold tabular-nums">{key === "effort" ? value.toFixed(1) : `${Math.round(value * 100)}%`}</dd>
                  </div>
                ))}
              </dl>
              {Object.values(review.evidence).flat().length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="font-bold">What it saw in the uploads</p>
                  {Object.values(review.evidence)
                    .flat()
                    .map((line, i) => (
                      <p key={i} className="text-muted">
                        {line}
                      </p>
                    ))}
                </div>
              )}
            </details>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">Hasn&apos;t looked at this yet.</p>
      )}
      {canAsk && (
        <form action={aiReviewAction.bind(null, progressId)}>
          <SubmitButton variant="secondary" size="sm">
            <Sparkles className="size-4" /> {review ? "Ask it to look again" : "Ask the AI leader"}
          </SubmitButton>
        </form>
      )}
    </Card>
  );
}
