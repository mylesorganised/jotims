import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Printer, ShieldCheck, Users } from "lucide-react";
import { BadgeEmblem } from "@/components/badge-emblem";
import { Card, PageTitle } from "@/components/ui";
import { BADGES, badgeName, getBadge, sectionName, type BadgeFamily } from "@/content";
import { requireLeader } from "@/lib/auth";

export const metadata: Metadata = { title: "Badge library" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

const FAMILIES: { id: BadgeFamily; title: string }[] = [
  { id: "communicator", title: "Communicator" },
  { id: "digital-citizen", title: "Digital Citizen" },
  { id: "digital-maker", title: "Digital Maker" },
];

export default async function LibraryPage() {
  await requireLeader();
  return (
    <div className="space-y-8">
      <PageTitle
        title="Badge library"
        subtitle="Every badge and task, and a preview of exactly what young people see. Nothing you do in a preview is saved."
      />
      {FAMILIES.map((family) => (
        <section key={family.id}>
          <h2 className="mb-3 text-lg font-extrabold">{family.title}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {BADGES.filter((b) => b.family === family.id).map((badge) => {
              const leaderTasks = badge.tasks.filter((t) => t.review === "leader").length;
              const before = badge.prerequisite ? getBadge(badge.prerequisite) : undefined;
              return (
                <Link
                  key={badge.id}
                  href={`/admin/library/${badge.id}`}
                  className="group flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-line shadow-card transition hover:shadow-lift hover:ring-brand-200"
                >
                  <div className="flex items-start gap-3">
                    <BadgeEmblem badge={badge} size={52} />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold leading-tight">{badgeName(badge)}</p>
                      <p className="text-sm text-muted">{badge.tagline}</p>
                    </div>
                    <ChevronRight className="size-5 text-zinc-300 group-hover:text-brand-500" />
                  </div>
                  <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-muted">
                    <span>{badge.sections.map(sectionName).join(", ")}</span>
                    <span>· {badge.tasks.length} tasks</span>
                    {leaderTasks > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Users className="size-3.5" /> {leaderTasks} leader {leaderTasks === 1 ? "check" : "checks"}
                      </span>
                    )}
                    {badge.sheet && (
                      <span className="inline-flex items-center gap-1">
                        <Printer className="size-3.5" /> sheet
                      </span>
                    )}
                    {before && <span>· after {badgeName(before)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <Card className="flex items-start gap-3 p-4 text-sm text-muted">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-brand" />
        Badge content lives in the app&apos;s code (src/content), built from your group&apos;s sheets and the official Scouts requirements.
      </Card>
    </div>
  );
}
