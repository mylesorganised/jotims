import "server-only";
import { needsLeaderAttention } from "@/lib/helper/knowledge";
import { jevAsk, jevEnabled, noulOf } from "./jev";

/**
 * Should a leader check in with this young person, based on what they just
 * typed to the helper? Jev reads it in context (so "my Scratch cat is scared
 * of the dog" doesn't trip it); the keyword list is the fallback.
 */
export async function shouldFlagMessage(message: string, earlier: string[] = []) {
  if (!jevEnabled()) return needsLeaderAttention(message);
  try {
    const answers = await jevAsk(
      { young_person_message: message, earlier_messages_from_them: earlier.slice(-3) },
      {
        worry: {
          type: "noul",
          instructions:
            "Does `young_person_message` (read with `earlier_messages_from_them` for context) suggest the young person may be unsafe, upset, bullied, harmed, at risk of harming themselves, or being contacted or pressured by someone in a worrying way, so a trusted adult should check in with them? Talk about characters, games, stories or badge topics like online safety is not a worry on its own.",
        },
      },
    );
    const p = noulOf(answers.worry);
    return Number.isFinite(p) ? p >= 0.5 : needsLeaderAttention(message);
  } catch (error) {
    console.error("Safeguarding check failed, using keywords", error);
    return needsLeaderAttention(message);
  }
}
