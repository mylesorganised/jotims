import "server-only";

// Minimal client for TypeSafe's System One API (Jev). We call the HTTP API
// directly: one endpoint, typed questions in, calibrated answers out.

export type JevQuestion =
  | { type: "noul"; instructions: string | object; criteria?: { true?: string; false?: string } }
  | { type: "score"; instructions: string | object; criteria: string[] }
  | { type: "choice"; instructions: string | object; criteria: Record<string, string | null> };

export type JevAnswer =
  | { type: "noul"; noul: number }
  | { type: "score"; score: number; confidence?: number }
  | { type: "choice"; choice: string; confidence?: number; probabilities?: Record<string, number> };

const jevKey = () => process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY;

export function jevEnabled() {
  return Boolean(jevKey());
}

export async function jevAsk(state: unknown, questions: Record<string, JevQuestion>): Promise<Record<string, JevAnswer>> {
  const body = JSON.stringify({ model: process.env.TYPESAFE_MODEL || "jev-latest", state, questions });
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${jevKey()}`, "Content-Type": "application/json" },
      body,
    });
    if (res.ok) return ((await res.json()) as { answers: Record<string, JevAnswer> }).answers;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 3) throw new Error(`TypeSafe ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const wait = Number(res.headers.get("retry-after")) * 1000 || 400 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, wait));
  }
}

export const noulOf = (a: JevAnswer | undefined) => (a && a.type === "noul" ? a.noul : NaN);
export const scoreOf = (a: JevAnswer | undefined) => (a && a.type === "score" ? a.score : NaN);
