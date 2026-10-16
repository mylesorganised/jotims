import { CircleCheck, CircleX } from "lucide-react";
import type { FieldDef, TaskDef } from "@/content/types";
import { asBools, asList, asTable, asText, runCheck } from "@/lib/answers";
import type { Answers } from "@/lib/db/schema";
import type { UploadRow } from "@/lib/data";
import { FilePreview } from "../uploader";
import { cn } from "../ui";

/** Read-only view of everything a young person entered, step by step. */
export function AnswerView({
  task,
  answers,
  uploads,
  firstName,
}: {
  task: TaskDef;
  answers: Answers;
  uploads: UploadRow[];
  firstName: string;
}) {
  const steps = task.steps.filter((s) => s.fields?.length);
  if (!steps.length) return <p className="text-sm text-muted">This task has nothing to fill in. It&apos;s done with a leader.</p>;
  return (
    <div className="space-y-6">
      {steps.map((step) => (
        <section key={step.title}>
          <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-brand-600">{step.title}</h3>
          <dl className="space-y-3">
            {step.fields!.map((field) => (
              <div key={field.id} className="rounded-xl bg-canvas p-3 ring-1 ring-line">
                <dt className="text-sm font-bold text-muted">{field.label}</dt>
                <dd className="mt-1">
                  <Answer field={field} answers={answers} uploads={uploads.filter((u) => u.fieldId === field.id)} firstName={firstName} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

const Empty = () => <span className="text-sm italic text-zinc-400">Not filled in</span>;

function Answer({ field, answers, uploads, firstName }: { field: FieldDef; answers: Answers; uploads: UploadRow[]; firstName: string }) {
  const value = answers[field.id];
  switch (field.kind) {
    case "text": {
      const text = asText(value);
      if (!text.trim()) return <Empty />;
      const check = field.check ? runCheck(field.check, text, { firstName }) : null;
      return (
        <div>
          <p className={cn("whitespace-pre-wrap text-[15px]", field.mono && "font-mono tracking-wider")}>{text}</p>
          {check !== null && (
            <p className={cn("mt-1 inline-flex items-center gap-1 text-xs font-bold", check ? "text-emerald-700" : "text-rose-600")}>
              {check ? <CircleCheck className="size-3.5" /> : <CircleX className="size-3.5" />}
              {check ? "Auto-check: correct" : "Auto-check: doesn't match the answer"}
              {!check && field.check?.kind === "equals" && <span className="font-normal text-muted"> (expected “{field.check.answer}”)</span>}
            </p>
          )}
        </div>
      );
    }
    case "choice":
      return asText(value) ? <span className="font-semibold">{asText(value)}</span> : <Empty />;
    case "list": {
      const items = asList(value, field.count).filter((v) => v.trim());
      return items.length ? (
        <ol className="list-decimal space-y-0.5 pl-5 text-[15px]">
          {items.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ol>
      ) : (
        <Empty />
      );
    }
    case "table": {
      const rows = asTable(value, field.rows, field.columns.length).filter((r) => r.some((c) => c.trim()));
      return rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {field.columns.map((c) => (
                  <th key={c.id} className="border-b border-line px-2 py-1 text-left text-xs font-black text-muted">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty />
      );
    }
    case "checklist": {
      const ticks = asBools(value, field.items.length);
      return (
        <ul className="space-y-0.5 text-[15px]">
          {field.items.map((item, i) => (
            <li key={item} className={cn("flex items-center gap-2", !ticks[i] && "text-zinc-400")}>
              {ticks[i] ? <CircleCheck className="size-4 text-emerald-600" /> : <CircleX className="size-4" />} {item}
            </li>
          ))}
        </ul>
      );
    }
    case "upload":
      return uploads.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {uploads.map((u) => (
            <FilePreview key={u.id} file={{ id: u.id, fileName: u.fileName, contentType: u.contentType, size: u.size }} />
          ))}
        </div>
      ) : (
        <Empty />
      );
    case "led": {
      const leds = asBools(value, 25);
      return leds.some(Boolean) ? (
        <div className="inline-grid grid-cols-5 gap-1 rounded-xl bg-zinc-900 p-2">
          {leds.map((on, i) => (
            <span key={i} className={cn("size-5 rounded", on ? "bg-red-500" : "bg-zinc-700")} />
          ))}
        </div>
      ) : (
        <Empty />
      );
    }
  }
}
