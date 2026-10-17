import "server-only";
import type { FieldDef, TaskDef } from "@/content/types";
import { asBools, asList, asTable, asText, runCheck } from "@/lib/answers";
import type { Answers } from "@/lib/db/schema";
import type { UploadRow } from "@/lib/data";

export type ReviewField = { key: string; field: FieldDef; label: string; judged: boolean };

const clip = (text: string, max = 1500) => (text.length > max ? `${text.slice(0, max)}…` : text);

function render(field: FieldDef, answers: Answers, files: string[]): unknown {
  const value = answers[field.id];
  switch (field.kind) {
    case "text":
      return clip(asText(value).trim());
    case "choice":
      return asText(value);
    case "list":
      return asList(value, field.count).map((v) => clip(v.trim(), 400)).filter(Boolean);
    case "table":
      return asTable(value, field.rows, field.columns.length)
        .filter((row) => row.some((c) => c.trim()))
        .map((row) => Object.fromEntries(field.columns.map((col, i) => [col.label, clip(row[i].trim(), 300)])));
    case "checklist": {
      const ticks = asBools(value, field.items.length);
      return { ticked: field.items.filter((_, i) => ticks[i]), not_ticked: field.items.filter((_, i) => !ticks[i]) };
    }
    case "upload":
      return files;
    case "led": {
      const cells = asBools(value, 25);
      return Array.from({ length: 5 }, (_, r) => cells.slice(r * 5, r * 5 + 5).map((on) => (on ? "#" : ".")).join(""));
    }
  }
}

/** Is there anything for the young person to have written or uploaded here? */
function isEmpty(rendered: unknown) {
  if (rendered == null || rendered === "") return true;
  if (Array.isArray(rendered)) return rendered.length === 0;
  if (typeof rendered === "object" && "ticked" in (rendered as object)) return (rendered as { ticked: string[] }).ticked.length === 0;
  return false;
}

/**
 * The task and one young person's answers, shaped for a marker to read.
 * Fields are re-keyed q1, q2… so they're easy to reference, and the
 * questions and answers share keys.
 */
export function submissionState(input: {
  task: TaskDef;
  answers: Answers;
  uploads: UploadRow[];
  descriptions: Map<string, string>;
  firstName: string;
  section: string;
  age: number;
}) {
  const { task } = input;
  const questions: Record<string, string> = {};
  const optional: Record<string, string> = {};
  const answers: Record<string, unknown> = {};
  const autoChecks: Record<string, string> = {};
  const fields: ReviewField[] = [];

  task.steps.forEach((step) => {
    for (const field of step.fields ?? []) {
      const key = `q${fields.length + 1}`;
      const label = field.hint ? `${field.label} (${field.hint})` : field.label;
      const files = input.uploads.filter((u) => u.fieldId === field.id).map((u) => input.descriptions.get(u.id) ?? `"${u.fileName}"`);
      const rendered = render(field, input.answers, files);
      (field.required ? questions : optional)[key] = step.withLeader ? `${label} [done with a leader: ${step.title}]` : label;
      if (!isEmpty(rendered)) answers[key] = rendered;
      if (field.kind === "text" && field.check) {
        const result = runCheck(field.check, asText(input.answers[field.id]), { firstName: input.firstName });
        if (result !== null) autoChecks[key] = result ? "correct" : "not correct";
      }
      // Free-text answers and described images can be judged one by one; ticks and choices can't.
      const judged =
        Boolean(field.required) &&
        (["text", "list", "table"].includes(field.kind) ||
          (field.kind === "upload" && files.some((f) => f.startsWith("Image "))));
      fields.push({ key, field, label: field.label, judged });
    }
  });

  return {
    fields,
    state: {
      task: {
        title: task.title,
        what_it_is: task.summary,
        what_leaders_look_for: task.leaderCheck ?? task.summary,
        questions,
        ...(Object.keys(optional).length ? { optional_questions: optional } : {}),
      },
      submission: {
        young_person: { section: input.section, age: input.age },
        answers,
        ...(Object.keys(autoChecks).length ? { auto_checks: autoChecks } : {}),
      },
    },
  };
}
