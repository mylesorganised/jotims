"use client";

import { useState } from "react";
import { Check, CircleCheck, Sparkles } from "lucide-react";
import type { RecordedUpload } from "@/app/actions/scout";
import type { FieldDef } from "@/content/types";
import { asBools, asList, asTable, asText, runCheck, wordCount } from "@/lib/answers";
import type { AnswerValue } from "@/lib/db/schema";
import { buttonClass, cn, inputClass } from "./ui";
import { Uploader, type UploadConfig } from "./uploader";

type Props = {
  field: FieldDef;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  disabled: boolean;
  firstName: string;
  uploads: RecordedUpload[];
  onUploads: (files: RecordedUpload[]) => void;
  uploadConfig: UploadConfig;
};

export function Field(props: Props) {
  const { field } = props;
  const id = `field-${field.id}`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block">
        <span className="text-[15px] font-bold text-ink">{field.label}</span>
        {!field.required && field.kind !== "upload" && !/optional/i.test(field.label) && (
          <span className="ml-1.5 text-xs font-semibold text-muted">(optional)</span>
        )}
        {field.hint && <span className="mt-0.5 block text-sm text-muted">{field.hint}</span>}
      </label>
      <FieldInput {...props} id={id} />
    </div>
  );
}

function FieldInput({ field, value, onChange, disabled, firstName, uploads, onUploads, uploadConfig, id }: Props & { id: string }) {
  switch (field.kind) {
    case "text":
      return <TextField field={field} value={asText(value)} onChange={onChange} disabled={disabled} firstName={firstName} id={id} />;

    case "list": {
      const items = asList(value, field.count);
      return (
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-black text-brand-700">{i + 1}</span>
              <input
                id={i === 0 ? id : undefined}
                value={item}
                disabled={disabled}
                placeholder={i === 0 ? field.placeholder : undefined}
                onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
                className={inputClass}
              />
            </li>
          ))}
        </ol>
      );
    }

    case "table": {
      const rows = asTable(value, field.rows, field.columns.length);
      const set = (r: number, c: number, v: string) =>
        onChange(rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)));
      return (
        <div className="overflow-x-auto rounded-xl ring-1 ring-line">
          <table className="w-full min-w-[32rem] border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-brand-50/70">
                <th className="w-8 px-2 py-2 text-left text-xs font-black text-brand-700">#</th>
                {field.columns.map((c) => (
                  <th key={c.id} className="px-2 py-2 text-left text-xs font-black text-brand-700">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-t border-line">
                  <td className="px-2 text-xs font-bold text-muted">{r + 1}</td>
                  {row.map((cell, c) => (
                    <td key={c} className="p-1">
                      <input
                        id={r === 0 && c === 0 ? id : undefined}
                        value={cell}
                        disabled={disabled}
                        aria-label={`${field.columns[c].label} ${r + 1}`}
                        placeholder={r === 0 ? field.columns[c].placeholder : undefined}
                        onChange={(e) => set(r, c, e.target.value)}
                        className="w-full rounded-lg bg-transparent px-2 py-1.5 outline-none placeholder:text-zinc-300 focus:bg-brand-50/60 focus:ring-2 focus:ring-brand-300 disabled:text-zinc-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "choice": {
      const current = asText(value);
      return (
        <div className="flex flex-wrap gap-2" role="radiogroup" id={id}>
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={current === opt}
              disabled={disabled}
              onClick={() => onChange(current === opt ? "" : opt)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-bold ring-1 transition disabled:opacity-70",
                current === opt ? "bg-brand-500 text-white ring-brand-500" : "bg-white text-ink ring-line hover:ring-brand-300",
              )}
            >
              {current === opt && <Check className="size-4" />}
              {opt}
            </button>
          ))}
        </div>
      );
    }

    case "checklist": {
      const ticks = asBools(value, field.items.length);
      return (
        <div className="space-y-2" id={id}>
          {field.items.map((item, i) => (
            <button
              key={item}
              type="button"
              role="checkbox"
              aria-checked={ticks[i]}
              disabled={disabled}
              onClick={() => onChange(ticks.map((t, j) => (j === i ? !t : t)))}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[15px] font-semibold ring-1 transition disabled:opacity-70",
                ticks[i] ? "bg-emerald-50 ring-emerald-300" : "bg-white ring-line hover:ring-brand-300",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md ring-2",
                  ticks[i] ? "bg-emerald-500 text-white ring-emerald-500" : "ring-zinc-300",
                )}
              >
                {ticks[i] && <Check className="size-4" strokeWidth={3} />}
              </span>
              {item}
            </button>
          ))}
        </div>
      );
    }

    case "upload":
      return (
        <Uploader
          fieldId={field.id}
          accept={field.accept}
          multiple={field.multiple}
          studio={field.studio}
          files={uploads}
          onChange={onUploads}
          disabled={disabled}
          config={uploadConfig}
        />
      );

    case "led":
      return <LedGrid value={asBools(value, 25)} onChange={onChange} disabled={disabled} />;
  }
}

function TextField({
  field,
  value,
  onChange,
  disabled,
  firstName,
  id,
}: {
  field: Extract<FieldDef, { kind: "text" }>;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  firstName: string;
  id: string;
}) {
  const [checked, setChecked] = useState<boolean | null>(null);
  const words = wordCount(value);
  const common = {
    id,
    value,
    disabled,
    placeholder: field.placeholder,
    onChange: (e: { target: { value: string } }) => {
      onChange(e.target.value);
      setChecked(null);
    },
    className: cn(inputClass, field.mono && "font-mono tracking-wider"),
    spellCheck: !field.mono,
  };
  const result = checked && field.check ? runCheck(field.check, value, { firstName }) : null;
  return (
    <div className="space-y-2">
      {field.long ? <textarea rows={4} {...common} className={cn(common.className, "min-h-28 resize-y")} /> : <input {...common} />}
      <div className="flex flex-wrap items-center gap-3">
        {field.minWords && (
          <span className={cn("text-xs font-bold", words >= field.minWords ? "text-emerald-700" : "text-muted")}>
            {words >= field.minWords && <CircleCheck className="mr-1 inline size-3.5" />}
            {words} / {field.minWords} words
          </span>
        )}
        {field.check && value.trim() && (
          <button type="button" onClick={() => setChecked(true)} className={buttonClass("secondary", "sm")}>
            <Sparkles className="size-4 text-amber-500" /> Check my answer
          </button>
        )}
        {result === true && field.check && (
          <span className="animate-pop text-sm font-bold text-emerald-700">{field.check.success}</span>
        )}
        {result === false && (
          <span className="animate-pop text-sm font-bold text-amber-700">Not quite yet. Have another look and try again!</span>
        )}
      </div>
    </div>
  );
}

export function LedGrid({ value, onChange, disabled }: { value: boolean[]; onChange?: (v: boolean[]) => void; disabled?: boolean }) {
  return (
    <div className="inline-grid grid-cols-5 gap-1.5 rounded-2xl bg-zinc-900 p-3 shadow-inner">
      {value.map((on, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled || !onChange}
          aria-label={`Light ${i + 1} ${on ? "on" : "off"}`}
          onClick={() => onChange?.(value.map((v, j) => (j === i ? !v : v)))}
          className={cn(
            "size-9 rounded-md transition sm:size-10",
            on ? "bg-red-500 shadow-[0_0_12px_2px_rgba(239,68,68,0.7)]" : "bg-zinc-700 hover:bg-zinc-600",
          )}
        />
      ))}
    </div>
  );
}
