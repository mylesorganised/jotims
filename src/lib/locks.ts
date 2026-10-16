import "server-only";
import { badgeName, type BadgeDef } from "@/content";
import { getScoutOverview } from "@/lib/data";
import { lockedBy } from "@/lib/progress";

/** The badge this scout must finish before working on `badge`, or null. */
export async function badgeLockFor(scoutId: string, badge: BadgeDef): Promise<BadgeDef | null> {
  const { statuses, awards } = await getScoutOverview(scoutId);
  return lockedBy(badge, statuses, (id) => awards.has(id));
}

export function lockMessage(before: BadgeDef) {
  return `Finish ${badgeName(before)} first. This stage unlocks when it's done.`;
}
