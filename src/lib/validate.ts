import type { FieldDef, TaskDef } from "@/content/types";
import type { AnswerValue, Answers, Section } from "@/lib/db/schema";

const MAX_TEXT = 10_000;

export function isSection(value: unknown): value is Section {
  return value === "beavers" || value === "cubs" || value === "scouts";
}

/** Turns "beavers", "Cub", "SCOUTS" etc. into a section id. */
export function parseSection(value: string): Section | null {
  const v = value.trim().toLowerCase().replace(/s$/, "");
  if (v === "beaver") return "beavers";
  if (v === "cub") return "cubs";
  if (v === "scout") return "scouts";
  return null;
}

/** Builds YYYY-MM-DD from parts, or null if it isn't a real, plausible date of birth. */
export function makeDob(day: unknown, month: unknown, year: unknown): string | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  const thisYear = new Date().getFullYear();
  if (y < thisYear - 30 || y > thisYear - 3) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Accepts 05/09/2016, 5-9-2016, 5.9.2016 (UK order) or 2016-09-05. */
export function parseDob(text: string): string | null {
  const t = text.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return makeDob(m[3], m[2], m[1]);
  m = t.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return makeDob(m[1], m[2], year);
  }
  return null;
}

export function formatDob(dob: string) {
  const [y, m, d] = dob.split("-");
  return `${d}/${m}/${y}`;
}

function cleanText(v: unknown) {
  return typeof v === "string" ? v.slice(0, MAX_TEXT) : "";
}

function cleanField(field: FieldDef, raw: unknown): AnswerValue | undefined {
  switch (field.kind) {
    case "text":
      return cleanText(raw);
    case "choice":
      return typeof raw === "string" && field.options.includes(raw) ? raw : "";
    case "list":
      return Array.from({ length: field.count }, (_, i) => cleanText(Array.isArray(raw) ? raw[i] : ""));
    case "table":
      return Array.from({ length: field.rows }, (_, r) =>
        Array.from({ length: field.columns.length }, (_, c) => {
          const row = Array.isArray(raw) ? raw[r] : undefined;
          return cleanText(Array.isArray(row) ? row[c] : "");
        }),
      );
    case "checklist":
      return Array.from({ length: field.items.length }, (_, i) => Array.isArray(raw) && raw[i] === true);
    case "led":
      return Array.from({ length: 25 }, (_, i) => Array.isArray(raw) && raw[i] === true);
    case "upload":
      return undefined;
  }
}

/** Keeps only answers for fields this task actually has, in the right shape. */
export function sanitiseAnswers(task: TaskDef, raw: unknown): Answers {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Answers = {};
  for (const field of task.steps.flatMap((s) => s.fields ?? [])) {
    if (!(field.id in input)) continue;
    const value = cleanField(field, input[field.id]);
    if (value !== undefined) out[field.id] = value;
  }
  return out;
}
