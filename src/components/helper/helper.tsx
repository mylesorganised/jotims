"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, Bot, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { RichText } from "../rich-text";
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

function suggestions(mode: HelperMode, context: HelperContextValue | null) {
  if (mode === "leader") {
    return ["How do I sign off a badge?", "What should I look for in the step tracker task?", "How do I add my whole section at once?"];
  }
  if (context?.taskId) return ["What do I need to do in this step?", "Can you give me a hint?", "Can you explain it more simply?"];
  if (context?.badgeId) return ["Which task should I start with?", "What do I need to finish this badge?"];
  return ["Which badge should I do first?", "How do I add a screenshot?", "What happens when a leader checks my work?"];
}

/** Very small markdown: paragraphs, bullet and numbered lists, headings, plus RichText inline formatting. */
function ChatText({ text }: { text: string }) {
  const isItem = (l: string) => /^\s*([-*•]|\d+[.)])\s+/.test(l);
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
                    <RichText text={l.replace(/^\s*([-*•]|\d+[.)])\s+/, "")} />
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
                      <RichText text={line.replace(/^#{1,4}\s/, "")} />
                    </strong>
                  ) : (
                    <RichText text={line} />
                  )}
                </span>
              ))}
            </p>
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
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

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
        body: JSON.stringify({ mode, messages: history, context }),
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
                : "Answers come from the badge content and guide built into this app. Double-check anything important."}
            </p>
            {messages.length === 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-bold text-ink">{isScout ? "Hi! 👋 What can I help with?" : "How can I help?"}</p>
                {suggestions(mode, context).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded-xl bg-white px-3 py-2 text-left text-sm font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-50"
                  >
                    {s}
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
                    <ChatText text={m.content} />
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
