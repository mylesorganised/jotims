"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BatteryFull,
  CheckCircle2,
  ChevronLeft,
  Inbox,
  LoaderCircle,
  Mail,
  MessageCircle,
  PenSquare,
  Reply,
  Search,
  Send,
  SendHorizontal,
  Signal,
  Timer,
  Wifi,
  X,
} from "lucide-react";
import type { SimulateDef } from "@/content/types";
import type { AnswerValue, Answers } from "@/lib/db/schema";
import { cn } from "./ui";

type Kind = "email" | "sms";
type Message = { role: "ai" | "scout"; text: string; subject?: string; at: string };
type Sim = { kind: Kind; status: "chatting" | "passed" | "referred"; messages: Message[] };

const AKELA = { name: "Akela (AI leader)", email: "akela@pgscouts.mail" };

function clock(at: string) {
  return new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/**
 * A pretend email inbox or phone where young people send a message to Akela,
 * the AI leader, who writes back. When the message does what the task asks,
 * the answers fill themselves in and the AI leader ticks the task off.
 */
export function MessageSim({
  def,
  badgeId,
  taskId,
  step,
  answers,
  onFill,
  firstName,
  locked,
  preview,
}: {
  def: SimulateDef;
  badgeId: string;
  taskId: string;
  step: number;
  answers: Answers;
  onFill: (values: Record<string, AnswerValue>) => void;
  firstName: string;
  locked: boolean;
  preview?: boolean;
}) {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(preview ? true : null);
  const [sim, setSim] = useState<Sim | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const chosenFromAnswers: Kind | null = useMemo(() => {
    if (def.kind !== "either" || !def.fills?.how) return null;
    const how = answers[def.fills.how.field];
    return how === def.fills.how.sms ? "sms" : how === def.fills.how.email ? "email" : null;
  }, [answers, def]);
  const [picked, setPicked] = useState<Kind | null>(def.kind === "either" ? chosenFromAnswers : def.kind);
  const kind: Kind | null = sim?.kind ?? picked;

  useEffect(() => {
    if (preview) return;
    let stop = false;
    fetch(`/api/sim?badgeId=${encodeURIComponent(badgeId)}&taskId=${encodeURIComponent(taskId)}&step=${step}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data: { available: boolean; sim: Sim | null } | null) => {
        if (stop || !data) return;
        setAvailable(data.available);
        setSim(data.sim);
        // Only one kind (email or phone)? Open it straight away.
        if (data.available && !data.sim && def.kind !== "either" && !locked) {
          const res = await fetch("/api/sim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ badgeId, taskId, step, action: "start", kind: def.kind }),
          });
          const started = (await res.json().catch(() => ({}))) as { sim?: Sim };
          if (!stop && started.sim) setSim(started.sim);
        }
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [badgeId, taskId, step, preview, def.kind, locked]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeId, taskId, step, ...body }),
      });
      const data = (await res.json().catch(() => ({}))) as { sim?: Sim; error?: string; filled?: Record<string, AnswerValue>; finishing?: boolean };
      if (data.sim) setSim(data.sim);
      if (data.filled && Object.keys(data.filled).length) onFill(data.filled);
      if (data.finishing) {
        setFinishing(true);
        router.refresh();
      }
      if (!res.ok) setError(data.error ?? "Something went wrong. Try again?");
      return res.ok;
    } catch {
      setError("Couldn't reach Akela. Check the internet and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function open(k: Kind) {
    setPicked(k);
    if (preview) return;
    if (!sim || (sim.kind !== k && sim.status !== "passed")) await post({ action: "start", kind: k });
  }

  async function send(message: { subject?: string; text: string; typingMs?: number }) {
    if (preview) return false;
    // Show it straight away while Akela thinks.
    setSim((s) => (s ? { ...s, messages: [...s.messages, { role: "scout", ...message, at: new Date().toISOString() }] } : s));
    return post(message);
  }

  if (available === false) return null;
  if (locked && !sim) return null;

  const prefill = {
    subject: def.fills?.subject ? String(answers[def.fills.subject] ?? "") : "",
    body: def.fills?.body && !def.speedTest ? String(answers[def.fills.body] ?? "") : "",
  };
  const planned = def.speedTest ? Object.values(answers).find((v): v is string => typeof v === "string" && v.split(/\s+/).length >= 5) : undefined;

  return (
    <div className="space-y-3" data-tour="message-sim">
      {def.kind === "either" && !sim && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-line">
          <span className="px-1 font-bold">Send it as:</span>
          {(
            [
              ["email", "📧 An email"],
              ["sms", "💬 A text message"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => open(k)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-bold ring-1 transition",
                kind === k ? "bg-brand-500 text-white ring-brand-500" : "bg-white ring-line hover:bg-brand-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {kind === "email" && (
        <EmailApp sim={sim} busy={busy} firstName={firstName} def={def} prefill={prefill} onSend={send} disabled={locked || preview} />
      )}
      {kind === "sms" && (
        <PhoneApp sim={sim} busy={busy} def={def} prefill={prefill.body} planned={planned} onSend={send} disabled={locked || preview} />
      )}

      {sim?.status === "passed" && (
        <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {finishing
            ? "Akela got it! ✅ The AI leader is ticking off your task now. Watch for a message at the top."
            : "Akela got it! ✅ This part is done. Your answers have been filled in for you."}
        </p>
      )}
      {preview && <p className="text-xs text-muted">Preview: young people send their message to the AI leader here.</p>}
      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-800 ring-1 ring-rose-200">{error}</p>}
    </div>
  );
}

// ------------------------------------------------------------------ email

function EmailApp({
  sim,
  busy,
  firstName,
  def,
  prefill,
  onSend,
  disabled,
}: {
  sim: Sim | null;
  busy: boolean;
  firstName: string;
  def: SimulateDef;
  prefill: { subject: string; body: string };
  onSend: (m: { subject?: string; text: string }) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox");
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState(prefill.subject);
  const [body, setBody] = useState(prefill.body);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const messages = sim?.messages ?? [];
  const inbox = messages.filter((m) => m.role === "ai").reverse();
  const sent = messages.filter((m) => m.role === "scout").reverse();
  const list = folder === "inbox" ? inbox : sent;
  const opened = messages.find((m) => m.at === openAt) ?? null;
  const unread = inbox.filter((m) => !seen.has(m.at)).length;

  const openMessage = (at: string) => {
    setOpenAt(at);
    setSeen((s) => (s.has(at) ? s : new Set(s).add(at)));
  };

  // A new reply from Akela opens by itself.
  const [shownReply, setShownReply] = useState<string | null>(null);
  const last = messages[messages.length - 1];
  if (last?.role === "ai" && messages.some((m) => m.role === "scout") && last.at !== shownReply) {
    setShownReply(last.at);
    setFolder("inbox");
    openMessage(last.at);
  }

  async function send() {
    if (!body.trim()) return;
    setComposing(false);
    setFolder("sent");
    const ok = await onSend({ subject, text: body });
    if (ok) {
      setSubject("");
      setBody("");
    } else setComposing(true);
  }

  function reply(m: Message) {
    setSubject(m.subject?.startsWith("Re:") ? m.subject.replace(/^Re:\s*/, "") : (m.subject ?? ""));
    setBody(`Hi Akela,\n\n\n\n${firstName}`);
    setComposing(true);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-line shadow-card">
      <div className="flex items-center gap-3 border-b border-line bg-gradient-to-r from-sky-600 to-sky-700 px-3 py-2 text-white">
        <Mail className="size-5" />
        <span className="font-extrabold">PG Mail</span>
        <span className="hidden flex-1 items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white/70 sm:flex">
          <Search className="size-4" /> Search mail
        </span>
        <span className="ml-auto grid size-8 place-items-center rounded-full bg-white/20 text-sm font-black sm:ml-0">{firstName[0]}</span>
      </div>

      <div className="flex min-h-[30rem]">
        <nav className="w-36 shrink-0 space-y-1 border-r border-line bg-sky-50/40 p-2 text-sm sm:w-44">
          <button
            type="button"
            onClick={() => setComposing(true)}
            disabled={disabled || busy || sim?.status === "passed"}
            className="mb-2 flex w-full items-center gap-2 rounded-2xl bg-sky-600 px-3 py-2.5 font-extrabold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            <PenSquare className="size-4" /> Compose
          </button>
          {(
            [
              ["inbox", "Inbox", Inbox, unread],
              ["sent", "Sent", Send, 0],
            ] as const
          ).map(([id, label, Icon, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setFolder(id);
                setOpenAt(null);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold",
                folder === id ? "bg-sky-100 text-sky-900" : "text-zinc-600 hover:bg-sky-50",
              )}
            >
              <Icon className="size-4" /> {label}
              {count > 0 && <span className="ml-auto text-xs font-black">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {opened ? (
            <article className="p-4">
              <button type="button" onClick={() => setOpenAt(null)} className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-sky-700 hover:underline">
                <ChevronLeft className="size-4" /> Back
              </button>
              <h3 className="text-lg font-extrabold">{opened.subject || "(no subject)"}</h3>
              <p className="mt-1 text-sm text-muted">
                {opened.role === "ai" ? (
                  <>
                    From <b className="text-ink">{AKELA.name}</b> &lt;{AKELA.email}&gt; · to you
                  </>
                ) : (
                  <>
                    From you · to <b className="text-ink">{AKELA.name}</b> &lt;{AKELA.email}&gt;
                  </>
                )}{" "}
                · {clock(opened.at)}
              </p>
              <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{opened.text}</div>
              {opened.role === "ai" && sim?.status !== "passed" && !disabled && messages.length > 1 && (
                <button
                  type="button"
                  onClick={() => reply(opened)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
                >
                  <Reply className="size-4" /> Reply
                </button>
              )}
            </article>
          ) : (
            <ul className="divide-y divide-line">
              {list.length === 0 && (
                <li className="p-6 text-center text-sm text-muted">{folder === "sent" ? "Nothing sent yet." : "No emails yet."}</li>
              )}
              {list.map((m) => {
                const isUnread = m.role === "ai" && !seen.has(m.at);
                return (
                  <li key={m.at}>
                    <button type="button" onClick={() => openMessage(m.at)} className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-sky-50/60">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-100 text-sm font-black text-sky-700">
                        {m.role === "ai" ? "A" : firstName[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("flex justify-between gap-2 text-sm", isUnread ? "font-black" : "font-semibold")}>
                          <span className="truncate">{m.role === "ai" ? AKELA.name : `To: ${AKELA.name}`}</span>
                          <span className="shrink-0 text-xs font-normal text-muted">{clock(m.at)}</span>
                        </span>
                        <span className={cn("block truncate text-sm", isUnread ? "font-bold" : "")}>{m.subject || "(no subject)"}</span>
                        <span className="block truncate text-xs text-muted">{m.text.replace(/\s+/g, " ")}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {busy && (
                <li className="flex items-center gap-2 px-3 py-3 text-sm text-muted">
                  <LoaderCircle className="size-4 animate-spin" /> Sending… Akela is reading your email
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {composing && (
        <div className="absolute inset-0 z-10 flex flex-col overflow-y-auto bg-white sm:inset-auto sm:bottom-3 sm:right-3 sm:top-3 sm:w-[26rem] sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-line">
          <div className="flex items-center justify-between rounded-t-2xl bg-zinc-800 px-3 py-2 text-sm font-bold text-white">
            New message
            <button type="button" onClick={() => setComposing(false)} aria-label="Close" className="grid size-7 place-items-center rounded hover:bg-white/15">
              <X className="size-4" />
            </button>
          </div>
          <div className="border-b border-line px-3 py-2 text-sm">
            <span className="text-muted">To </span>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-800">{AKELA.name}</span>
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            maxLength={150}
            className="border-b border-line px-3 py-2 text-[15px] focus:outline-none"
            aria-label="Subject"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Hi Akela,\n\n…\n\n${firstName}`}
            maxLength={1500}
            className="min-h-28 flex-1 resize-none px-3 py-2 text-[15px] focus:outline-none"
            aria-label="Message"
          />
          <div className="border-t border-line bg-sky-50/50 px-3 py-2 text-xs text-sky-900">
            <p className="font-bold">A good email:</p>
            <ul className="mt-0.5 list-disc pl-4">
              {def.points.map((p) => (
                <li key={p}>{p.replace(/^Has a /, "a ").replace(/^Starts with /, "starts with ").replace(/^Ends with /, "ends with ")}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={send}
              disabled={!body.trim() || busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-5 py-2 font-extrabold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              Send <Send className="size-4" />
            </button>
            <span className="text-xs text-muted">Pretend email: it only goes to Akela, the AI leader.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ phone

function PhoneApp({
  sim,
  busy,
  def,
  prefill,
  planned,
  onSend,
  disabled,
}: {
  sim: Sim | null;
  busy: boolean;
  def: SimulateDef;
  prefill: string;
  planned?: string;
  onSend: (m: { text: string; typingMs?: number }) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(prefill);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [pasteNote, setPasteNote] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const speed = def.speedTest;
  const words = draft.trim().split(/\s+/).filter(Boolean).length;
  const seconds = startedAt && now ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [sim?.messages.length, busy]);

  useEffect(() => {
    if (!speed || !startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [speed, startedAt]);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    const typingMs = startedAt ? Date.now() - startedAt : undefined;
    setDraft("");
    setStartedAt(null);
    setNow(0);
    const ok = await onSend({ text, typingMs });
    if (!ok) setDraft(text);
  }

  const blockPaste = (e: { preventDefault: () => void }) => {
    if (!speed) return;
    e.preventDefault();
    setPasteNote(true);
  };

  const done = sim?.status === "passed";

  return (
    <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-center">
      {speed && planned && !done && (
        <div className="w-full max-w-sm rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 lg:order-2 lg:mt-10">
          <p className="font-bold">Your planned message (type it, don&apos;t copy it):</p>
          <p className="mt-1 whitespace-pre-wrap">{planned}</p>
        </div>
      )}
      <div className="w-[min(20rem,100%)] shrink-0 rounded-[2.6rem] bg-zinc-900 p-2.5 shadow-lift">
        <div className="relative flex h-[34rem] flex-col overflow-hidden rounded-[2.1rem] bg-white">
          <div className="flex items-center justify-between px-6 pb-1 pt-3 text-xs font-bold">
            <span>{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-zinc-900" aria-hidden />
            <span className="flex items-center gap-1">
              <Signal className="size-3.5" /> <Wifi className="size-3.5" /> <BatteryFull className="size-4" />
            </span>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 pb-2 pt-1">
            <ChevronLeft className="size-5 text-sky-500" />
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-black text-white">A</span>
            <span className="leading-tight">
              <span className="block text-sm font-bold">Akela (AI leader)</span>
              <span className="block text-[11px] text-emerald-600">{busy ? "typing…" : "online"}</span>
            </span>
          </div>

          <div ref={list} className="flex-1 space-y-1.5 overflow-y-auto bg-white px-3 py-3">
            {(sim?.messages ?? []).map((m, i) => (
              <div key={i} className={cn("flex", m.role === "scout" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap rounded-3xl px-3.5 py-2 text-[14px] leading-snug",
                    m.role === "scout" ? "rounded-br-md bg-sky-500 text-white" : "rounded-bl-md bg-zinc-100 text-zinc-900",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <span className="flex gap-1 rounded-3xl rounded-bl-md bg-zinc-100 px-3.5 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-zinc-400" />
                  <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:120ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:240ms]" />
                </span>
              </div>
            )}
          </div>

          {speed && !done && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-1 text-[11px] font-bold text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Timer className="size-3.5" /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
              </span>
              <span className={cn(words >= speed.minWords && "text-emerald-600")}>
                {words} / {speed.minWords} words
              </span>
            </div>
          )}
          <div className="flex items-end gap-2 border-t border-zinc-100 px-2 py-2">
            <textarea
              value={draft}
              onChange={(e) => {
                if (speed && !startedAt && e.target.value) {
                  setStartedAt(Date.now());
                  setNow(Date.now());
                }
                setDraft(e.target.value);
              }}
              onPaste={blockPaste}
              onDrop={blockPaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={1500}
              disabled={disabled || busy || done}
              placeholder={done ? "Done ✅" : "Text message"}
              className="max-h-28 min-h-9 flex-1 resize-none rounded-2xl border border-zinc-200 px-3 py-1.5 text-[14px] focus:border-sky-400 focus:outline-none disabled:bg-zinc-50"
              aria-label="Text message"
            />
            <button
              type="button"
              onClick={send}
              disabled={disabled || busy || done || !draft.trim()}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40"
              aria-label="Send text"
            >
              <SendHorizontal className="size-4" />
            </button>
          </div>
          {speed && pasteNote && <p className="px-3 pb-2 text-[11px] font-bold text-amber-700">✋ Pasting is switched off: type it yourself!</p>}
        </div>
      </div>
      {!speed && !done && (
        <p className="max-w-xs text-center text-xs text-muted lg:mt-10 lg:text-left">
          <MessageCircle className="mr-1 inline size-3.5" />
          Pretend phone: your texts only go to Akela, the AI leader.
        </p>
      )}
    </div>
  );
}
