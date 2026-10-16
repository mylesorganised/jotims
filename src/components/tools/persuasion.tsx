"use client";

import { useMemo, useState } from "react";
import { CircleCheck, CircleX, MousePointerClick, RotateCcw } from "lucide-react";
import { buttonClass, cn } from "../ui";
import { ToolFrame } from "./tool-frame";

// Based on the Scouts "digital persuasion" resource cards.
const CARDS = [
  { term: "Autoplay", what: "The next video plays automatically without you pressing play.", effect: "You're more likely to keep watching." },
  { term: "Clickbait", what: "Something online made to grab your attention and make you click, like a dramatic headline.", effect: "It pulls you in and makes you want to find out more." },
  { term: "Push notifications", what: "An alert from an app on your device telling you to open it right now.", effect: "It reminds you of a game and tempts you back, sometimes with a reward for opening it now." },
  { term: "Pop-ups", what: "Something that suddenly appears on your screen, like an advert in a box, trying to get you to click.", effect: "It grabs your attention, and can be hard to get rid of." },
  { term: "Typing bubble", what: "A sign in an app or game that someone is typing a message, like “Amy is typing…”.", effect: "It creates suspense, so you wait to see the message." },
  { term: "Red notification badge", what: "A red circle with a number on it, next to an app, showing you have notifications.", effect: "Red catches your eye and feels urgent, so you feel you have to open it." },
  { term: "Time-limited discounts", what: "Something online tells you a sale is only on for a short time.", effect: "It pushes you to buy right away so you don't miss out." },
  { term: "Streaks", what: "An app counts how many days in a row you've done something, or rewards you for it.", effect: "You keep opening the app so you don't break the streak." },
  { term: "Save points", what: "You can only save your game when you reach a certain point, not any time.", effect: "You keep playing so you don't lose your progress." },
  { term: "Loot boxes", what: "A mystery bundle of items in a game that you can win or buy with real money.", effect: "Not knowing what's inside is exciting, so you want to open more." },
];

/** Same "random" order on server and client, so nothing jumps on load. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PersuasionTool() {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [game, setGame] = useState(1);

  const order = useMemo(() => seededShuffle(CARDS.map((_, i) => i), game * 7), [game]);
  const finished = round >= CARDS.length;
  const card = CARDS[order[Math.min(round, CARDS.length - 1)]];
  const choices = useMemo(() => {
    const correct = order[Math.min(round, CARDS.length - 1)];
    const others = seededShuffle(
      CARDS.map((_, i) => i).filter((i) => i !== correct),
      round * 13 + game,
    ).slice(0, 2);
    return seededShuffle([correct, ...others], round + game * 3);
  }, [order, round, game]);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (CARDS[i] === card) setScore((s) => s + 1);
  };

  return (
    <ToolFrame title="Digital persuasion game" icon={<MousePointerClick className="size-4" />}>
      {finished ? (
        <div className="space-y-4 text-center">
          <div className="text-5xl">{score >= 8 ? "🏆" : score >= 5 ? "🎉" : "💪"}</div>
          <p className="text-xl font-black">
            You matched {score} out of {CARDS.length}!
          </p>
          <p className="text-sm text-muted">Which of these tricks have you noticed in apps and games you use?</p>
          <button
            type="button"
            className={buttonClass("secondary", "sm")}
            onClick={() => {
              setGame((g) => g + 1);
              setRound(0);
              setScore(0);
              setPicked(null);
            }}
          >
            <RotateCcw className="size-4" /> Play again
          </button>
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-bold text-brand-700">See all the cards</summary>
            <ul className="mt-2 space-y-2">
              {CARDS.map((c) => (
                <li key={c.term} className="rounded-xl bg-white p-3 text-sm ring-1 ring-line">
                  <b>{c.term}:</b> {c.what} <span className="text-muted">{c.effect}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>
              Card {round + 1} of {CARDS.length}
            </span>
            <span>Score: {score}</span>
          </div>
          <p className="text-sm font-semibold text-muted">What is…</p>
          <p className="text-2xl font-black">{card.term}?</p>
          <div className="space-y-2">
            {choices.map((i) => {
              const isRight = CARDS[i] === card;
              const show = picked !== null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-xl bg-white p-3 text-left text-[15px] ring-1 ring-line transition",
                    !show && "hover:ring-brand-300",
                    show && isRight && "bg-emerald-50 ring-2 ring-emerald-400",
                    show && picked === i && !isRight && "bg-rose-50 ring-2 ring-rose-300",
                  )}
                >
                  {show && isRight && <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />}
                  {show && picked === i && !isRight && <CircleX className="mt-0.5 size-5 shrink-0 text-rose-500" />}
                  <span>{CARDS[i].what}</span>
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="animate-fade-up rounded-xl bg-amber-50 p-3 text-[15px] text-amber-900 ring-1 ring-amber-200">
              <b>How it persuades you:</b> {card.effect}
            </div>
          )}
          {picked !== null && (
            <button
              type="button"
              className={buttonClass("primary", "sm")}
              onClick={() => {
                setRound((r) => r + 1);
                setPicked(null);
              }}
            >
              {round + 1 === CARDS.length ? "See my score" : "Next card"}
            </button>
          )}
        </div>
      )}
    </ToolFrame>
  );
}
