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
  Video,
  Wifi,
  X,
} from "lucide-react";
import type { RecordedUpload } from "@/app/actions/scout";
import type { SimulateDef } from "@/content/types";
import type { AnswerValue, Answers } from "@/lib/db/schema";
import { cn } from "./ui";
import { sendFile, type UploadConfig } from "./uploader";

type Kind = "email" | "sms" | "video";
type Message = { role: "ai" | "scout"; text: string; subject?: string; at: string; uploadId?: string; seconds?: number };
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
  uploadConfig,
  onUploaded,
  onAvailable,
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
  /** how files are uploaded here (for video messages) */
  uploadConfig: UploadConfig;
  /** a video message was uploaded into a field */
  onUploaded: (fieldId: string, upload: RecordedUpload) => void;
  /** tells the page whether the pretend inbox / phone is working here */
  onAvailable?: (available: boolean) => void;
}) {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(preview ? true : null);
  const [sim, setSim] = useState<Sim | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const chosenFromAnswers: "email" | "sms" | null = useMemo(() => {
    if (def.kind !== "either" || !def.fills?.how) return null;
    const how = answers[def.fills.how.field];
    return how === def.fills.how.sms ? "sms" : how === def.fills.how.email ? "email" : null;
  }, [answers, def]);
  const [picked, setPicked] = useState<Kind | null>(def.kind === "either" ? chosenFromAnswers : def.kind);
  const kind: Kind | null = sim?.kind ?? picked;

  const reportAvailable = useRef(onAvailable);
  useEffect(() => {
    reportAvailable.current = onAvailable;
  }, [onAvailable]);

  useEffect(() => {
    if (preview) {
      reportAvailable.current?.(true);
      return;
    }
    let stop = false;
    fetch(`/api/sim?badgeId=${encodeURIComponent(badgeId)}&taskId=${encodeURIComponent(taskId)}&step=${step}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data: { available: boolean; sim: Sim | null } | null) => {
        if (stop || !data) return;
        setAvailable(data.available);
        reportAvailable.current?.(data.available);
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

  async function sendVideo(video: { blob: Blob; seconds: number; caption: string }) {
    if (preview || !def.video) return false;
    setBusy(true);
    setError(null);
    try {
      const type = video.blob.type.split(";")[0] || "video/webm";
      const file = new File([video.blob], `video-message.${type.includes("mp4") ? "mp4" : "webm"}`, { type });
      const uploaded = await sendFile(file, def.video.field, uploadConfig);
      onUploaded(def.video.field, uploaded);
      setSim((s) =>
        s ? { ...s, messages: [...s.messages, { role: "scout", text: video.caption, uploadId: uploaded.id, seconds: video.seconds, at: new Date().toISOString() }] } : s,
      );
      return await post({ action: "video", uploadId: uploaded.id, seconds: video.seconds, text: video.caption });
    } catch (e) {
      setError((e as Error).message || "The video didn't send. Try again?");
      setBusy(false);
      return false;
    }
  }

  async function send(message: { subject?: string; text: string; typingMs?: number }) {
    if (preview) return false;
    // Show it straight away while Akela thinks.
    setSim((s) => (s ? { ...s, messages: [...s.messages, { role: "scout", ...message, at: new Date().toISOString() }] } : s));
    return post(message);
  }

  if (available === false) return null;
  if (locked && !sim) return null;

  // In the leaders' preview there's no conversation, so show Akela's first message.
  const shown: Sim | null =
    sim ??
    (preview && kind
      ? {
          kind,
          status: "chatting",
          messages: [
            kind === "email"
              ? {
                  role: "ai",
                  subject: "Welcome to PG Mail! 👋",
                  text: `Hi ${firstName},\n\nThis is a pretend email inbox for practising. Press "Compose" to write me an email, then press Send. I'll write back!\n\nAkela (AI leader) 🤖`,
                  at: "2026-10-17T09:00:00.000Z",
                }
              : {
                  role: "ai",
                  text:
                    kind === "video"
                      ? `Hi ${firstName}! 👋 It's Akela. Record a short video message for me and press send.`
                      : `Hi ${firstName}! 👋 It's Akela, the AI leader. Send me a text!`,
                  at: "2026-10-17T09:00:00.000Z",
                },
          ],
        }
      : null);

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
        <EmailApp sim={shown} busy={busy} firstName={firstName} def={def} prefill={prefill} onSend={send} disabled={locked || preview} />
      )}
      {kind === "sms" && (
        <PhoneApp sim={shown} busy={busy} def={def} prefill={prefill.body} planned={planned} onSend={send} disabled={locked || preview} />
      )}
      {kind === "video" && (
        <VideoPhone
          sim={shown}
          busy={busy}
          maxSeconds={def.video?.maxSeconds ?? 60}
          onSend={sendVideo}
          disabled={locked || preview || uploadConfig.mode === "none"}
        />
      )}

      {sim?.status === "passed" && (
        <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {kind === "video"
            ? "Akela got your video! 🎬 It's been sent to a leader, who will watch it and tick it off."
            : finishing
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
                          <span className="shrink-0 text-xs font-normal text-muted" suppressHydrationWarning>{clock(m.at)}</span>
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
            <span suppressHydrationWarning>{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
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

// ------------------------------------------------------------ video phone

const RECORD_TYPES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

/**
 * A pretend phone that records a video message with the computer's camera and
 * microphone, lets them watch it back, and sends it to Akela like a video text.
 */
function VideoPhone({
  sim,
  busy,
  maxSeconds,
  onSend,
  disabled,
}: {
  sim: Sim | null;
  busy: boolean;
  maxSeconds: number;
  onSend: (video: { blob: Blob; seconds: number; caption: string }) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<"chat" | "camera" | "recording" | "review">("chat");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const [caption, setCaption] = useState("");
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const live = useRef<HTMLVideoElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const started = useRef(0);
  const done = sim?.status === "passed";

  const stopCamera = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  // Always let go of the camera when leaving the page.
  useEffect(() => () => stopCamera(), []);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [sim?.messages.length, busy]);

  // Count the seconds while recording, and stop at the limit.
  useEffect(() => {
    if (mode !== "recording") return;
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - started.current) / 1000);
      setSeconds(s);
      if (s >= maxSeconds) recorder.current?.stop();
    }, 250);
    return () => clearInterval(t);
  }, [mode, maxSeconds]);

  async function openCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser can't record video. Try Chrome, Edge or Safari, or upload a video below.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      setMode("camera");
      requestAnimationFrame(() => {
        if (live.current && stream.current) {
          live.current.srcObject = stream.current;
          void live.current.play().catch(() => {});
        }
      });
    } catch {
      setError("We couldn't use the camera. Check your browser asked to use it and you pressed Allow, or upload a video below.");
    }
  }

  function record() {
    if (!stream.current) return;
    const mimeType = RECORD_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream.current, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 1_000_000 });
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      const blob = new Blob(chunks, { type: r.mimeType || mimeType || "video/webm" });
      const length = Math.max(1, Math.round((Date.now() - started.current) / 1000));
      stopCamera();
      setRecording({ blob, url: URL.createObjectURL(blob), seconds: length });
      setMode("review");
    };
    recorder.current = r;
    started.current = Date.now();
    setSeconds(0);
    r.start(500);
    setMode("recording");
  }

  function retake() {
    if (recording) URL.revokeObjectURL(recording.url);
    setRecording(null);
    void openCamera();
  }

  function cancel() {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stopCamera();
    if (recording) URL.revokeObjectURL(recording.url);
    setRecording(null);
    setMode("chat");
  }

  async function send() {
    if (!recording || !caption.trim()) return;
    const ok = await onSend({ blob: recording.blob, seconds: recording.seconds, caption: caption.trim() });
    if (ok) {
      URL.revokeObjectURL(recording.url);
      setRecording(null);
      setCaption("");
      setMode("chat");
    }
  }

  const time = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-[min(20rem,100%)] shrink-0 rounded-[2.6rem] bg-zinc-900 p-2.5 shadow-lift">
        <div className="relative flex h-[34rem] flex-col overflow-hidden rounded-[2.1rem] bg-white">
          <div className="relative z-20 flex items-center justify-between px-6 pb-1 pt-3 text-xs font-bold">
            <span className={cn(mode !== "chat" && "text-white")} suppressHydrationWarning>
              {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-zinc-900" aria-hidden />
            <span className={cn("flex items-center gap-1", mode !== "chat" && "text-white")}>
              <Signal className="size-3.5" /> <Wifi className="size-3.5" /> <BatteryFull className="size-4" />
            </span>
          </div>

          {mode === "chat" ? (
            <>
              <div className="flex items-center gap-2 border-b border-zinc-100 px-3 pb-2 pt-1">
                <ChevronLeft className="size-5 text-sky-500" />
                <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-black text-white">A</span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold">Akela (AI leader)</span>
                  <span className="block text-[11px] text-emerald-600">{busy ? "receiving…" : "online"}</span>
                </span>
              </div>
              <div ref={list} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
                {(sim?.messages ?? []).map((m, i) => (
                  <div key={i} className={cn("flex", m.role === "scout" ? "justify-end" : "justify-start")}>
                    {m.uploadId ? (
                      <div className="max-w-[80%] overflow-hidden rounded-3xl rounded-br-md bg-sky-500 text-white">
                        <video src={`/api/files/${m.uploadId}`} controls playsInline preload="metadata" className="max-h-56 w-full bg-black" />
                        <p className="px-3 py-1.5 text-[13px]">
                          🎬 {m.seconds ? `${time(m.seconds)} · ` : ""}
                          {m.text}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "max-w-[78%] whitespace-pre-wrap rounded-3xl px-3.5 py-2 text-[14px] leading-snug",
                          m.role === "scout" ? "rounded-br-md bg-sky-500 text-white" : "rounded-bl-md bg-zinc-100 text-zinc-900",
                        )}
                      >
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
                {busy && (
                  <p className="flex items-center justify-end gap-1.5 text-[11px] text-zinc-500">
                    <LoaderCircle className="size-3.5 animate-spin" /> Sending your video…
                  </p>
                )}
              </div>
              <div className="border-t border-zinc-100 p-3">
                <button
                  type="button"
                  onClick={openCamera}
                  disabled={disabled || busy || done}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-2.5 font-extrabold text-white hover:bg-rose-600 disabled:opacity-40"
                >
                  <Video className="size-5" /> {done ? "Sent ✅" : "Record a video message"}
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col bg-black text-white">
              {mode === "review" && recording ? (
                <video src={recording.url} controls playsInline className="mt-10 max-h-[18rem] w-full bg-black" />
              ) : (
                <video ref={live} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
              )}
              <button
                type="button"
                onClick={cancel}
                className="absolute left-3 top-10 grid size-9 place-items-center rounded-full bg-black/50 hover:bg-black/70"
                aria-label="Close camera"
              >
                <X className="size-5" />
              </button>
              {mode === "recording" && (
                <span className="absolute left-1/2 top-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-black">
                  <span className="size-2 animate-pulse rounded-full bg-white" /> {time(seconds)} / {time(maxSeconds)}
                </span>
              )}
              {mode === "camera" && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-black/70 to-transparent pb-6 pt-10">
                  <p className="text-xs">Say hello, who you are (first name), and something about JOTI!</p>
                  <button type="button" onClick={record} className="grid size-16 place-items-center rounded-full border-4 border-white" aria-label="Start recording">
                    <span className="size-12 rounded-full bg-rose-500" />
                  </button>
                </div>
              )}
              {mode === "recording" && (
                <div className="absolute inset-x-0 bottom-0 flex justify-center pb-6">
                  <button
                    type="button"
                    onClick={() => recorder.current?.stop()}
                    className="grid size-16 place-items-center rounded-full border-4 border-white"
                    aria-label="Stop recording"
                  >
                    <span className="size-7 rounded-md bg-rose-500" />
                  </button>
                </div>
              )}
              {mode === "review" && (
                <div className="mt-auto space-y-2 bg-zinc-900 p-3">
                  <input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={300}
                    placeholder="What's your video about?"
                    className="w-full rounded-2xl bg-white px-3 py-2 text-[14px] text-zinc-900 focus:outline-none"
                    aria-label="What's your video about?"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={retake} className="flex-1 rounded-2xl bg-white/15 py-2 text-sm font-bold hover:bg-white/25">
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={send}
                      disabled={!caption.trim() || busy}
                      className="flex flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-sky-500 py-2 text-sm font-extrabold hover:bg-sky-600 disabled:opacity-40"
                    >
                      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />} Send to Akela
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {error && <p className="max-w-sm rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-800 ring-1 ring-rose-200">{error}</p>}
      {!done && !error && (
        <p className="max-w-xs text-center text-xs text-muted">
          🎥 Your browser will ask to use the camera and microphone: press Allow. Only Akela and your leaders see the video.
        </p>
      )}
    </div>
  );
}
