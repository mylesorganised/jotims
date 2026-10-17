"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Hand, LoaderCircle, MessagesSquare, RotateCcw, Send, Users } from "lucide-react";
import { requestHelpAction } from "@/app/actions/scout";
import { cn } from "./ui";

type Message = { role: "ai" | "scout"; text: string };
type Explanation = { status: "chatting" | "passed" | "referred"; messages: Message[] };

/**
 * "Explain it to a leader", done as a chat with the AI leader. They type their
 * explanation in their own words (pasting is switched off), the AI leader asks
 * a few questions, and once they've explained it the step is marked as done
 * for the leaders to see. A real leader is always the other option.
 */
export function ExplainChat({
  badgeId,
  taskId,
  step,
  topic,
  locked,
  preview,
}: {
  badgeId: string;
  taskId: string;
  step: number;
  topic: string;
  /** the task has been sent in: show the chat but don't allow more */
  locked: boolean;
  preview?: boolean;
}) {
  const [available, setAvailable] = useState<boolean | null>(preview ? true : null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [mode, setMode] = useState<"choose" | "chat" | "leader">("choose");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteNote, setPasteNote] = useState(false);
  const [handUp, setHandUp] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (preview) return;
    let stop = false;
    fetch(`/api/explain?badgeId=${encodeURIComponent(badgeId)}&taskId=${encodeURIComponent(taskId)}&step=${step}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { available: boolean; explanation: Explanation | null } | null) => {
        if (stop || !data) return;
        setAvailable(data.available);
        setExplanation(data.explanation);
        if (data.explanation) setMode("chat");
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [badgeId, taskId, step, preview]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [explanation, busy]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeId, taskId, step, ...body }),
      });
      const data = (await res.json().catch(() => ({}))) as { explanation?: Explanation; error?: string };
      if (data.explanation) setExplanation(data.explanation);
      if (!res.ok) setError(data.error ?? "Something went wrong. Try again?");
      return res.ok;
    } catch {
      setError("Couldn't reach the AI leader. Check the internet and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setMode("chat");
    if (preview) return;
    if (!explanation) await post({ action: "start" });
    setTimeout(() => field.current?.focus(), 50);
  }

  async function send() {
    const message = draft.trim();
    if (!message || busy) return;
    setDraft("");
    setExplanation((e) => (e ? { ...e, messages: [...e.messages, { role: "scout", text: message }] } : e));
    const ok = await post({ message });
    if (!ok) setDraft(message);
    field.current?.focus();
  }

  async function putHandUp() {
    await requestHelpAction(badgeId, taskId, `Ready to explain ${topic} to a leader`);
    setHandUp(true);
  }

  const blockPaste = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setPasteNote(true);
  };

  if (available === false) return null;
  if (locked && !explanation) return null;

  const status = explanation?.status;

  return (
    <div className="overflow-hidden rounded-2xl ring-2 ring-brand-200" data-tour="explain-chat">
      <div className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-white">
        <MessagesSquare className="size-5" />
        <p className="font-extrabold">Explain it to the AI leader</p>
        {status === "passed" && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
            <CheckCircle2 className="size-3.5" /> Done
          </span>
        )}
      </div>

      {mode === "choose" && !locked && (
        <div className="space-y-3 bg-white p-4 text-[15px] leading-relaxed">
          <p>
            You can explain this to our <b>AI leader</b> here in a chat, instead of finding a leader. It will ask you a few questions to
            check you&apos;ve got it.
          </p>
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            ✋ <b>Copy and paste is switched off</b> in this chat. We want to hear how <i>you</i> would explain it, in your own words, not
            words from a website. It doesn&apos;t have to be perfect!
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={start}
              disabled={preview}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 font-extrabold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              <Bot className="size-4" /> Start the chat
            </button>
            <button
              type="button"
              onClick={() => setMode("leader")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
            >
              <Users className="size-4" /> I&apos;ll explain to a real leader
            </button>
          </div>
          {preview && <p className="text-xs text-muted">Preview: young people chat with the AI leader here.</p>}
        </div>
      )}

      {mode === "leader" && (
        <div className="space-y-3 bg-white p-4 text-[15px]">
          <p>
            Great! Find a leader and explain it to them. If you can&apos;t see one, put your hand up and someone will come over.
          </p>
          <div className="flex flex-wrap gap-2">
            {!preview && (
              <button
                type="button"
                onClick={putHandUp}
                disabled={handUp}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-600 disabled:opacity-70"
              >
                <Hand className="size-4" /> {handUp ? "Hand up! A leader's on the way" : "Put my hand up"}
              </button>
            )}
            <button type="button" onClick={() => setMode("choose")} className="rounded-xl px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50">
              Actually, I&apos;ll use the chat
            </button>
          </div>
        </div>
      )}

      {mode === "chat" && (
        <div className="bg-canvas">
          <div ref={list} className="max-h-[26rem] space-y-3 overflow-y-auto p-4" aria-live="polite">
            {preview && !explanation && (
              <Bubble role="ai" text="Hi Sam! I'm the AI leader. 👋 Can you explain this to me, in your own words? (Preview: nothing is sent.)" />
            )}
            {explanation?.messages.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <LoaderCircle className="size-4 animate-spin" /> The AI leader is thinking…
              </p>
            )}
          </div>

          {status === "passed" && (
            <p className="flex items-start gap-2 border-t border-line bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> You explained it to the AI leader. Leaders can read this chat. Carry on to the next
              step!
            </p>
          )}

          {status === "referred" && !locked && (
            <div className="space-y-2 border-t border-line bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Let&apos;s get a real leader to finish this with you.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={putHandUp}
                  disabled={handUp}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 font-bold text-white hover:bg-amber-600 disabled:opacity-70"
                >
                  <Hand className="size-4" /> {handUp ? "Hand up!" : "Put my hand up"}
                </button>
                <button
                  type="button"
                  onClick={() => post({ action: "restart" })}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold text-amber-900 hover:bg-amber-100"
                >
                  <RotateCcw className="size-4" /> Try the chat again
                </button>
              </div>
            </div>
          )}

          {(status === "chatting" || (preview && !explanation)) && !locked && (
            <div className="border-t border-line bg-white p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={field}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onPaste={blockPaste}
                  onDrop={blockPaste}
                  onBeforeInput={(e) => {
                    const type = (e.nativeEvent as InputEvent).inputType;
                    if (type === "insertFromPaste" || type === "insertFromDrop" || type === "insertFromPasteAsQuotation") blockPaste(e);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={2}
                  maxLength={700}
                  disabled={busy || preview}
                  placeholder="Type your explanation…"
                  autoComplete="off"
                  spellCheck
                  className="min-h-[2.75rem] flex-1 resize-none rounded-xl bg-canvas px-3 py-2.5 text-[15px] ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-400"
                  aria-label="Your explanation"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={busy || !draft.trim() || preview}
                  className="grid size-11 place-items-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="size-5" />
                </button>
              </div>
              <p className={cn("mt-1.5 text-xs", pasteNote ? "font-bold text-amber-700" : "text-muted")}>
                {pasteNote
                  ? "✋ Pasting is switched off here. Type it in your own words. It's fine if it's not perfect!"
                  : "Enter to send · Shift + Enter for a new line · Copy and paste is switched off"}
              </p>
              {status === "chatting" && (
                <button type="button" onClick={() => setMode("leader")} className="mt-1 text-xs font-bold text-brand-700 hover:underline">
                  I&apos;d rather explain to a real leader
                </button>
              )}
            </div>
          )}

          {error && <p className="border-t border-line bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</p>}
        </div>
      )}
    </div>
  );
}

function Bubble({ role, text }: Message) {
  return (
    <div className={cn("flex", role === "scout" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed",
          role === "scout" ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md bg-white ring-1 ring-line",
        )}
      >
        {role === "ai" && (
          <span className="mb-0.5 flex items-center gap-1 text-xs font-bold text-brand-600">
            <Bot className="size-3.5" /> AI leader
          </span>
        )}
        {text}
      </div>
    </div>
  );
}
