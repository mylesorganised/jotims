import type { Metadata } from "next";
import { Download } from "lucide-react";
import { AddScoutForm, ImportScoutsForm } from "@/components/admin/scout-forms";
import { ScoutTable, type ScoutTableRow } from "@/components/admin/scout-table";
import { buttonClass, Card, PageTitle } from "@/components/ui";
import { badgesForSection } from "@/content";
import { requireLeader } from "@/lib/auth";
import { ageOn, getGroupProgress, requestTime } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { badgeProgress } from "@/lib/progress";
import { formatDob } from "@/lib/validate";

export const metadata: Metadata = { title: "Young people" };

export default async function ScoutsPage() {
  await requireLeader();
  const group = await getGroupProgress();
  const now = await requestTime();

  const rows: ScoutTableRow[] = group.map(({ scout, statuses, awards }) => {
    const badges = badgesForSection(scout.section).map((b) => badgeProgress(b, statuses[b.id] ?? {}, awards.has(b.id)));
    const all = Object.values(statuses).flatMap((m) => Object.values(m));
    const required = badges.reduce((n, b) => n + b.required, 0);
    const done = badges.reduce((n, b) => n + b.done, 0);
    return {
      id: scout.id,
      name: `${scout.firstName} ${scout.lastName}`,
      section: scout.section,
      age: ageOn(scout.dob),
      dob: formatDob(scout.dob),
      tasksDone: all.filter((s) => s === "done").length,
      waiting: all.filter((s) => s === "submitted").length,
      awarded: awards.size,
      ready: badges.filter((b) => b.state === "ready").length,
      badgeCount: badges.length,
      percent: required ? Math.round((done / required) * 100) : 0,
      lastSeen: scout.lastSeenAt ? timeAgo(scout.lastSeenAt, now) : "never",
    };
  });

  return (
    <div className="space-y-8">
      <PageTitle
        title="Young people"
        subtitle={`${rows.length} on the list. They log in with their first name, last name and date of birth.`}
        actions={
          <a href="/api/admin/export" className={buttonClass("secondary", "sm")}>
            <Download className="size-4" /> Export CSV
          </a>
        }
      />
      <ScoutTable rows={rows} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Add one person</h2>
          <AddScoutForm />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Add lots at once</h2>
          <ImportScoutsForm />
        </Card>
      </div>
    </div>
  );
}
