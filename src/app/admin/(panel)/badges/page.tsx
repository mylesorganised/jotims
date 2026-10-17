import type { Metadata } from "next";
import Link from "next/link";
import { Check, Download } from "lucide-react";
import { BadgeEmblem } from "@/components/badge-emblem";
import { buttonClass, Card, cn, PageTitle } from "@/components/ui";
import { BADGES, badgeName, getBadge, SECTIONS, type BadgeDef, type Section } from "@/content";
import { requireLeader } from "@/lib/auth";
import { getGroupProgress } from "@/lib/data";
import { badgeProgress, type BadgeProgress } from "@/lib/progress";

export const metadata: Metadata = { title: "Badge tracker" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

/** Columns: the section's own Communicator, then the staged badges. */
const COLUMNS = [
  { id: "communicator", label: "Communicator", badgeFor: (s: Section) => getBadge(`${s}-communicator`)! },
  ...BADGES.filter((b) => b.family !== "communicator").map((b) => ({ id: b.id, label: badgeName(b), badgeFor: () => b })),
];

export default async function BadgeTrackerPage({ searchParams }: PageProps<"/admin/badges">) {
  await requireLeader();
  const { section: sectionParam } = await searchParams;
  const filter = SECTIONS.find((s) => s.id === sectionParam)?.id;
  const group = (await getGroupProgress()).filter((g) => !filter || g.scout.section === filter);

  const grid = group.map(({ scout, statuses, awards }) => ({
    scout,
    cells: COLUMNS.map((col) => {
      const badge = col.badgeFor(scout.section);
      return { badge, progress: badgeProgress(badge, statuses[badge.id] ?? {}, awards.has(badge.id)) };
    }),
  }));

  return (
    <div className="space-y-6">
      <PageTitle
        title="Badge tracker"
        subtitle="Everyone's badges at a glance. Click a cell to see that young person's work."
        actions={
          <a href="/api/admin/export" download className={buttonClass("secondary", "sm")}>
            <Download className="size-4" /> Export CSV
          </a>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
          {[{ id: undefined, name: "Everyone" }, ...SECTIONS].map((s) => (
            <Link
              key={s.name}
              href={s.id ? `/admin/badges?section=${s.id}` : "/admin/badges"}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-bold", filter === s.id ? "bg-brand-500 text-white" : "text-muted hover:text-ink")}
            >
              {s.name}
            </Link>
          ))}
        </div>
        <Legend />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-muted">Name</th>
              {COLUMNS.map((col) => {
                const sample = col.badgeFor(filter ?? "scouts");
                return (
                  <th key={col.id} className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <BadgeEmblem badge={sample} size={34} />
                      <span className="text-[11px] font-bold leading-tight text-muted">{col.label}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grid.map(({ scout, cells }) => (
              <tr key={scout.id} className="border-b border-line/60 last:border-0 hover:bg-brand-50/30">
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                  <Link href={`/admin/scouts/${scout.id}`} className="font-bold hover:text-brand-600 hover:underline">
                    {scout.firstName} {scout.lastName}
                  </Link>
                  <div className="text-xs capitalize text-muted">{scout.section}</div>
                </td>
                {cells.map(({ badge, progress }) => (
                  <td key={badge.id} className="px-2 py-2.5 text-center">
                    <Link href={`/admin/scouts/${scout.id}#${badge.id}`} className="inline-block" title={`${badgeName(badge)}: ${progress.done}/${progress.required}`}>
                      <Cell progress={progress} badge={badge} />
                    </Link>
                  </td>
                ))}
              </tr>
            ))}
            {grid.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-muted">
                  No young people yet.
                </td>
              </tr>
            )}
          </tbody>
          {grid.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-line bg-canvas text-xs font-bold text-muted">
                <td className="sticky left-0 bg-canvas px-4 py-2.5">Signed off</td>
                {COLUMNS.map((col, i) => (
                  <td key={col.id} className="px-2 py-2.5 text-center">
                    {grid.filter((g) => g.cells[i].progress.state === "awarded").length}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </Card>
    </div>
  );
}

function Cell({ progress, badge }: { progress: BadgeProgress; badge: BadgeDef }) {
  if (progress.state === "awarded")
    return (
      <span className="grid size-9 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
        <Check className="size-5" strokeWidth={3} />
      </span>
    );
  if (progress.state === "ready")
    return <span className="grid size-9 place-items-center rounded-full bg-sky-500 text-[11px] font-black text-white ring-4 ring-sky-100">Sign</span>;
  if (progress.state === "not-started") return <span className="grid size-9 place-items-center rounded-full bg-zinc-100 text-zinc-300">–</span>;
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-9 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#efeaf6" strokeWidth="4" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={badge.ring} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress.percent / 100)} />
      </svg>
      <span className="text-[10px] font-black">{progress.percent}%</span>
      {progress.waiting > 0 && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-amber-400 ring-2 ring-white" title="Waiting for review" />}
    </span>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-emerald-500" /> Signed off
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-sky-500" /> Ready to sign off
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full ring-2 ring-brand-400" /> In progress
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-amber-400" /> Waiting for review
      </span>
    </div>
  );
}
