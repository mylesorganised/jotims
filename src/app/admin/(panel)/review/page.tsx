import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/admin/form-bits";
import { SubmissionCard } from "@/components/admin/submission-card";
import { Card, cn, PageTitle } from "@/components/ui";
import { requireLeader } from "@/lib/auth";
import { getRecentSubmissions, getReviewQueue, requestTime } from "@/lib/data";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage({ searchParams }: PageProps<"/admin/review">) {
  await requireLeader();
  const { view } = await searchParams;
  const showAll = view === "recent";
  const [queue, recent] = await Promise.all([getReviewQueue(), showAll ? getRecentSubmissions(80) : Promise.resolve([])]);
  const now = await requestTime();
  const items = showAll ? recent : queue;

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={20} />
      <PageTitle
        title="Review"
        subtitle={
          showAll
            ? "Everything young people have finished or sent in, newest first."
            : "Tasks waiting for a leader to check, oldest first."
        }
      />
      <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line sm:inline-flex">
        {[
          { id: undefined, label: `Waiting (${queue.length})` },
          { id: "recent", label: "All recent work" },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.id ? `/admin/review?view=${t.id}` : "/admin/review"}
            className={cn(
              "flex-1 rounded-lg px-4 py-1.5 text-center text-sm font-bold",
              (t.id === "recent") === showAll ? "bg-brand-500 text-white" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="text-4xl">🎉</div>
          <p className="mt-2 font-bold">All caught up!</p>
          <p className="text-sm text-muted">New submissions appear here automatically.</p>
        </Card>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {items.map(({ progress, scout }) => (
            <SubmissionCard key={progress.id} progress={progress} scout={scout} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
