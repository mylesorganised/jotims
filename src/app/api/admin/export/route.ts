import { BADGES, badgeName, getBadge, sectionName, type BadgeDef, type Section } from "@/content";
import { getLeader } from "@/lib/auth";
import { ageOn, getGroupProgress } from "@/lib/data";
import { badgeProgress } from "@/lib/progress";
import { csvCell } from "@/lib/csv";
import { formatDob } from "@/lib/validate";

/** Same columns as the badge tracker: the section's Communicator, then the staged badges. */
const COLUMNS: { label: string; badgeFor: (s: Section) => BadgeDef }[] = [
  { label: "Communicator", badgeFor: (s) => getBadge(`${s}-communicator`)! },
  ...BADGES.filter((b) => b.family !== "communicator").map((b) => ({ label: badgeName(b), badgeFor: () => b })),
];

/** One row per young person, one column per badge. */
export async function GET() {
  const leader = await getLeader();
  if (!leader) return new Response("Not allowed", { status: 403 });

  const group = await getGroupProgress();
  const header = ["First name", "Last name", "Section", "Date of birth", "Age", ...COLUMNS.map((c) => c.label), "Badges signed off"];
  const lines = [header.map(csvCell).join(",")];

  for (const { scout, statuses, awards } of group) {
    const cells = COLUMNS.map(({ badgeFor }) => {
      const badge = badgeFor(scout.section);
      const award = awards.get(badge.id);
      if (award) return `Signed off ${award.signedOffAt.toISOString().slice(0, 10)} (${award.signedOffBy})`;
      const p = badgeProgress(badge, statuses[badge.id] ?? {}, false);
      if (p.state === "ready") return "Ready to sign off";
      if (p.state === "not-started") return "Not started";
      return `${p.done}/${p.required} tasks`;
    });
    lines.push(
      [scout.firstName, scout.lastName, sectionName(scout.section), formatDob(scout.dob), ageOn(scout.dob), ...cells, awards.size]
        .map(csvCell)
        .join(","),
    );
  }

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="joti-badges-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
