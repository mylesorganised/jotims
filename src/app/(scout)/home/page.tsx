import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, CircleCheck, Clock, MessageSquare, MessagesSquare, Wrench } from "lucide-react";
import { BadgeCard } from "@/components/badge-card";
import { SectionPill } from "@/components/status";
import { TourInvite } from "@/components/tour/tour-invite";
import { ButtonLink, Card } from "@/components/ui";
import { badgeName, badgesForSection, getBadge, getTask, type BadgeFamily } from "@/content";
import { requireScout } from "@/lib/auth";
import { getScoutOverview, requestTime } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { badgeProgress, lockedBy } from "@/lib/progress";

export const metadata: Metadata = { title: "My badges" };

const FAMILY_TITLES: Record<BadgeFamily, { title: string; blurb: string }> = {
  communicator: { title: "Communicator", blurb: "Your section's Communicator badge, perfect for JOTA-JOTI." },
  "digital-citizen": { title: "Digital Citizen", blurb: "Staying safe, kind and smart online. Each stage unlocks when you finish the one before." },
  "digital-maker": { title: "Digital Maker", blurb: "Make art, programs and gadgets with code. Each stage unlocks when you finish the one before." },
};

export default async function HomePage() {
  const scout = await requireScout();
  const { rows, statuses, awards } = await getScoutOverview(scout.id);
  const now = await requestTime();

  const badges = badgesForSection(scout.section).map((badge) => ({
    badge,
    progress: badgeProgress(badge, statuses[badge.id] ?? {}, awards.has(badge.id)),
    lock: lockedBy(badge, statuses, (id) => awards.has(id)),
  }));

  const tasksDone = rows.filter((r) => r.status === "done").length;
  const waiting = rows.filter((r) => r.status === "submitted").length;
  const awarded = badges.filter((b) => b.progress.state === "awarded").length;

  const describe = (r: (typeof rows)[number]) => {
    const badge = getBadge(r.badgeId);
    const task = badge && getTask(badge, r.taskId);
    return badge && task ? { badge, task, row: r } : null;
  };

  const changes = rows.filter((r) => r.status === "changes").map(describe).filter((x) => x !== null);
  const approved = rows
    .filter((r) => r.status === "done" && r.reviewedBy && r.reviewedAt && now - r.reviewedAt.getTime() < 3 * 86400_000)
    .sort((a, b) => b.reviewedAt!.getTime() - a.reviewedAt!.getTime())
    .slice(0, 3)
    .map(describe)
    .filter((x) => x !== null);
  const current = rows
    .filter((r) => r.status === "draft")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map(describe)
    .find((x) => x !== null);

  // Walkthrough targets: the first badge they can work on, and the first locked one.
  const firstOpen =
    badges.find((b) => !b.lock && b.progress.state === "in-progress")?.badge.id ??
    badges.find((b) => !b.lock && b.progress.state !== "awarded")?.badge.id ??
    badges[0]?.badge.id;
  const firstLocked = badges.find((b) => b.lock)?.badge.id;

  const families = (["communicator", "digital-citizen", "digital-maker"] as const).map((family) => ({
    family,
    items: badges.filter((b) => b.badge.family === family),
  }));

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-[#3a1a8a] p-6 text-white shadow-lift sm:p-8">
        <div aria-hidden className="absolute -right-10 -top-16 size-64 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -bottom-24 right-24 size-48 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <SectionPill section={scout.section} />
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Hi {scout.firstName}! 👋</h1>
          <p className="mt-1 max-w-xl text-white/80">
            {tasksDone === 0
              ? "Pick a badge below to get started. Each task walks you through step by step."
              : "Great work so far. Keep going!"}
          </p>
          <dl className="mt-6 grid max-w-xl grid-cols-3 gap-3" data-tour="home-stats">
            {[
              { label: "Tasks done", value: tasksDone, icon: CircleCheck },
              { label: "With a leader", value: waiting, icon: Clock },
              { label: "Badges", value: awarded, icon: Award },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur">
                <dt className="flex items-center gap-1.5 text-xs font-bold text-white/75">
                  <Icon className="size-3.5" /> {label}
                </dt>
                <dd className="mt-1 text-2xl font-black">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <TourInvite
        tourId="scout-start"
        heading="New here? Take a quick tour 🧭"
        text="See where your badges are, how tasks work, and where to get help. It takes about a minute."
      />

      {(changes.length > 0 || approved.length > 0 || current) && (
        <section className="grid gap-4 md:grid-cols-2" data-tour="home-messages">
          {changes.map(({ badge, task, row }) => (
            <Card key={row.id} className="border-l-4 border-l-rose-400 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
                <MessageSquare className="size-4" /> {row.reviewedBy ?? "A leader"} asked for changes
              </div>
              <p className="mt-1 font-extrabold">
                {task.emoji} {task.title} <span className="font-semibold text-muted">· {badgeName(badge)}</span>
              </p>
              {row.feedback && <p className="mt-2 rounded-xl bg-rose-50 p-3 text-[15px] text-rose-900">“{row.feedback}”</p>}
              <ButtonLink href={`/badges/${badge.id}/${task.id}`} size="sm" className="mt-3">
                Fix it <ArrowRight className="size-4" />
              </ButtonLink>
            </Card>
          ))}
          {current && (
            <Card className="p-5">
              <div className="text-sm font-bold text-brand-600">Carry on where you left off</div>
              <p className="mt-1 font-extrabold">
                {current.task.emoji} {current.task.title}
              </p>
              <p className="text-sm text-muted">
                {badgeName(current.badge)} · last worked on {timeAgo(current.row.updatedAt, now)}
              </p>
              <ButtonLink href={`/badges/${current.badge.id}/${current.task.id}`} size="sm" className="mt-3">
                Continue <ArrowRight className="size-4" />
              </ButtonLink>
            </Card>
          )}
          {approved.map(({ badge, task, row }) => (
            <Card key={row.id} className="border-l-4 border-l-emerald-400 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                <CircleCheck className="size-4" /> {row.reviewedBy} approved this
              </div>
              <p className="mt-1 font-extrabold">
                {task.emoji} {task.title} <span className="font-semibold text-muted">· {badgeName(badge)}</span>
              </p>
              {row.feedback && <p className="mt-2 text-[15px] text-muted">“{row.feedback}”</p>}
            </Card>
          ))}
        </section>
      )}

      {families.map(({ family, items }) => (
        <section key={family}>
          <div className="mb-4">
            <h2 className="text-xl font-extrabold">{FAMILY_TITLES[family].title}</h2>
            <p className="text-sm text-muted">{FAMILY_TITLES[family].blurb}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ badge, progress, lock }) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                progress={progress}
                section={scout.section}
                lockedBy={lock}
                tour={badge.id === firstOpen ? "badge-first" : badge.id === firstLocked ? "badge-locked" : undefined}
              />
            ))}
          </div>
        </section>
      ))}

      <Link
        href="/chat"
        data-tour="chat-card"
        className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-5 text-white shadow-card transition hover:shadow-lift"
      >
        <span className="grid size-12 place-items-center rounded-xl bg-white/15">
          <MessagesSquare className="size-6" />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Chat with Scouts around the world 🌍</span>
          <span className="text-sm text-brand-100">How to get into the JOTA-JOTI chat, practise, and stay safe.</span>
        </span>
        <ArrowRight className="size-5 text-white/60" />
      </Link>

      <Link
        href="/toolbox"
        data-tour="toolbox-card"
        className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-line shadow-card transition hover:shadow-lift"
      >
        <span className="grid size-12 place-items-center rounded-xl bg-teal-brand/10 text-teal-brand">
          <Wrench className="size-6" />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Code toolbox</span>
          <span className="text-sm text-muted">Morse code, the phonetic alphabet and semaphore: translators and charts.</span>
        </span>
        <ArrowRight className="size-5 text-zinc-300" />
      </Link>
    </div>
  );
}
