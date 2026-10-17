"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, Bot, Compass, MousePointerClick, Play, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { getTour } from "@/lib/tour/registry";
import { RichText } from "../rich-text";
import { useTour } from "../tour/tour";
import { cn } from "../ui";

export type HelperMode = "scout" | "leader";
export type HelperContextValue = { badgeId?: string; taskId?: string; step?: number; label?: string };
type Message = { role: "user" | "assistant"; content: string };

const Ctx = createContext<((value: HelperContextValue | null) => void) | null>(null);

/** Wraps a layout: holds the chat (so it survives page changes) and what page it's helping with. */
export function HelperProvider({ mode, enabled, children }: { mode: HelperMode; enabled: boolean; children: ReactNode }) {
  const [context, setContext] = useState<HelperContextValue | null>(null);
  return (
    <Ctx value={setContext}>
      {children}
      {enabled && <HelperChat mode={mode} context={context} />}
    </Ctx>
  );
}

/** Tells the helper which badge / task / step is on screen. */
export function useHelperContext(value: HelperContextValue | null) {
  const set = use(Ctx);
  const key = value ? `${value.badgeId}|${value.taskId}|${value.step}|${value.label}` : "";
  useEffect(() => {
    if (!set) return;
    set(value);
    return () => set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, key]);
}

export function SetHelperContext(props: HelperContextValue) {
  useHelperContext(props);
  return null;
}

type Suggestion = { label: string; tour?: string };

function suggestions(mode: HelperMode, context: HelperContextValue | null): Suggestion[] {
  if (mode === "leader") {
    const path = typeof window === "undefined" ? "" : window.location.pathname;
    return [
      path.startsWith("/admin/scouts/")
        ? { label: "🧭 Show me how to sign off badges", tour: "leader-person" }
        : path === "/admin/scouts"
          ? { label: "🧭 Show me how to add young people", tour: "leader-people" }
          : { label: "🧭 Give me a tour of the leaders' area", tour: "leader-start" },
      { label: "How do I sign off a badge?" },
      { label: "What should I look for in the step tracker task?" },
      { label: "How do I add my whole section at once?" },
    ];
  }
  if (context?.taskId)
    return [
      { label: "What do I need to do in this step?" },
      { label: "Can you give me a hint?" },
      { label: "🧭 Show me how tasks work", tour: "scout-task" },
    ];
  if (context?.badgeId) return [{ label: "Which task should I start with?" }, { label: "What do I need to finish this badge?" }];
  return [
    { label: "Where should I start?" },
    { label: "🧭 Show me around the app", tour: "scout-start" },
    { label: "🧭 Show me how tasks work", tour: "scout-task" },
  ];
}

// The helper can add [[show:place]] and [[tour:place,place…]] / [[tour:tour-id]] to its replies.
const MARKER = /\[\[(show|tour):([a-z0-9:/,_ -]+)\]\]/gi;

type Actions = {
  show: (id: string) => void;
  tour: (ids: string[]) => void;
};

/** One line of a reply, with any [[show:…]] markers turned into "Show me" buttons. */
function Line({ text, actions }: { text: string; actions: Actions }) {
  const parts: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(MARKER)) {
    const index = m.index ?? 0;
    if (index > last) parts.push(<RichText key={i++} text={text.slice(last, index)} />);
    if (m[1].toLowerCase() === "show") {
      const id = m[2].trim();
      parts.push(
        <button
          key={i++}
          type="button"
          onClick={() => actions.show(id)}
          className="mx-1 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-bold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-200"
        >
          <MousePointerClick className="size-3.5" /> Show me
        </button>,
      );
    }
    last = index + m[0].length;
  }
  if (last < text.length) parts.push(<RichText key={i++} text={text.slice(last)} />);
  return <>{parts}</>;
}

/** Very small markdown: paragraphs, bullet and numbered lists, headings, plus RichText inline formatting. */
function ChatText({ text: raw, actions }: { text: string; actions: Actions }) {
  const isItem = (l: string) => /^\s*([-*•]|\d+[.)])\s+/.test(l);
  // Hide a marker that's still streaming in ("[[sho"), and pull out walkthrough markers.
  const tours: string[][] = [];
  const text = raw.replace(/\[\[[^\]]*$/, "").replace(MARKER, (whole, kind: string, ids: string) => {
    if (kind.toLowerCase() !== "tour") return whole;
    tours.push(ids.split(",").map((x) => x.trim()).filter(Boolean));
    return "";
  });
  // Split into runs of list items and runs of ordinary lines, so "Here's how:" followed by bullets works.
  const runs: { list: boolean; lines: string[] }[] = [];
  for (const line of text.trim().split("\n")) {
    if (!line.trim()) {
      runs.push({ list: false, lines: [] });
      continue;
    }
    const list = isItem(line);
    const last = runs[runs.length - 1];
    if (last && last.list === list && last.lines.length) last.lines.push(line);
    else runs.push({ list, lines: [line] });
  }
  return (
    <div className="space-y-2">
      {runs
        .filter((r) => r.lines.length)
        .map((run, ri) => {
          if (run.list) {
            const ordered = /^\s*\d/.test(run.lines[0]);
            const List = ordered ? "ol" : "ul";
            return (
              <List key={ri} className={cn("space-y-1 pl-5", ordered ? "list-decimal" : "list-disc")}>
                {run.lines.map((l, ii) => (
                  <li key={ii}>
                    <Line text={l.replace(/^\s*([-*•]|\d+[.)])\s+/, "")} actions={actions} />
                  </li>
                ))}
              </List>
            );
          }
          return (
            <p key={ri}>
              {run.lines.map((line, li) => (
                <span key={li}>
                  {li > 0 && <br />}
                  {/^#{1,4}\s/.test(line) ? (
                    <strong>
                      <Line text={line.replace(/^#{1,4}\s/, "")} actions={actions} />
                    </strong>
                  ) : (
                    <Line text={line} actions={actions} />
                  )}
                </span>
              ))}
            </p>
          );
        })}
      {tours.map((ids, ti) => {
        const named = ids.length === 1 ? getTour(ids[0]) : undefined;
        return (
          <button
            key={`tour-${ti}`}
            type="button"
            onClick={() => actions.tour(ids)}
            className="flex w-full items-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 text-left text-sm font-bold text-white shadow-sm transition hover:bg-brand-600"
          >
            {named ? <Compass className="size-4 shrink-0" /> : <Play className="size-4 shrink-0" />}
            {named ? `Take the tour: ${named.title}` : "Walk me through it"}
          </button>
        );
      })}
    </div>
  );
}

function HelperChat({ mode, context }: { mode: HelperMode; context: HelperContextValue | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  /** one id per chat, so leaders can read it back as a single conversation */
  const conversation = useRef<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const tour = useTour();

  // Get out of the way while something is highlighted, then come back.
  const actions: Actions = {
    show: (id) => {
      if (!tour) return;
      setOpen(false);
      tour.highlight(id, { onEnd: () => setOpen(true) });
    },
    tour: (ids) => {
      if (!tour) return;
      setOpen(false);
      if (ids.length === 1 && getTour(ids[0])) tour.startTour(ids[0], { onEnd: () => setOpen(true) });
      else tour.walkthrough(ids, { onEnd: () => setOpen(true) });
    },
  };

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    const history: Message[] = [...messages, { role: "user", content: question }];
    conversation.current ??= crypto.randomUUID();
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    const append = (chunk: string) =>
      setMessages((all) => {
        const copy = [...all];
        copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
        return copy;
      });
    try {
      const res = await fetch("/api/helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          conversationId: conversation.current,
          messages: history,
          context: { ...context, path: window.location.pathname },
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        append(res.status === 401 ? "Please log in to use the helper." : (await res.text()) || "Sorry, something went wrong.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        append(decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") append("Sorry, I couldn't connect. Check the internet and try again.");
    } finally {
      setBusy(false);
      abort.current = null;
    }
  };

  const isScout = mode === "scout";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-tour="helper-button"
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-3 font-bold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-600 sm:bottom-6 sm:right-6"
        >
          <Sparkles className="size-5" />
          <span>{isScout ? "Ask the helper" : "Leader helper"}</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Helper chat"
          className="fixed inset-x-2 bottom-2 z-40 flex h-[min(38rem,calc(100dvh-1rem))] animate-fade-up flex-col overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-line sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[25rem]"
        >
          <header className="flex items-center gap-3 border-b border-line bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-white/15">
              <Bot className="size-5" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-extrabold">{isScout ? "Helper" : "Leader helper"}</p>
              <p className="truncate text-xs text-white/80">{context?.label ? `Helping with: ${context.label}` : isScout ? "Ask me anything about your badges" : "Ask about the app or any badge"}</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  abort.current?.abort();
                  setMessages([]);
                  conversation.current = null;
                }}
                className="grid size-8 place-items-center rounded-lg hover:bg-white/15"
                title="Start again"
                aria-label="Start a new chat"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-white/15" aria-label="Close helper">
              <X className="size-5" />
            </button>
          </header>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
            <p className="rounded-xl bg-white px-3 py-2 text-xs text-muted ring-1 ring-line">
              {isScout
                ? "I'm a computer helper, so I can get things wrong. Leaders can read these chats. Never share personal details like your address, school or phone number. Need a real person? Press “Ask for help”."
                : "Answers come from the badge content and guide built into this app. Double-check anything important. Chats are saved in Helper chats."}
            </p>
            {messages.length === 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-bold text-ink">{isScout ? "Hi! 👋 What can I help with?" : "How can I help?"}</p>
                {suggestions(mode, context).map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => (s.tour ? actions.tour([s.tour]) : send(s.label))}
                    className={cn(
                      "block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ring-1 transition",
                      s.tour ? "bg-amber-50 text-amber-900 ring-amber-200 hover:bg-amber-100" : "bg-white text-brand-700 ring-brand-100 hover:bg-brand-50",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-8 rounded-2xl rounded-br-md bg-brand-500 px-3.5 py-2 text-[15px] text-white">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="mr-6 rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[15px] leading-relaxed ring-1 ring-line">
                  {m.content ? (
                    <ChatText text={m.content} actions={actions} />
                  ) : (
                    <span className="inline-flex gap-1 py-1" aria-label="Thinking">
                      <span className="size-2 animate-bounce rounded-full bg-brand-300" />
                      <span className="size-2 animate-bounce rounded-full bg-brand-300 [animation-delay:120ms]" />
                      <span className="size-2 animate-bounce rounded-full bg-brand-300 [animation-delay:240ms]" />
                    </span>
                  )}
                </div>
              ),
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 border-t border-line bg-white p-3"
          >
            <textarea
              ref={field}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              maxLength={1200}
              placeholder={isScout ? "Type your question…" : "Ask a question…"}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl bg-canvas px-3 py-2.5 text-[15px] ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => abort.current?.abort()}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-200 text-ink hover:bg-zinc-300"
                aria-label="Stop"
              >
                <Square className="size-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp className="size-5" />
              </button>
            )}
          </form>
        </section>
      )}
    </>
  );
}
