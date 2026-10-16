"use client";

import { useEffect, useRef, useState } from "react";
import { History, KeyRound, Leaf, Pause, Play, RotateCcw, Scale, Smile, Timer } from "lucide-react";
import { buttonClass, cn, inputClass } from "../ui";
import { beep } from "./audio";
import { ToolFrame } from "./tool-frame";

// ---------------------------------------------------------------- emoji board

const EMOJIS = ["😂", "😁", "😀", "🤓", "😍", "😎", "😘", "🥰", "😩", "😇", "😜", "😊", "😋", "😛", "🤗", "😳", "🤒", "🤢", "😱", "😮", "🤔", "😢", "😡", "🙄"];

export function EmojiTool() {
  const [big, setBig] = useState<string | null>(null);
  return (
    <ToolFrame title="Reaction board" icon={<Smile className="size-4" />}>
      <p className="mb-3 text-sm text-muted">Ask your listener to tap the face that shows how they feel about your story.</p>
      {big ? (
        <button type="button" onClick={() => setBig(null)} className="grid w-full place-items-center rounded-2xl bg-white py-6 ring-1 ring-line">
          <span className="animate-pop text-[7rem] leading-none">{big}</span>
          <span className="mt-2 text-sm font-bold text-muted">Tap to choose again</span>
        </button>
      ) : (
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setBig(e)}
              className="grid aspect-square place-items-center rounded-xl bg-white text-3xl ring-1 ring-line transition hover:scale-110 hover:ring-brand-300"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </ToolFrame>
  );
}

// ------------------------------------------------------------------- timeline

const TIMELINE = [
  { id: "computers", label: "Computers" },
  { id: "phones", label: "Phones" },
  { id: "games", label: "Games" },
  { id: "music", label: "Music" },
];

export function TimelineTool() {
  return (
    <ToolFrame
      title="Technology through time"
      icon={<History className="size-4" />}
      tabs={TIMELINE.map((t) => ({
        id: t.id,
        label: t.label,
        content: (
          <div>
            <p className="mb-2 text-sm text-muted">From oldest (top left) to newest (bottom right).</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/guides/timeline/${t.id}.webp`}
              alt={`${t.label} through time`}
              className="mx-auto max-h-[28rem] w-auto rounded-xl ring-1 ring-line"
              loading="lazy"
            />
          </div>
        ),
      }))}
    />
  );
}

// ------------------------------------------------------------------ passwords

const COMMON = ["password", "123456", "qwerty", "letmein", "football", "iloveyou", "admin", "welcome", "monkey", "dragon", "minecraft", "fortnite", "roblox"];

function rate(pw: string) {
  const tips: string[] = [];
  let score = 0;
  const words = pw.trim().split(/[\s\-_.]+|(?=[A-Z])/).filter((w) => w.length >= 3);
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (words.length >= 3) score += 2;
  if (COMMON.some((c) => pw.toLowerCase().includes(c))) {
    score = Math.min(score, 1);
    tips.push("It contains a really common word or pattern. Hackers try those first!");
  }
  if (/^(.)\1+$/.test(pw)) score = 0;
  if (pw.length < 12) tips.push("Make it longer. Long passwords are much harder to crack.");
  if (words.length < 3) tips.push("Try three random words, like “PurpleTentPancake”.");
  if (!/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) tips.push("Adding a number or symbol makes it even stronger.");
  const level = score >= 7 ? 3 : score >= 5 ? 2 : score >= 3 ? 1 : 0;
  return { level, tips };
}

export function PasswordTool() {
  const [pw, setPw] = useState("");
  const { level, tips } = rate(pw);
  const labels = ["Weak", "OK", "Good", "Super strong"];
  const colours = ["bg-rose-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
  return (
    <ToolFrame title="Password strength tester" icon={<KeyRound className="size-4" />}>
      <p className="mb-2 text-sm font-semibold text-rose-700">Make up a pretend password. Never type your real one!</p>
      <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="e.g. PurpleTentPancake7!" className={inputClass} autoComplete="off" spellCheck={false} />
      {pw && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn("h-2 flex-1 rounded-full", i <= level ? colours[level] : "bg-zinc-200")} />
            ))}
          </div>
          <p className="font-black">{labels[level]}</p>
          {tips.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted">
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ToolFrame>
  );
}

// -------------------------------------------------------------- fact or opinion

const STATEMENTS: { text: string; fact: boolean; why: string }[] = [
  { text: "The Eiffel Tower is in Paris.", fact: true, why: "You can check this on a map." },
  { text: "Pizza is the best food in the world.", fact: false, why: "Lots of people would disagree!" },
  { text: "Water boils at 100°C at sea level.", fact: true, why: "Scientists have measured this." },
  { text: "This new game is the most fun game ever.", fact: false, why: "That's what someone thinks or feels." },
  { text: "There are 7 days in a week.", fact: true, why: "It's true everywhere and can be checked." },
  { text: "Everyone should wear this trainer brand.", fact: false, why: "Probably an advert's opinion…" },
  { text: "The UK has four countries in it.", fact: true, why: "England, Scotland, Wales and Northern Ireland." },
  { text: "Cats are better than dogs.", fact: false, why: "Dog fans would argue with that!" },
];

export function FactOpinionTool() {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const right = STATEMENTS.filter((s, i) => answers[i] === s.fact).length;
  const done = Object.keys(answers).length;
  return (
    <ToolFrame title="Fact or opinion?" icon={<Scale className="size-4" />}>
      <div className="space-y-2">
        {STATEMENTS.map((s, i) => {
          const a = answers[i];
          return (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-line">
              <p className="min-w-0 flex-1 font-semibold">{s.text}</p>
              {a === undefined ? (
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setAnswers({ ...answers, [i]: true })} className={buttonClass("secondary", "sm")}>
                    Fact
                  </button>
                  <button type="button" onClick={() => setAnswers({ ...answers, [i]: false })} className={buttonClass("secondary", "sm")}>
                    Opinion
                  </button>
                </div>
              ) : (
                <p className={cn("w-full text-sm font-bold sm:w-auto", a === s.fact ? "text-emerald-700" : "text-rose-600")}>
                  {a === s.fact ? "✓ Yes! " : "✗ Not quite. "}It&apos;s {s.fact ? "a fact" : "an opinion"}.{" "}
                  <span className="font-normal text-muted">{s.why}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
      {done === STATEMENTS.length && (
        <p className="mt-3 text-center font-black">
          You got {right} out of {STATEMENTS.length}! {right === STATEMENTS.length ? "🌟" : ""}
        </p>
      )}
    </ToolFrame>
  );
}

// ------------------------------------------------------------------ leaf guide

type LeafNode = { q: string; yes: LeafNode | string; no: LeafNode | string };

const LEAF_TREE: LeafNode = {
  q: "Is it a single leaf on its own?",
  yes: {
    q: "Does it have lobes (bumps) sticking out around the edge?",
    yes: { q: "Do the lobes spread out from one point?", yes: "Sycamore", no: "Oak" },
    no: { q: "Is it long and thin?", yes: "Willow", no: "Beech" },
  },
  no: {
    q: "Do the leaves spread out from one point?",
    yes: "Horse chestnut",
    no: { q: "Are there just a few leaves?", yes: "Elder", no: "Ash" },
  },
};

export function LeafGuideTool() {
  const [path, setPath] = useState<("yes" | "no")[]>([]);
  let node: LeafNode | string = LEAF_TREE;
  for (const step of path) node = (node as LeafNode)[step];
  return (
    <ToolFrame title="Leaf identification guide" icon={<Leaf className="size-4" />}>
      {typeof node === "string" ? (
        <div className="space-y-3 text-center">
          <div className="text-5xl">🍃</div>
          <p className="text-sm font-semibold text-muted">Your leaf is from a…</p>
          <p className="text-2xl font-black">{node} tree!</p>
          <button type="button" onClick={() => setPath([])} className={buttonClass("secondary", "sm")}>
            <RotateCcw className="size-4" /> Try another leaf
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted">Question {path.length + 1}</p>
          <p className="text-xl font-black">{node.q}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPath([...path, "yes"])} className={buttonClass("primary", "md", "flex-1")}>
              Yes
            </button>
            <button type="button" onClick={() => setPath([...path, "no"])} className={buttonClass("secondary", "md", "flex-1")}>
              No
            </button>
          </div>
          {path.length > 0 && (
            <button type="button" onClick={() => setPath(path.slice(0, -1))} className="text-sm font-bold text-muted hover:text-brand-600">
              ← Back
            </button>
          )}
        </div>
      )}
    </ToolFrame>
  );
}

// ---------------------------------------------------------------------- timer

export function TimerTool({ minutes }: { minutes: number }) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        setRunning(false);
        beep(300);
        window.setTimeout(() => beep(300), 400);
        window.setTimeout(() => beep(600), 800);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    endAt.current = Date.now() + (left || total) * 1000;
    if (!left) setLeft(total);
    setRunning(true);
  };
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <ToolFrame title={`${minutes} minute timer`} icon={<Timer className="size-4" />}>
      <div className="flex flex-wrap items-center gap-4">
        <div className={cn("font-mono text-5xl font-black tabular-nums", left === 0 && "animate-pulse text-emerald-600")}>
          {mm}:{ss}
        </div>
        <div className="flex gap-2">
          {running ? (
            <button type="button" onClick={() => setRunning(false)} className={buttonClass("secondary")}>
              <Pause className="size-4" /> Pause
            </button>
          ) : (
            <button type="button" onClick={start} className={buttonClass("primary")}>
              <Play className="size-4" /> {left === total ? "Start" : left === 0 ? "Again" : "Resume"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setLeft(total);
            }}
            className={buttonClass("ghost")}
          >
            <RotateCcw className="size-4" /> Reset
          </button>
        </div>
        {left === 0 && <p className="w-full font-bold text-emerald-700">Time&apos;s up! ⏰</p>}
      </div>
    </ToolFrame>
  );
}
