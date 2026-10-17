import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, CircleCheck, Hand, Inbox, Users } from "lucide-react";
import { resolveHelpAction, signOffBadgeAction } from "@/app/actions/leader";
import { AutoRefresh, SubmitButton } from "@/components/admin/form-bits";
import { SubmissionCard } from "@/components/admin/submission-card";
import { BadgeEmblem } from "@/components/badge-emblem";
import { SectionPill } from "@/components/status";
import { TourInvite } from "@/components/tour/tour-invite";
import { Card, PageTitle } from "@/components/ui";
import { BADGES, badgeName, badgesForSection, getBadge, getTask } from "@/content";
import { requireLeader } from "@/lib/auth";
import { getGroupProgress, getHelpRequests, getRecentActivity, getReviewQueue, requestTime } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { badgeProgress } from "@/lib/progress";

export const metadata: Metadata = { title: "Dashboard" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

export default async function AdminDashboard() {
  const leader = await requireLeader();
  const [group, queue, help, activity] = await Promise.all([
    getGroupProgress(),
    getReviewQueue(),
    getHelpRequests(),
    getRecentActivity(20),
  ]);
  const now = await requestTime();

  const ready: { scoutId: string; name: string; section: (typeof group)[number]["scout"]["section"]; badgeId: string }[] = [];
  let awarded = 0;
  for (const { scout, statuses, awards } of group) {
    awarded += awards.size;
    for (const badge of BADGES) {
      if (awards.has(badge.id)) continue;
      const p = badgeProgress(badge, statuses[badge.id] ?? {}, false);
      if (p.state === "ready") ready.push({ scoutId: scout.id, name: `${scout.firstName} ${scout.lastName}`, section: scout.section, badgeId: badge.id });
    }
  }
  const activeToday = group.filter((g) => g.scout.lastSeenAt && now - g.scout.lastSeenAt.getTime() < 12 * 3600_000).length;

  const stats = [
    { label: "Young people", value: group.length, sub: `${activeToday} active today`, icon: Users, href: "/admin/scouts", tone: "bg-brand-50 text-brand-700" },
    { label: "Waiting for review", value: queue.length, sub: "tasks sent to leaders", icon: Inbox, href: "/admin/review", tone: "bg-amber-50 text-amber-700" },
    { label: "Hands up", value: help.length, sub: "asking for help", icon: Hand, href: "#help", tone: "bg-rose-50 text-rose-700" },
    { label: "Ready to sign off", value: ready.length, sub: "badges finished", icon: BadgeCheck, href: "#ready", tone: "bg-sky-50 text-sky-700" },
    { label: "Badges signed off", value: awarded, sub: "so far", icon: Award, href: "/admin/badges", tone: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="space-y-8">
      <AutoRefresh seconds={20} />
      <PageTitle title={`Hi ${leader.name} 👋`} subtitle="Here's what's happening. This page refreshes by itself." />
      <TourInvite
        tourId="leader-start"
        heading="First time here? Take the 1-minute tour"
        text="Where to review work, sign off badges, add young people and change settings. You can rerun tours any time from the Leader helper."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" data-tour="admin-stats">
        {stats.map(({ label, value, sub, icon: Icon, href, tone }) => (
          <Link key={label} href={href} className="rounded-2xl bg-white p-4 ring-1 ring-line shadow-card transition hover:shadow-lift">
            <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </span>
            <div className="mt-3 text-3xl font-black">{value}</div>
            <div className="text-sm font-bold">{label}</div>
            <div className="text-xs text-muted">{sub}</div>
          </Link>
        ))}
      </div>

      {help.length > 0 && (
        <section id="help" className="scroll-mt-28" data-tour="admin-hands-up">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
            <Hand className="size-5 text-rose-500" /> Hands up
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {help.map(({ progress, scout }) => {
              const badge = getBadge(progress.badgeId);
              const task = badge && getTask(badge, progress.taskId);
              return (
                <Card key={progress.id} className="flex items-start gap-3 border-l-4 border-l-rose-400 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/scouts/${scout.id}`} className="font-extrabold hover:underline">
                        {scout.firstName} {scout.lastName}
                      </Link>
                      <SectionPill section={scout.section} />
                      <span className="text-xs font-semibold text-muted">{timeAgo(progress.helpRequestedAt, now)}</span>
                    </div>
                    <p className="text-sm">
                      {task?.emoji} {task?.title} <span className="text-muted">· {badge && badgeName(badge)}</span>
                    </p>
                    {progress.helpMessage && <p className="mt-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-sm">“{progress.helpMessage}”</p>}
                  </div>
                  <form action={resolveHelpAction.bind(null, progress.id)}>
                    <SubmitButton variant="secondary" size="sm">
                      <CircleCheck className="size-4" /> Sorted
                    </SubmitButton>
                  </form>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div data-tour="admin-review-queue">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold">
              <Inbox className="size-5 text-amber-500" /> Waiting for review
            </h2>
            <Link href="/admin/review" className="text-sm font-bold text-brand-600 hover:underline">
              See all →
            </Link>
          </div>
          {queue.length === 0 ? (
            <Card className="p-6 text-center text-muted">Nothing waiting. 🎉</Card>
          ) : (
            <div className="space-y-2">
              {queue.slice(0, 8).map(({ progress, scout }) => (
                <SubmissionCard key={progress.id} progress={progress} scout={scout} now={now} />
              ))}
              {queue.length > 8 && <p className="text-sm text-muted">…and {queue.length - 8} more.</p>}
            </div>
          )}

          </div>

          <div data-tour="admin-ready">
          <h2 id="ready" className="mb-3 mt-8 flex scroll-mt-28 items-center gap-2 text-lg font-extrabold">
            <BadgeCheck className="size-5 text-sky-500" /> Ready to sign off
          </h2>
          {ready.length === 0 ? (
            <Card className="p-6 text-center text-muted">No badges waiting for sign-off.</Card>
          ) : (
            <div className="space-y-2">
              {ready.map((r) => {
                const badge = getBadge(r.badgeId)!;
                return (
                  <Card key={`${r.scoutId}-${r.badgeId}`} className="flex items-center gap-3 p-3.5">
                    <BadgeEmblem badge={badge} size={40} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/scouts/${r.scoutId}`} className="font-extrabold hover:underline">
                        {r.name}
                      </Link>
                      <div className="text-sm text-muted">{badgeName(badge)}</div>
                    </div>
                    <Link href={`/admin/scouts/${r.scoutId}#${badge.id}`} className="hidden text-sm font-bold text-muted hover:text-brand-600 sm:block">
                      Check work
                    </Link>
                    <form action={signOffBadgeAction.bind(null, r.scoutId, r.badgeId)}>
                      <SubmitButton variant="success" size="sm" confirm={`Sign off ${badgeName(badge)} for ${r.name}?`}>
                        <Award className="size-4" /> Sign off
                      </SubmitButton>
                    </form>
                  </Card>
                );
              })}
            </div>
          )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold">By section</h2>
          <div className="space-y-2">
            {(["beavers", "cubs", "scouts"] as const).map((section) => {
              const members = group.filter((g) => g.scout.section === section);
              const badges = badgesForSection(section);
              const done = members.reduce((n, m) => n + m.awards.size, 0);
              return (
                <Card key={section} className="flex items-center gap-3 p-3.5">
                  <SectionPill section={section} />
                  <span className="flex-1 text-sm font-semibold">
                    {members.length} young {members.length === 1 ? "person" : "people"}
                  </span>
                  <span className="text-sm text-muted">
                    {done} of {members.length * badges.length} badges
                  </span>
                </Card>
              );
            })}
          </div>

          <h2 className="mb-3 mt-8 text-lg font-extrabold">Latest activity</h2>
          <Card className="divide-y divide-line" data-tour="admin-activity">
            {activity.length === 0 && <p className="p-4 text-sm text-muted">Nothing yet.</p>}
            {activity.map(({ activity: a, scout }) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                <span className="mt-0.5">{ICON[a.kind] ?? "•"}</span>
                <span className="min-w-0 flex-1">
                  {scout && a.actor === scout.firstName ? (
                    <Link href={`/admin/scouts/${scout.id}`} className="font-bold hover:underline">
                      {scout.firstName} {scout.lastName}
                    </Link>
                  ) : (
                    <b>{a.actor}</b>
                  )}{" "}
                  {a.message}
                </span>
                <span className="shrink-0 text-xs text-muted">{timeAgo(a.createdAt, now)}</span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}

const ICON: Record<string, string> = {
  joined: "👋",
  submitted: "📨",
  done: "✅",
  approved: "👍",
  changes: "✏️",
  awarded: "🏅",
  revoked: "↩️",
  help: "🙋",
  flag: "🚩",
  scout: "👤",
  leader: "🧑‍🏫",
};
