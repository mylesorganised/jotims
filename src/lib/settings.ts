import "server-only";
import { getDb, schema } from "@/lib/db";

export type Settings = {
  /** let scouts who aren't on the list create their own profile */
  allowSignup: boolean;
  /** optional code scouts must type to log in (shown on the wall at the event) */
  groupCode: string;
  eventName: string;
  /** the group's JOTA-JOTI Jamboree ID, shown in the chat guide */
  groupJid: string;
  /** the AI leader reviews work sent to a leader */
  aiReview: boolean;
  /** the AI leader signs badges off once every task is done */
  aiSignOff: boolean;
  /** the AI leader checks self-check tasks when they're finished, and sends back ones clearly not done */
  aiCheckSelf: boolean;
  /** let the AI leader approve tasks a leader would normally watch or receive in person */
  aiApproveInPerson: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  allowSignup: true,
  groupCode: "",
  eventName: "JOTA-JOTI 2026",
  groupJid: "",
  aiReview: true,
  aiSignOff: true,
  aiCheckSelf: true,
  aiApproveInPerson: false,
};

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.select().from(schema.settings);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
}

export async function saveSettings(next: Partial<Settings>) {
  const db = await getDb();
  for (const [key, value] of Object.entries(next)) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
}
