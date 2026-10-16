"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/scout";
import { SECTIONS } from "@/content";
import { buttonClass, Callout, cn, inputClass, Label } from "./ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function GoButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full text-lg")}>
      {pending ? <LoaderCircle className="size-5 animate-spin" /> : children}
    </button>
  );
}

function SectionButton({ id, name, ages, emoji, color }: (typeof SECTIONS)[number]) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="section"
      value={id}
      disabled={pending}
      className="group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left ring-2 ring-line transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60"
      style={{ ["--c" as string]: color }}
    >
      <span className="grid size-14 place-items-center rounded-xl text-3xl" style={{ background: `${color}1a` }}>
        {emoji}
      </span>
      <span className="flex-1">
        <span className="block text-lg font-extrabold" style={{ color }}>
          {name}
        </span>
        <span className="text-sm text-muted">Ages {ages}</span>
      </span>
      <ArrowRight className="size-5 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-[var(--c)]" />
    </button>
  );
}

export function LoginForm({ needsCode, years }: { needsCode: boolean; years: number[] }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  const [backToLogin, setBackToLogin] = useState(0);
  const v = state.values;
  const signup = state.step === "signup" && backToLogin !== -1;

  if (signup && v) {
    return (
      <form action={action} className="animate-fade-up space-y-5">
        {(["first", "last", "day", "month", "year", "code"] as const).map((k) => (
          <input key={k} type="hidden" name={k} value={v[k]} />
        ))}
        <div>
          <h2 className="text-2xl font-extrabold">Nice to meet you, {v.first}! 👋</h2>
          <p className="mt-1 text-muted">
            We don&apos;t have you on our list yet, so let&apos;s add you. Which section are you in?
          </p>
        </div>
        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <SectionButton key={s.id} {...s} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setBackToLogin(-1)}
          className="w-full text-center text-sm font-semibold text-muted hover:text-brand-600"
        >
          Oops, that&apos;s not me. Go back and check my details
        </button>
      </form>
    );
  }

  return (
    <form action={(fd) => { setBackToLogin(0); return action(fd); }} className="space-y-5" key={backToLogin}>
      <div>
        <h2 className="text-2xl font-extrabold">Find your badges</h2>
        <p className="mt-1 text-muted">Type your name and pick your birthday.</p>
      </div>
      {state.error && <Callout tone="error">{state.error}</Callout>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="first">First name</Label>
          <input id="first" name="first" defaultValue={v?.first} autoComplete="given-name" required className={inputClass} placeholder="e.g. Sam" />
        </div>
        <div>
          <Label htmlFor="last">Last name</Label>
          <input id="last" name="last" defaultValue={v?.last} autoComplete="family-name" required className={inputClass} placeholder="e.g. Smith" />
        </div>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[15px] font-bold">Your birthday</legend>
        <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
          <select name="day" aria-label="Day" defaultValue={v?.day ?? ""} required className={cn(inputClass, "pr-2")}>
            <option value="" disabled>
              Day
            </option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <select name="month" aria-label="Month" defaultValue={v?.month ?? ""} required className={cn(inputClass, "pr-2")}>
            <option value="" disabled>
              Month
            </option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select name="year" aria-label="Year" defaultValue={v?.year ?? ""} required className={cn(inputClass, "pr-2")}>
            <option value="" disabled>
              Year
            </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      {needsCode && (
        <div>
          <Label htmlFor="code" hint="It's on the wall, or ask a leader.">
            Group code
          </Label>
          <input id="code" name="code" defaultValue={v?.code} required autoComplete="off" className={inputClass} />
        </div>
      )}
      <GoButton>
        Let&apos;s go <ArrowRight className="size-5" />
      </GoButton>
    </form>
  );
}
