import "server-only";
import { getDb, schema } from "@/lib/db";

export type Settings = {
  /** let scouts who aren't on the list create their own profile */
  allowSignup: boolean;
  /** optional code scouts must type to log in (shown on the wall at the event) */
  groupCode: string;
  eventName: string;
};

export const DEFAULT_SETTINGS: Settings = {
  allowSignup: true,
  groupCode: "",
  eventName: "JOTA-JOTI 2026",
};

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.select().from(schema.settings);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
}

export async function saveSettings(next: Settings) {
  const db = await getDb();
  for (const [key, value] of Object.entries(next)) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
}
