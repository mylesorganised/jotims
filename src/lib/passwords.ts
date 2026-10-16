import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

/** Hash format: scrypt$N$r$p$salt$hash (salt and hash base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, rr, pp, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(rr),
    p: Number(pp),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Returns a message if the password is too weak, otherwise null. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (/^(password|12345678|qwerty|scouts|letmein)/i.test(password)) return "That password is too easy to guess.";
  return null;
}

// Best-effort brute-force protection: per username + IP, in memory.
const failures = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

export function loginBlocked(key: string): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function noteLoginFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else entry.count++;
}

export function clearLoginFailures(key: string) {
  failures.delete(key);
}
