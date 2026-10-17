"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, RotateCcw, Send, ShieldAlert, Smile } from "lucide-react";
import { cn } from "@/components/ui";

type Msg = { id: number; who: string; letter: string; color: string; text: string; mine?: boolean; reactions: string[] };

const FRIENDS = [
  { who: "1st Ottawa Scouts", letter: "1", color: "bg-violet-600" },
  { who: "Nairobi Rovers", letter: "N", color: "bg-emerald-600" },
  { who: "Troop 22 Manila", letter: "T", color: "bg-amber-600" },
  { who: "Scouts de Lyon", letter: "S", color: "bg-sky-600" },
  { who: "Melbourne Joeys", letter: "M", color: "bg-rose-600" },
];

const START: Msg[] = [
  { id: 1, ...FRIENDS[0], text: "Hi everyone, hello from Canada! 🇨🇦", reactions: [] },
  { id: 2, ...FRIENDS[1], text: "Jambo from Kenya 🇰🇪 What's everyone doing for JOTA-JOTI?", reactions: ["👋"] },
  { id: 3, ...FRIENDS[2], text: "We're making a radio this year 📻", reactions: [] },
];

/** Pretend replies, picked by what the young person typed: [friend, reply]. */
function replyTo(text: string, turn: number): [number, string] {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|hiya|greetings)\b/.test(t)) return [0, "Hello! Welcome to the chat 😊 Where are you from?"];
  if (/where|country|from/.test(t)) return [2, "We're in the Philippines 🇵🇭 It's evening here!"];
  if (/food|cook|eat|camp/.test(t)) return [2, "At camp we cook chicken adobo over the fire. So good! 🍲"];
  if (/badge/.test(t)) return [1, "We're doing our Communicator badge too! 📻"];
  if (/weather|rain|sun/.test(t)) return [4, "It's sunny and 30°C here in Australia ☀️"];
  if (/bye|go now|gtg/.test(t)) return [3, "Au revoir! Have a great JOTA-JOTI! 73 👋"];
  if (t.includes("?")) return [turn % FRIENDS.length, "Good question! I think everyone does it a bit differently 😄"];
  return [turn % FRIENDS.length, "Cool! 😄"];
}

const PERSONAL = /(\d[\s-]?){7,}|[\w.+-]+@[\w-]+\.\w+|\b[a-z]{1,2}\d{1,2}[a-z]?\s*\d[a-z]{2}\b|\bmy (school|address|number|phone|insta|snap|tiktok)\b|\bi live (at|on)\b/i;

const GOALS = [
  { id: "join", label: "Press Join" },
  { id: "hello", label: "Say hello" },
  { id: "question", label: "Ask someone a question" },
  { id: "react", label: "React to a message with an emoji" },
  { id: "private", label: "Deal with a private message safely" },
] as const;
type Goal = (typeof GOALS)[number]["id"];

/**
 * A pretend chat room for practising before using the real one: join, send
 * messages, react, and learn what to do when a stranger messages privately.
 * Nothing leaves the page.
 */
export function PracticeChat() {
  const [messages, setMessages] = useState<Msg[]>(START);
  const [joined, setJoined] = useState(false);
  const [draft, setDraft] = useState("");
  const [done, setDone] = useState<Set<Goal>>(new Set());
  const [warning, setWarning] = useState<string | null>(null);
  const [dm, setDm] = useState<"none" | "shown" | "replied" | "safe">("none");
  const [picker, setPicker] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const sent = useRef(0);
  const nextId = useRef(100);
  const list = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const tick = (goal: Goal) => setDone((d) => new Set(d).add(goal));
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  function send(force = false) {
    const text = draft.trim();
    if (!text || !joined) return;
    if (!force && PERSONAL.test(text)) {
      setWarning("That looks like personal information (a number, email, address, school or social media). In the real chat, never share it. Change your message, or press Send anyway to practise.");
      return;
    }
    setWarning(null);
    setDraft("");
    setMessages((m) => [...m, { id: nextId.current++, who: "You", letter: "Y", color: "bg-brand-500", text, mine: true, reactions: [] }]);
    if (/\b(hi|hello|hey|hiya|greetings)\b/i.test(text)) tick("hello");
    if (text.includes("?")) tick("question");
    sent.current++;

    const [who, reply] = replyTo(text, sent.current);
    setTyping(true);
    later(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: nextId.current++, ...FRIENDS[who], text: reply, reactions: [] }]);
    }, 1400);
    if (sent.current === 2 && dm === "none") later(() => setDm("shown"), 3200);
  }

  function react(id: number, emoji: string) {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, reactions: x.reactions.includes(emoji) ? x.reactions : [...x.reactions, emoji] } : x)));
    setPicker(null);
    tick("react");
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMessages(START);
    setJoined(false);
    setDraft("");
    setDone(new Set());
    setWarning(null);
    setDm("none");
    setTyping(false);
    sent.current = 0;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_15rem]" data-tour="chat-practice">
      <div className="relative overflow-hidden rounded-2xl bg-[#1f2329] text-[14px] text-zinc-200 ring-1 ring-line shadow-card">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <p className="font-bold text-white"># Practice_Room 🌍</p>
          <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-black text-zinc-900">PRACTICE: only you can see this</span>
        </div>
        <p className="bg-sky-200 px-4 py-1.5 text-xs font-semibold text-zinc-900">⭐ English only | Be kind | No personal contacts or links</p>

        <div ref={list} className="h-72 space-y-3 overflow-y-auto px-4 py-3">
          {messages.map((m) => (
            <div key={m.id} className="group relative flex gap-2.5">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded font-bold text-white", m.color)}>{m.letter}</span>
              <div className="min-w-0 flex-1">
                <p>
                  <span className={cn("font-bold", m.mine ? "text-brand-200" : "text-white")}>{m.who}</span>{" "}
                  <span className="text-xs text-zinc-500">just now</span>
                </p>
                <p className="break-words">{m.text}</p>
                {m.reactions.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {m.reactions.map((r) => (
                      <span key={r} className="rounded-full bg-white/10 px-2 py-0.5 text-xs ring-1 ring-white/20">
                        {r} 1
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {!m.mine && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPicker(picker === m.id ? null : m.id)}
                    className="grid size-7 place-items-center rounded-md text-zinc-400 opacity-60 hover:bg-white/10 hover:opacity-100 group-hover:opacity-100"
                    aria-label="Add a reaction"
                  >
                    <Smile className="size-4" />
                  </button>
                  {picker === m.id && (
                    <div className="absolute right-0 top-8 z-10 flex gap-1 rounded-lg bg-zinc-800 p-1.5 shadow-lg ring-1 ring-white/10">
                      {["👍", "😂", "❤️", "👋", "🎉"].map((e) => (
                        <button key={e} type="button" onClick={() => react(m.id, e)} className="rounded p-1 text-lg hover:bg-white/10">
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {typing && <p className="text-xs italic text-zinc-400">Someone is typing…</p>}
        </div>

        {warning && (
          <div className="mx-3 mb-2 rounded-lg bg-amber-100 p-2.5 text-[13px] text-amber-900">
            <p>⚠️ {warning}</p>
            <button type="button" onClick={() => send(true)} className="mt-1 text-xs font-bold underline">
              Send anyway (practice only)
            </button>
          </div>
        )}

        <div className="m-3 rounded-lg ring-1 ring-white/15">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            disabled={!joined}
            placeholder={joined ? "Message #Practice_Room" : "Press Join first →"}
            className="w-full bg-transparent px-3 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed"
            aria-label="Your message"
          />
          <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
            <button
              type="button"
              onClick={() => setDraft((d) => `${d}👋`)}
              disabled={!joined}
              className="grid size-8 place-items-center rounded-md text-zinc-400 hover:bg-white/10 disabled:opacity-40"
              aria-label="Add a waving emoji"
            >
              <Smile className="size-4" />
            </button>
            {joined ? (
              <button type="button" onClick={() => send()} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 font-bold text-white hover:bg-blue-500">
                <Send className="size-4" /> Send
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setJoined(true);
                  tick("join");
                }}
                className="ml-auto rounded-md bg-blue-600 px-5 py-1.5 font-bold text-white hover:bg-blue-500"
              >
                Join
              </button>
            )}
          </div>
        </div>

        {dm !== "none" && dm !== "safe" && (
          <div className="absolute inset-x-3 top-14 z-20 rounded-xl bg-white p-4 text-zinc-900 shadow-2xl ring-2 ring-rose-300 animate-pop">
            {dm === "shown" ? (
              <>
                <p className="flex items-center gap-2 text-sm font-black text-rose-700">
                  <ShieldAlert className="size-5" /> New direct message
                </p>
                <p className="mt-2 rounded-lg bg-zinc-100 p-2.5 text-sm">
                  <b>coolkid_2011:</b> hey ur nice 😊 whats ur snapchat? lets chat privately
                </p>
                <p className="mt-2 text-sm font-bold">What should you do?</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => setDm("replied")} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-bold hover:bg-zinc-200">
                    Reply with my Snapchat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDm("safe");
                      tick("private");
                    }}
                    className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-bold hover:bg-zinc-200"
                  >
                    Don&apos;t reply. Tell a leader
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDm("safe");
                      tick("private");
                    }}
                    className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-bold hover:bg-zinc-200"
                  >
                    Report it, and tell a leader
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-black text-rose-700">Stop! 🛑</p>
                <p className="mt-1 text-sm">
                  Never give your social media, number or address to someone you don&apos;t know, even if they seem friendly. People online
                  aren&apos;t always who they say they are. Don&apos;t reply: show a leader instead.
                </p>
                <button type="button" onClick={() => setDm("shown")} className="mt-2 text-sm font-bold text-brand-600 underline">
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <p className="font-extrabold">Try these</p>
          <ul className="mt-2 space-y-2">
            {GOALS.map((g) => (
              <li key={g.id} className="flex items-start gap-2 text-sm">
                {done.has(g.id) ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 size-4 shrink-0 text-zinc-300" />}
                <span className={cn(done.has(g.id) && "text-muted line-through")}>{g.label}</span>
              </li>
            ))}
          </ul>
          {done.size === GOALS.length && (
            <p className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-sm font-bold text-emerald-800">🎉 You&apos;re ready for the real chat!</p>
          )}
          {dm === "safe" && done.has("private") && (
            <p className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-900">
              ✅ <b>Exactly right.</b> In the real chat, open the message&apos;s ⋮ menu and choose <b>Report</b>, then show a leader.
            </p>
          )}
        </div>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-600">
          <RotateCcw className="size-4" /> Start again
        </button>
      </div>
    </div>
  );
}
