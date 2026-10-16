import { jwtVerify, SignJWT } from "jose";

// Pure token helpers with no Next.js imports, so proxy.ts can use them too.

export const SCOUT_COOKIE = "joti_scout";
export const LEADER_COOKIE = "joti_leader";

export const SCOUT_SESSION_DAYS = 30;
export const LEADER_SESSION_DAYS = 7;

export type ScoutToken = { role: "scout"; scoutId: string };
export type LeaderToken = { role: "leader"; leaderId: string; name: string };

let cachedKey: Promise<Uint8Array> | undefined;

/**
 * SESSION_SECRET signs the login cookies. If it isn't set we derive one from
 * the database URL (which contains the database password), and fall back to a
 * fixed value for local development.
 */
function signingKey(): Promise<Uint8Array> {
  if (!cachedKey) {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const seed = process.env.SESSION_SECRET || (dbUrl ? `joti:${dbUrl}` : "joti-local-development-secret");
    cachedKey = crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(seed))
      .then((buf) => new Uint8Array(buf));
  }
  return cachedKey;
}

async function sign(payload: Record<string, unknown>, subject: string, days: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(await signingKey());
}

export function signScoutToken(scoutId: string) {
  return sign({ role: "scout" }, scoutId, SCOUT_SESSION_DAYS);
}

export function signLeaderToken(leaderId: string, name: string) {
  return sign({ role: "leader", name }, leaderId, LEADER_SESSION_DAYS);
}

export async function verifyScoutToken(token: string | undefined): Promise<ScoutToken | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await signingKey(), { algorithms: ["HS256"] });
    if (payload.role !== "scout" || typeof payload.sub !== "string") return null;
    return { role: "scout", scoutId: payload.sub };
  } catch {
    return null;
  }
}

export async function verifyLeaderToken(token: string | undefined): Promise<LeaderToken | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await signingKey(), { algorithms: ["HS256"] });
    if (payload.role !== "leader" || typeof payload.sub !== "string") return null;
    return { role: "leader", leaderId: payload.sub, name: typeof payload.name === "string" ? payload.name : "Leader" };
  } catch {
    return null;
  }
}
