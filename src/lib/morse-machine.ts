// The pretend Morse machine's brain: turning key presses into letters, and
// checking what it heard against the message they meant to send.

import type { MachineSpeed, MorseMachineDef } from "@/content/types";
import type { Answers } from "@/lib/db/schema";
import { MORSE, simplify } from "./codes";

/** Press shorter than `dashAt` = dot. A gap of `letterGap` ends a letter, `wordGap` starts a new word (ms). */
export const SPEEDS: Record<MachineSpeed, { label: string; emoji: string; dashAt: number; letterGap: number; wordGap: number }> = {
  slow: { label: "Slow", emoji: "🐢", dashAt: 280, letterGap: 1100, wordGap: 2600 },
  medium: { label: "Medium", emoji: "🚶", dashAt: 240, letterGap: 750, wordGap: 1800 },
  fast: { label: "Fast", emoji: "🐇", dashAt: 170, letterGap: 450, wordGap: 1100 },
};

/** One press of the key: what it was read as, and the gap before it. */
export type Press = { sym: "." | "-"; gap: "none" | "letter" | "word"; ms: number };

export type SentLetter = { code: string; ch: string | null; word: number };

const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

export const heardAs = (code: string): string | null => REVERSE[code] ?? null;

/** Groups presses into letters (and words) by the gaps between them. */
export function lettersOf(presses: Press[]): SentLetter[] {
  const letters: SentLetter[] = [];
  let word = 0;
  presses.forEach((p, i) => {
    if (i === 0 || p.gap !== "none") {
      if (i > 0 && p.gap === "word") word++;
      letters.push({ code: p.sym, ch: null, word });
    } else {
      letters[letters.length - 1].code += p.sym;
    }
  });
  return letters.map((l) => ({ ...l, ch: heardAs(l.code) }));
}

export function heardText(letters: SentLetter[]) {
  return letters.map((l, i) => (i > 0 && l.word !== letters[i - 1].word ? " " : "") + (l.ch ?? "?")).join("");
}

export function morseOf(letters: SentLetter[]) {
  return letters.map((l, i) => (i > 0 && l.word !== letters[i - 1].word ? " / " : i > 0 ? " " : "") + l.code).join("");
}

/** The message they planned, as words of letters that have a Morse code. */
export function plannedWords(text: string): string[][] {
  return simplify(text)
    .split(" ")
    .map((w) => [...w].filter((ch) => MORSE[ch]))
    .filter((w) => w.length);
}

export function machineApplies(def: MorseMachineDef, answers: Answers) {
  return !def.when || answers[def.when.field] === def.when.equals;
}

export type LetterResult =
  | { kind: "right"; want: string; sent: string; at: number }
  | { kind: "wrong"; want: string; sent: string; heard: string | null; at: number }
  | { kind: "missed"; want: string; at: number }
  | { kind: "extra"; sent: string; heard: string | null };

export type MachineCheck = {
  results: LetterResult[];
  right: number;
  total: number;
  /** word gaps in the right places (these don't count against them) */
  wordsMatch: boolean;
  seconds: number;
  wpm: number;
  /** good enough for the machine to count it */
  passed: boolean;
  perfect: boolean;
  tips: string[];
};

/**
 * Lines up what was sent with what they meant to send (fewest changes), so a
 * missed or extra letter doesn't make every letter after it look wrong.
 */
export function lineUp(want: string[], sent: string[]): LetterResult[] {
  const n = want.length;
  const m = sent.length;
  const cost = (i: number, j: number) => (MORSE[want[i]] === sent[j] ? 0 : 1);
  const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j - 1] + cost(i - 1, j - 1), d[i - 1][j] + 1, d[i][j - 1] + 1);
  const out: LetterResult[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + cost(i - 1, j - 1)) {
      const sentCode = sent[j - 1];
      out.push(
        cost(i - 1, j - 1) === 0
          ? { kind: "right", want: want[i - 1], sent: sentCode, at: i - 1 }
          : { kind: "wrong", want: want[i - 1], sent: sentCode, heard: heardAs(sentCode), at: i - 1 },
      );
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      out.push({ kind: "missed", want: want[i - 1], at: i - 1 });
      i--;
    } else {
      out.push({ kind: "extra", sent: sent[j - 1], heard: heardAs(sent[j - 1]) });
      j--;
    }
  }
  return out.reverse();
}

const PASS = 0.8;

export function checkMessage(input: {
  planned: string;
  letters: SentLetter[];
  seconds: number;
  minWpm?: number;
}): MachineCheck {
  const words = plannedWords(input.planned);
  const want = words.flat();
  const results = lineUp(
    want,
    input.letters.map((l) => l.code),
  );
  const right = results.filter((r) => r.kind === "right").length;
  const total = want.length;
  const sentWords = input.letters.length ? input.letters[input.letters.length - 1].word + 1 : 0;
  const minutes = Math.max(input.seconds, 1) / 60;
  const wpm = Math.round((words.length / minutes) * 10) / 10;
  const lettersOk = total > 0 && right / total >= PASS && results.filter((r) => r.kind === "extra").length <= Math.max(1, total * 0.2);
  const fastEnough = !input.minWpm || wpm >= input.minWpm * 0.8;
  const perfect = total > 0 && right === total && results.length === total;

  let shortDash = 0;
  let longDot = 0;
  let merged = 0;
  let split = 0;
  let missed = 0;
  let short = 0;
  // A letter that's too long next to a missed one is two letters run together, not a missing letter.
  const ranTogether = new Set<number>();
  results.forEach((r, k) => {
    if (r.kind !== "wrong" || r.sent.length <= MORSE[r.want].length) return;
    if (results[k + 1]?.kind === "missed") ranTogether.add(k + 1);
    else if (results[k - 1]?.kind === "missed") ranTogether.add(k - 1);
  });
  results.forEach((r, k) => {
    if (r.kind === "missed" && !ranTogether.has(k)) missed++;
    if (r.kind === "extra") split++;
    if (r.kind !== "wrong") return;
    const code = MORSE[r.want];
    if (r.sent.length === code.length) {
      for (let p = 0; p < code.length; p++) {
        if (code[p] === "-" && r.sent[p] === ".") shortDash++;
        if (code[p] === "." && r.sent[p] === "-") longDot++;
      }
    } else if (r.sent.length > code.length) {
      merged++;
    } else if (results[k + 1]?.kind !== "extra" && results[k - 1]?.kind !== "extra") {
      // too short, and not a letter cut in two (that's counted with the extra letter)
      short++;
    }
  });

  const tips: string[] = [];
  if (shortDash) tips.push("Some **dashes** came out as dots. Hold the key down a little longer for a dash.");
  if (longDot) tips.push("Some **dots** came out as dashes. A dot is a really quick tap.");
  if (merged) tips.push("Some letters ran into each other. After each letter, wait until the bar reaches **next letter**.");
  if (split) tips.push("Some letters got split in two. Try not to stop in the middle of a letter. The 🐢 Slow speed gives you longer.");
  if (short) tips.push("Some letters were missing a dot or a dash. Check the code under each letter.");
  if (missed) tips.push("A letter or two went missing. Check you sent every letter.");
  if (sentWords !== words.length && right > 0)
    tips.push("Gaps between words don't count, but to start a new word you can wait until the bar says **new word**, or press **New word**.");
  if (!fastEnough && input.minWpm)
    tips.push(`You sent it at about **${wpm} words a minute**. Try to go a bit quicker: aim for about ${input.minWpm}.`);

  return {
    results,
    right,
    total,
    wordsMatch: sentWords === words.length,
    seconds: Math.round(input.seconds),
    wpm,
    passed: lettersOk && fastEnough,
    perfect,
    tips,
  };
}

export function formatTime(seconds: number) {
  const s = Math.round(seconds);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
}

/** What goes in the answer box, for leaders (and the AI leader) to read. */
export function machineSummary(check: MachineCheck, letters: SentLetter[], tries: { best?: number } = {}) {
  const heard = heardText(letters);
  const verdict = check.perfect
    ? `all ${check.total} letters right`
    : `${check.right} of ${check.total} letters right`;
  return [
    `Heard: ${heard}`,
    `${check.passed ? "✓ Understood" : "Not quite"}: ${verdict}, sent in ${formatTime(check.seconds)} (${check.wpm} words a minute)${tries.best ? `. Their best of ${tries.best} tries` : ""}.`,
    `Code sent: ${morseOf(letters)}`,
  ].join("\n");
}
