import type { AnswerCheck, FieldDef, StepDef, TaskDef } from "@/content/types";
import type { AnswerValue, Answers } from "@/lib/db/schema";
import { normalizeMorse, simplify, toMorse } from "./codes";
import { machineApplies } from "./morse-machine";

export function asText(value: AnswerValue | undefined): string {
  return typeof value === "string" ? value : "";
}

export function asList(value: AnswerValue | undefined, count: number): string[] {
  const list = Array.isArray(value) ? (value as unknown[]).map((v) => (typeof v === "string" ? v : "")) : [];
  return Array.from({ length: count }, (_, i) => list[i] ?? "");
}

export function asTable(value: AnswerValue | undefined, rows: number, cols: number): string[][] {
  const table = Array.isArray(value) ? (value as unknown[]) : [];
  return Array.from({ length: rows }, (_, r) => {
    const row = Array.isArray(table[r]) ? (table[r] as unknown[]) : [];
    return Array.from({ length: cols }, (_, c) => (typeof row[c] === "string" ? (row[c] as string) : ""));
  });
}

export function asBools(value: AnswerValue | undefined, count: number): boolean[] {
  const list = Array.isArray(value) ? (value as unknown[]) : [];
  return Array.from({ length: count }, (_, i) => list[i] === true);
}

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Is this field filled in enough to submit? Optional fields always pass. */
export function fieldComplete(field: FieldDef, value: AnswerValue | undefined, uploadCount: number): boolean {
  if (!field.required) return true;
  switch (field.kind) {
    case "text": {
      const text = asText(value).trim();
      if (!text) return false;
      return field.minWords ? wordCount(text) >= field.minWords : true;
    }
    case "list":
      return asList(value, field.count).filter((v) => v.trim()).length >= (field.min ?? 1);
    case "table":
      return (
        asTable(value, field.rows, field.columns.length).filter((row) => row.some((c) => c.trim())).length >=
        (field.minRows ?? 1)
      );
    case "choice":
      return asText(value).length > 0;
    case "checklist": {
      const ticks = asBools(value, field.items.length);
      return field.requireAll ? ticks.every(Boolean) : ticks.filter(Boolean).length >= (field.min ?? 1);
    }
    case "upload":
      return uploadCount > 0;
    case "led":
      return asBools(value, 25).some(Boolean);
  }
}

function hasAnswer(value: AnswerValue | undefined) {
  return Array.isArray(value) ? value.some((v) => (typeof v === "string" ? v.trim() : Boolean(v))) : asText(value).trim().length > 0;
}

/**
 * Whether a field counts on the way they did the step. The Morse machine's box
 * isn't needed if they picked semaphore, or sent it to a real person instead.
 */
export function fieldNeeded(step: StepDef, field: FieldDef, answers: Answers): boolean {
  const machine = step.morseMachine;
  if (!machine || field.id !== machine.fills) return true;
  if (!machineApplies(machine, answers)) return false;
  return !(machine.manualOnly ?? []).some((id) => hasAnswer(answers[id]));
}

export type Missing = { stepIndex: number; stepTitle: string; label: string; fieldId: string };

export function missingFields(
  task: TaskDef,
  answers: Answers,
  uploadCounts: Record<string, number>,
): Missing[] {
  const missing: Missing[] = [];
  task.steps.forEach((step, stepIndex) => {
    for (const field of step.fields ?? []) {
      if (fieldNeeded(step, field, answers) && !fieldComplete(field, answers[field.id], uploadCounts[field.id] ?? 0)) {
        missing.push({ stepIndex, stepTitle: step.title, label: field.label, fieldId: field.id });
      }
    }
  });
  return missing;
}

/** null = nothing to check yet, true/false = right/wrong */
export function runCheck(check: AnswerCheck, value: string, ctx: { firstName: string }): boolean | null {
  if (!value.trim()) return null;
  if (check.kind === "equals") return simplify(value) === simplify(check.answer);
  const expected = toMorse(ctx.firstName);
  return normalizeMorse(value).replace(/ \/ /g, " ") === expected.replace(/ \/ /g, " ");
}
