"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Clock,
  CloudCheck,
  ExternalLink,
  Eye,
  FileText,
  Hand,
  LoaderCircle,
  MessageSquare,
  PartyPopper,
  Pencil,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  cancelHelpAction,
  reopenTaskAction,
  requestHelpAction,
  saveAnswersAction,
  submitTaskAction,
  type RecordedUpload,
} from "@/app/actions/scout";
import type { StepDef, StepImage, TaskDef } from "@/content/types";
import { asText, fieldComplete, fieldNeeded, missingFields, type Missing } from "@/lib/answers";
import type { AnswerValue, Answers, TaskStatus } from "@/lib/db/schema";
import { machineApplies } from "@/lib/morse-machine";
import { Field } from "./fields";
import { useHelperContext } from "./helper/helper";
import { ExplainChat } from "./explain-chat";
import { MessageSim } from "./message-sim";
import { MorseMachine } from "./morse-machine";
import { RichText } from "./rich-text";
import { Tool } from "./tools";
import { buttonClass, Callout, cn } from "./ui";
import type { UploadConfig } from "./uploader";

export type WizardRecord = {
  status: TaskStatus;
  answers: Answers;
  stepReached: number;
  feedback: string | null;
  reviewedBy: string | null;
  helpRequestedAt: string | null;
};

export type WizardProps = {
  badge: { id: string; name: string; color: string; ring: string };
  task: TaskDef;
  nextTask: { id: string; title: string; emoji: string } | null;
  record: WizardRecord | null;
  uploads: (RecordedUpload & { fieldId: string })[];
  scout: { id: string; firstName: string };
  uploadMode: UploadConfig["mode"];
  blobAccess: UploadConfig["blobAccess"];
  /** leaders' preview: everything works on screen, nothing is saved or sent */
  preview?: boolean;
  /** where badge links point (scouts: /badges, leaders' preview: /admin/library) */
  basePath?: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function TaskWizard({
  badge,
  task,
  nextTask,
  record,
  uploads: initialUploads,
  scout,
  uploadMode,
  blobAccess,
  preview = false,
  basePath = "/badges",
}: WizardProps) {
  const router = useRouter();
  const status: TaskStatus | "todo" = record?.status ?? "todo";
  const locked = status === "submitted" || status === "done";
  const finishIndex = task.steps.length;

  const [step, setStep] = useState(() =>
    locked ? finishIndex : Math.min(record?.stepReached ?? 0, task.steps.length - 1),
  );
  const [answers, setAnswers] = useState<Answers>(record?.answers ?? {});
  const [uploads, setUploads] = useState(initialUploads);
  const [save, setSave] = useState<SaveState>("idle");
  const [zoom, setZoom] = useState<StepImage | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  /** whether the AI leader is on for the pretend inbox / phone (they report it once they load) */
  const [simOn, setSimOn] = useState(false);
  /** steps where they did it for real instead of in the pretend inbox / phone / Morse machine */
  const [manual, setManual] = useState<Record<number, boolean>>({});

  const answersRef = useRef(answers);
  const maxStep = useRef(record?.stepReached ?? 0);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const top = useRef<HTMLDivElement>(null);

  const uploadConfig: UploadConfig = { mode: uploadMode, blobAccess, scoutId: scout.id, badgeId: badge.id, taskId: task.id };

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (preview) dirty.current = false;
    if (!dirty.current) return;
    dirty.current = false;
    setSave("saving");
    try {
      const result = await saveAnswersAction(badge.id, task.id, answersRef.current, maxStep.current);
      setSave(result.ok ? "saved" : "error");
    } catch {
      dirty.current = true;
      setSave("error");
    }
  }, [badge.id, task.id, preview]);

  useEffect(() => () => void flush(), [flush]);

  // Keep an eye out for a leader's decision while we wait.
  useEffect(() => {
    if (status !== "submitted" && !record?.helpRequestedAt) return;
    const id = window.setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [status, record?.helpRequestedAt, router]);

  const update = (fieldId: string, value: AnswerValue) => {
    if (locked) return;
    const next = { ...answersRef.current, [fieldId]: value };
    answersRef.current = next;
    setAnswers(next);
    dirty.current = true;
    setSave("idle");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 800);
  };

  const go = (to: number) => {
    const target = Math.max(0, Math.min(finishIndex, to));
    if (target > maxStep.current && !locked) {
      maxStep.current = target;
      dirty.current = true;
    }
    void flush();
    setStep(target);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const uploadsFor = (fieldId: string) => uploads.filter((u) => u.fieldId === fieldId);
  const setUploadsFor = (fieldId: string, files: RecordedUpload[]) =>
    setUploads((all) => [...all.filter((u) => u.fieldId !== fieldId), ...files.map((f) => ({ ...f, fieldId }))]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of uploads) c[u.fieldId] = (c[u.fieldId] ?? 0) + 1;
    if (uploadMode === "none") for (const f of task.steps.flatMap((s) => s.fields ?? [])) if (f.kind === "upload") c[f.id] = 1;
    return c;
  }, [uploads, uploadMode, task.steps]);

  const missing = useMemo(() => missingFields(task, answers, counts), [task, answers, counts]);

  const stepDone = (s: StepDef) => {
    const fields = s.fields ?? [];
    if (!fields.some((f) => f.required)) return false;
    return fields.every((f) => !fieldNeeded(s, f, answers) || fieldComplete(f, answers[f.id], counts[f.id] ?? 0));
  };

  // When a walkthrough asks for part of a task, go to a step that has it.
  useEffect(() => {
    const onTarget = (e: Event) => {
      const target = (e as CustomEvent<string>).detail;
      const has: Record<string, (s: StepDef) => boolean> = {
        "step-content": () => true,
        "next-step": () => true,
        "step-nav": () => true,
        "step-todo": (s) => Boolean(s.todo?.length),
        "step-answers": (s) => Boolean(s.fields?.length),
        "upload-box": (s) => Boolean(s.fields?.some((f) => f.kind === "upload")),
      };
      const test = has[target];
      if (!test) return;
      setStep((currentStep) => {
        const here = task.steps[currentStep];
        if (here && test(here)) return currentStep;
        const found = task.steps.findIndex(test);
        return found === -1 ? currentStep : found;
      });
    };
    window.addEventListener("joti-tour-target", onTarget);
    return () => window.removeEventListener("joti-tour-target", onTarget);
  }, [task.steps]);

  const current = task.steps[step];
  // Answer boxes the pretend inbox / phone fills in (and proof uploads) are only
  // shown if they sent a real message instead, or the AI leader isn't on.
  const simFields = current ? simFieldIds(current) : [];
  const hidesFields = (i: number) => simOn && !manual[i];
  const machine = current?.morseMachine;
  const usingMachine = Boolean(machine && machineApplies(machine, answers) && !manual[step]);
  // The Morse machine's box is only ever filled in by the machine; the boxes for
  // sending it to a real person only show if they did that instead.
  const hidden = [
    ...(hidesFields(step) ? simFields : []),
    ...(machine ? [machine.fills, ...(usingMachine ? (machine.manualOnly ?? []) : [])] : []),
  ];
  const shownStep = current
    ? {
        ...current,
        fields: current.fields?.filter((f) => !hidden.includes(f.id)),
        ...(usingMachine ? { withLeader: false, tools: undefined } : {}),
      }
    : null;
  // On the finish screen, boxes hidden behind the pretend inbox / phone / Morse machine become one "send it" item.
  const shownMissing = missing.flatMap((m, i): Missing[] => {
    const s = task.steps[m.stepIndex];
    if (s?.morseMachine?.fills === m.fieldId) return [{ ...m, label: "Send your message on the Morse machine" }];
    if (!s?.simulate || !hidesFields(m.stepIndex) || !simFieldIds(s).includes(m.fieldId)) return [m];
    const first = missing.findIndex((o) => o.stepIndex === m.stepIndex && simFieldIds(s).includes(o.fieldId));
    return first === i ? [{ ...m, label: SIM_TODO[s.simulate.kind] }] : [];
  });
  useHelperContext({
    badgeId: badge.id,
    taskId: task.id,
    step,
    label: current ? `${task.title} · step ${step + 1}` : `${task.title} · finishing`,
  });

  return (
    <div ref={top} className="scroll-mt-24 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`${basePath}/${badge.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-600">
          <ArrowLeft className="size-4" /> {badge.name}
        </Link>
        {preview ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">Preview: nothing is saved</span>
        ) : (
          <span data-tour="save-indicator">
            <SaveIndicator state={save} locked={locked} />
          </span>
        )}
      </div>

      <header className="flex flex-wrap items-start gap-4" data-tour="task-header">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-3xl shadow-card ring-1 ring-line sm:size-16 sm:text-4xl">
          {task.emoji}
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{task.title}</h1>
          <p className="mt-0.5 text-muted">{task.summary}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-muted">
            {task.minutes && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" /> About {task.minutes} minutes
              </span>
            )}
            {task.review === "leader" ? (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Users className="size-4" /> A leader checks this one
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-teal-brand">
                <ShieldCheck className="size-4" /> You tick this one off yourself
              </span>
            )}
          </div>
        </div>
        <div className="w-full sm:w-auto" data-tour="help-button">
          {!preview && <HelpButton badgeId={badge.id} taskId={task.id} requested={Boolean(record?.helpRequestedAt)} />}
        </div>
      </header>

      <StatusBanner status={status} record={record} review={task.review} />
      {task.note && step === 0 && <Callout tone="info">{task.note}</Callout>}

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <StepNav steps={task.steps} step={step} go={go} stepDone={stepDone} finishLabel={task.review === "leader" ? "Send to a leader" : "Finish"} finished={locked} />

        <div className="min-w-0 space-y-4">
          {current && shownStep ? (
            <section key={step} className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-line sm:p-7" data-tour="step-content">
              <StepView
                step={shownStep}
                index={step}
                total={task.steps.length}
                storageKey={`joti:${scout.id}:${badge.id}:${task.id}`}
                onZoom={setZoom}
                extra={
                  current.explain && task.review === "leader" ? (
                    <ExplainChat
                      badgeId={badge.id}
                      taskId={task.id}
                      step={step}
                      topic={current.explain.topic}
                      locked={locked}
                      preview={preview}
                    />
                  ) : current.simulate ? (
                    <div className="space-y-2">
                    <MessageSim
                      def={current.simulate}
                      badgeId={badge.id}
                      taskId={task.id}
                      step={step}
                      answers={answers}
                      onFill={(values) => {
                        for (const [id, value] of Object.entries(values)) update(id, value);
                      }}
                      firstName={scout.firstName}
                      locked={locked}
                      preview={preview}
                      uploadConfig={uploadConfig}
                      onUploaded={(fieldId, upload) => setUploadsFor(fieldId, [...uploadsFor(fieldId), upload])}
                      onAvailable={setSimOn}
                    />
                    {simFields.length > 0 && simOn && !locked && (
                      <button
                        type="button"
                        onClick={() => setManual((m) => ({ ...m, [step]: !m[step] }))}
                        className="text-sm font-bold text-brand-700 hover:underline"
                      >
                        {manual[step]
                          ? "Hide this: I'm using the pretend one"
                          : current.simulate.kind === "video"
                            ? "Recorded it on a real phone instead? Fill it in here"
                            : "Sent a real one instead? Type what it said"}
                      </button>
                    )}
                    </div>
                  ) : machine && machineApplies(machine, answers) ? (
                    <div className="space-y-2">
                      {usingMachine && (
                        <MorseMachine
                          def={machine}
                          planned={machine.message === "first-name" ? scout.firstName : asText(answers[machine.message.field])}
                          plannedStep={plannedStepOf(task, machine.message)}
                          go={go}
                          value={asText(answers[machine.fills])}
                          onFill={(summary) => update(machine.fills, summary)}
                          locked={locked}
                        />
                      )}
                      {Boolean(machine.manualOnly?.length) && !locked && (
                        <button
                          type="button"
                          onClick={() => setManual((m) => ({ ...m, [step]: !m[step] }))}
                          className="text-sm font-bold text-brand-700 hover:underline"
                        >
                          {manual[step] ? "Use the Morse machine instead" : "Sent it to a real person instead? Fill it in here"}
                        </button>
                      )}
                    </div>
                  ) : null
                }
                renderField={(field) => (
                  <Field
                    key={field.id}
                    field={field}
                    value={answers[field.id]}
                    onChange={(v) => update(field.id, v)}
                    disabled={locked}
                    firstName={scout.firstName}
                    uploads={uploadsFor(field.id)}
                    onUploads={(files) => setUploadsFor(field.id, files)}
                    uploadConfig={uploadConfig}
                  />
                )}
              />
            </section>
          ) : (
            <FinishView
              key="finish"
              status={status}
              review={task.review}
              missing={shownMissing}
              go={go}
              badgeId={badge.id}
              taskId={task.id}
              nextTask={nextTask}
              answers={answers}
              onDone={() => setCelebrate(true)}
              flush={flush}
              onReopen={() => setStep(0)}
              preview={preview}
              basePath={basePath}
            />
          )}

          {current && (
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className={buttonClass("secondary", "lg")}>
                <ArrowLeft className="size-5" /> Back
              </button>
              <button type="button" onClick={() => go(step + 1)} className={buttonClass("primary", "lg")} data-tour="next-step">
                {step === task.steps.length - 1 ? (locked ? "Summary" : "Check & finish") : "Next step"} <ArrowRight className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {zoom && <Lightbox image={zoom} onClose={() => setZoom(null)} />}
      {celebrate && <Celebration onClose={() => setCelebrate(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function SaveIndicator({ state, locked }: { state: SaveState; locked: boolean }) {
  if (locked) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted" aria-live="polite">
      {state === "saving" && (
        <>
          <LoaderCircle className="size-3.5 animate-spin" /> Saving…
        </>
      )}
      {state === "saved" && (
        <>
          <CloudCheck className="size-3.5 text-emerald-600" /> Saved
        </>
      )}
      {state === "error" && <span className="text-rose-600">Couldn&apos;t save. Check your internet.</span>}
      {state === "idle" && <span className="text-zinc-400">Your answers save automatically</span>}
    </span>
  );
}

function StatusBanner({ status, record, review }: { status: TaskStatus | "todo"; record: WizardRecord | null; review: "self" | "leader" }) {
  if (status === "changes")
    return (
      <Callout tone="warning" title={`${record?.reviewedBy ?? "A leader"} asked for some changes`}>
        {record?.feedback && <p className="mt-1 rounded-lg bg-white/70 p-2.5 font-semibold">“{record.feedback}”</p>}
        <p className="mt-1.5">Make your changes, then send it again from the last step.</p>
      </Callout>
    );
  if (status === "submitted")
    return (
      <Callout tone="tip" title="Waiting for a leader ⏳">
        You&apos;ve sent this to a leader. They&apos;ll check it soon. You can carry on with other tasks while you wait.
      </Callout>
    );
  if (status === "done")
    return (
      <Callout tone="success" title="Task complete! ✓">
        {review === "leader" && record?.reviewedBy ? `${record.reviewedBy} approved this.` : "You've finished this one."}
        {record?.feedback && <p className="mt-1 italic">“{record.feedback}”</p>}
      </Callout>
    );
  return null;
}

function StepNav({
  steps,
  step,
  go,
  stepDone,
  finishLabel,
  finished,
}: {
  steps: StepDef[];
  step: number;
  go: (i: number) => void;
  stepDone: (s: StepDef) => boolean;
  finishLabel: string;
  finished: boolean;
}) {
  const items = [...steps.map((s) => s.title), finishLabel];
  return (
    <>
      {/* phones: a segmented progress bar */}
      <div className="lg:hidden" data-tour="step-nav">
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span className="text-brand-700">{step < steps.length ? `Step ${step + 1} of ${steps.length}` : "Last step"}</span>
          <span className="truncate pl-3 text-muted">{items[step]}</span>
        </div>
        <div className="flex gap-1">
          {items.map((title, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to ${title}`}
              data-tour={i === steps.length ? "finish-step" : undefined}
              className={cn(
                "h-2.5 flex-1 rounded-full transition",
                i === step ? "bg-brand-500" : i < step || (i < steps.length && stepDone(steps[i])) ? "bg-brand-300" : "bg-zinc-200",
              )}
            />
          ))}
        </div>
      </div>

      {/* larger screens: a list of steps down the side */}
      <nav className="hidden lg:block" data-tour="step-nav">
        <ol className="sticky top-24 space-y-1">
          {items.map((title, i) => {
            const isFinish = i === steps.length;
            const done = isFinish ? finished : stepDone(steps[i]);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  data-tour={isFinish ? "finish-step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition",
                    i === step ? "bg-white text-ink shadow-card ring-1 ring-line" : "text-muted hover:bg-white/60 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-black",
                      done ? "bg-emerald-500 text-white" : i === step ? "bg-brand-500 text-white" : "bg-zinc-200 text-zinc-600",
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : isFinish ? <Send className="size-3.5" /> : i + 1}
                  </span>
                  <span className="leading-snug">{title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

function StepView({
  step,
  index,
  total,
  storageKey,
  onZoom,
  renderField,
  extra,
}: {
  step: StepDef;
  index: number;
  total: number;
  storageKey: string;
  onZoom: (img: StepImage) => void;
  renderField: (field: NonNullable<StepDef["fields"]>[number]) => React.ReactNode;
  /** shown after the instructions, before the answers (e.g. the explain chat) */
  extra?: React.ReactNode;
}) {
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [peek, setPeek] = useState(false);
  const key = `${storageKey}:${index}`;

  // Ticks live in this browser only; load them after hydration so server and client HTML match.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTicks(JSON.parse(localStorage.getItem(key) ?? "{}"));
    } catch {}
  }, [key]);

  const tick = (i: number) => {
    const next = { ...ticks, [i]: !ticks[i] };
    setTicks(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-brand-500">
            Step {index + 1} of {total}
          </span>
          {step.withLeader && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              <Users className="size-3.5" /> Do this with a leader
            </span>
          )}
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight">{step.title}</h2>
      </div>

      {step.body?.map((p, i) => (
        <p key={i} className="text-[16px] leading-relaxed text-zinc-700">
          <RichText text={p} />
        </p>
      ))}

      {step.todo && (
        <ol className="space-y-2" data-tour="step-todo">
          {step.todo.map((item, i) => (
            <li key={i}>
              {/* A div rather than a button, so the text can hold links (which mustn't tick the row). */}
              <div
                role="checkbox"
                aria-checked={Boolean(ticks[i])}
                tabIndex={0}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest("a")) tick(i);
                }}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    tick(i);
                  }
                }}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-xl p-3 text-left transition focus-visible:outline-2 focus-visible:outline-brand-500",
                  ticks[i] ? "bg-emerald-50" : "bg-zinc-50 hover:bg-brand-50/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-black transition",
                    ticks[i] ? "bg-emerald-500 text-white" : "bg-white text-brand-700 ring-2 ring-brand-200",
                  )}
                >
                  {ticks[i] ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("pt-0.5 text-[15px] leading-relaxed", ticks[i] && "text-zinc-500")}>
                  <RichText text={item} />
                </span>
              </div>
            </li>
          ))}
          <li className="pl-1 text-xs font-semibold text-muted">Tap each one when you&apos;ve done it.</li>
        </ol>
      )}

      {step.bullets && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {step.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-xl bg-brand-50/60 px-3 py-2.5 text-[15px]">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400" />
              <RichText text={b} />
            </li>
          ))}
        </ul>
      )}

      {step.images && <ImageGrid images={step.images} onZoom={onZoom} />}

      {step.spoiler && (
        <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-line">
          {peek ? (
            <ImageGrid images={step.spoiler} onZoom={onZoom} />
          ) : (
            <button type="button" onClick={() => setPeek(true)} className={buttonClass("secondary", "sm")}>
              <Eye className="size-4" /> Stuck? Peek at the answer
            </button>
          )}
        </div>
      )}

      {step.tip && (
        <Callout tone="tip" title="Tip">
          <RichText text={step.tip} />
        </Callout>
      )}
      {step.warning && (
        <Callout tone="warning" title="Stay safe">
          <RichText text={step.warning} />
        </Callout>
      )}

      {step.links && step.links.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {step.links.map((link) => {
            const pdf = link.url.endsWith(".pdf");
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-brand-200 transition hover:bg-brand-50 hover:ring-brand-400"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-500 text-white">
                  {pdf ? <FileText className="size-5" /> : <ExternalLink className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold leading-snug text-brand-800">{link.label}</span>
                  {link.note && <span className="block text-xs text-muted">{link.note}</span>}
                </span>
                <ArrowRight className="size-4 shrink-0 text-brand-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </a>
            );
          })}
        </div>
      )}

      {step.tools?.map((t) => (
        <Tool key={t} id={t} />
      ))}

      {step.stuck && (
        <details className="group rounded-2xl bg-amber-50/60 ring-1 ring-amber-200">
          <summary className="cursor-pointer list-none px-4 py-3 font-bold text-amber-900">
            😕 Stuck? Common problems and fixes <span className="text-amber-500 group-open:hidden">▸</span>
          </summary>
          <dl className="space-y-2 px-4 pb-4">
            {step.stuck.map((s) => (
              <div key={s.problem} className="rounded-xl bg-white p-3 text-[15px] ring-1 ring-amber-100">
                <dt className="font-bold">{s.problem}</dt>
                <dd className="text-muted">{s.fix}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {extra}

      {step.fields && step.fields.length > 0 && (
        <div className="space-y-5 rounded-2xl bg-canvas p-4 ring-1 ring-line sm:p-5" data-tour="step-answers">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-brand-600">
            <Pencil className="size-4" /> Your answers
          </div>
          {step.fields.map(renderField)}
        </div>
      )}
    </div>
  );
}

function ImageGrid({ images, onZoom }: { images: StepImage[]; onZoom: (img: StepImage) => void }) {
  return (
    <div className={cn("grid gap-3", images.length > 1 && "sm:grid-cols-2")}>
      {images.map((img) => (
        <figure key={img.src} className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          <button type="button" onClick={() => onZoom(img)} className="block w-full cursor-zoom-in bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} className="mx-auto max-h-80 w-auto object-contain" loading="lazy" />
          </button>
          {img.caption && <figcaption className="border-t border-line px-3 py-2 text-xs font-semibold text-muted">{img.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

function Lightbox({ image, onClose }: { image: StepImage; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-label={image.alt}>
      <button type="button" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90" aria-label="Close">
        <X className="size-5" />
      </button>
      <figure className="max-h-full max-w-5xl overflow-auto rounded-2xl bg-white p-2" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} className="max-h-[80vh] w-auto" />
        {image.caption && <figcaption className="px-2 py-2 text-sm text-muted">{image.caption}</figcaption>}
      </figure>
    </div>
  );
}

function HelpButton({ badgeId, taskId, requested }: { badgeId: string; taskId: string; requested: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  if (requested) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">
        <Hand className="size-4" /> A leader knows you need help
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => cancelHelpAction(badgeId, taskId))}
          className="ml-1 rounded-lg bg-white/80 px-2 py-1 text-xs hover:bg-white"
        >
          I&apos;m OK now
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
        <Hand className="size-4 text-amber-500" /> Ask for help
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-20 mt-2 animate-fade-up rounded-2xl bg-white p-4 shadow-lift ring-1 ring-line sm:left-auto sm:w-72">
          <p className="font-bold">Need a hand?</p>
          <p className="mt-0.5 text-sm text-muted">A leader will see this and come and help.</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="What are you stuck on? (optional)"
            className="mt-3 block w-full rounded-xl px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await requestHelpAction(badgeId, taskId, message);
                setOpen(false);
              })
            }
            className={buttonClass("primary", "md", "mt-3 w-full")}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Hand className="size-4" />} Call a leader
          </button>
        </div>
      )}
    </div>
  );
}

const SIM_TODO: Record<NonNullable<StepDef["simulate"]>["kind"], string> = {
  email: "Send your email in PG Mail",
  sms: "Send your text on the pretend phone",
  either: "Send your message to the AI leader",
  video: "Send your video message",
};

/** Where they write the message the Morse machine shows (null for their name). */
function plannedStepOf(task: TaskDef, message: NonNullable<StepDef["morseMachine"]>["message"]) {
  if (message === "first-name") return null;
  const i = task.steps.findIndex((s) => s.fields?.some((f) => f.id === message.field));
  return i === -1 ? null : i;
}

/** Answer boxes on a step that the pretend inbox / phone fills in, plus proof only needed for a real one. */
function simFieldIds(s: StepDef) {
  const sim = s.simulate;
  if (!sim) return [];
  return [sim.fills?.subject, sim.fills?.body, sim.fills?.how?.field, ...(sim.manualOnly ?? [])].filter(
    (id): id is string => Boolean(id) && Boolean(s.fields?.some((f) => f.id === id)),
  );
}

function FinishView({
  status,
  review,
  missing,
  go,
  badgeId,
  taskId,
  nextTask,
  answers,
  onDone,
  flush,
  onReopen,
  preview,
  basePath,
}: {
  status: TaskStatus | "todo";
  review: "self" | "leader";
  missing: Missing[];
  go: (i: number) => void;
  badgeId: string;
  taskId: string;
  nextTask: WizardProps["nextTask"];
  answers: Answers;
  onDone: () => void;
  flush: () => Promise<void>;
  onReopen: () => void;
  preview: boolean;
  basePath: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewNote, setPreviewNote] = useState(false);

  const next = nextTask && (
    <Link href={`${basePath}/${badgeId}/${nextTask.id}`} className={buttonClass("primary", "lg")}>
      Next: {nextTask.emoji} {nextTask.title} <ArrowRight className="size-5" />
    </Link>
  );
  const back = (
    <Link href={`${basePath}/${badgeId}`} className={buttonClass("secondary", "lg")}>
      Back to the badge
    </Link>
  );

  if (status === "done" || status === "submitted") {
    const waiting = status === "submitted";
    return (
      <section className="animate-fade-up rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-line sm:p-10">
        <div className="text-6xl">{waiting ? "📨" : "🎉"}</div>
        <h2 className="mt-3 text-2xl font-black">{waiting ? "Sent to a leader!" : "You've finished this task!"}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          {waiting
            ? "A leader will look at your work soon. This page updates by itself when they do."
            : "Brilliant work. It's been added to your badge."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {next}
          {back}
        </div>
        {(waiting || review === "self") && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await reopenTaskAction(badgeId, taskId);
                onReopen();
              })
            }
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-600"
          >
            <Pencil className="size-4" /> {waiting ? "Take it back to change something" : "Change my answers"}
          </button>
        )}
      </section>
    );
  }

  const submit = () =>
    preview
      ? setPreviewNote(true)
      : start(async () => {
      setError(null);
      await flush();
      const result = await submitTaskAction(badgeId, taskId, answers);
      if (result.ok) onDone();
      else setError(result.error ?? (result.missing?.length ? "There are still a few things to fill in." : "Something went wrong."));
    });

  return (
    <section className="animate-fade-up rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
      <span className="text-xs font-black uppercase tracking-widest text-brand-500">Last step</span>
      <h2 className="mt-1 text-2xl font-black">Check &amp; {review === "leader" ? "send" : "finish"}</h2>

      {missing.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-muted">Nearly there! You still need to fill in:</p>
          <ul className="space-y-2">
            {missing.map((m, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => go(m.stepIndex)}
                  className="flex w-full items-center gap-3 rounded-xl bg-amber-50 px-3.5 py-3 text-left ring-1 ring-amber-200 transition hover:bg-amber-100"
                >
                  <MessageSquare className="size-5 shrink-0 text-amber-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{m.label}</span>
                    <span className="text-xs text-muted">
                      Step {m.stepIndex + 1}: {m.stepTitle}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-amber-500" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <CircleCheck className="mt-0.5 size-6 shrink-0 text-emerald-600" />
          <p className="text-emerald-900">
            <b>Everything&apos;s filled in.</b>{" "}
            {review === "leader"
              ? "Send it to a leader so they can check it. If you did part of it with a leader, tell them it's on its way!"
              : "Tap the button to finish this task."}
          </p>
        </div>
      )}

      {status === "changes" && (
        <p className="mt-4 text-sm font-semibold text-rose-700">Made the changes your leader asked for? Send it again below.</p>
      )}
      {error && <Callout tone="error" className="mt-4">{error}</Callout>}
      {previewNote && (
        <Callout tone="info" className="mt-4" title="Preview">
          {review === "leader"
            ? "Here a young person's task is sent to the Review queue for a leader to check."
            : "Here the task is marked as done and counts towards their badge."}
        </Callout>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={submit} disabled={pending || (!preview && missing.length > 0)} className={buttonClass(review === "leader" ? "primary" : "success", "lg")}>
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : review === "leader" ? (
            <>
              <Send className="size-5" /> Send to a leader
            </>
          ) : (
            <>
              <PartyPopper className="size-5" /> I&apos;ve finished!
            </>
          )}
        </button>
        <button type="button" onClick={() => go(0)} className={buttonClass("ghost", "lg")}>
          Go back to the start
        </button>
      </div>
    </section>
  );
}

const CONFETTI = ["🎉", "⭐", "🎊", "✨", "🏅", "💜", "⚜️", "🌟"];

function Celebration({ onClose }: { onClose: () => void }) {
  const [pieces] = useState(() =>
    Array.from({ length: 36 }, (_, i) => ({
      emoji: CONFETTI[i % CONFETTI.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.4,
      size: 18 + Math.random() * 22,
    })),
  );
  useEffect(() => {
    const id = window.setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      <style>{`@keyframes joti-fall { from { transform: translateY(-10vh) rotate(0deg); opacity: 1 } to { transform: translateY(110vh) rotate(540deg); opacity: 0.8 } }`}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            animation: `joti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
