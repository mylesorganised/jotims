"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, Play, Radio, Square } from "lucide-react";
import { CHARACTERS, fromMorse, MORSE, toMorse } from "@/lib/codes";
import { buttonClass, cn, inputClass } from "../ui";
import { playMorse, type MorseEvent } from "./audio";
import { ToolFrame } from "./tool-frame";

/** Dots and dashes drawn as shapes, which young readers find easier than . and - */
export function MorseShapes({ code, active, offset = 0 }: { code: string; active?: number | null; offset?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[...code].map((ch, i) =>
        ch === "." ? (
          <span key={i} className={cn("size-2.5 rounded-full", active === offset + i ? "bg-amber-400 ring-4 ring-amber-200" : "bg-ink")} />
        ) : ch === "-" ? (
          <span key={i} className={cn("h-2.5 w-6 rounded-full", active === offset + i ? "bg-amber-400 ring-4 ring-amber-200" : "bg-ink")} />
        ) : null,
      )}
    </span>
  );
}

function usePlayer() {
  const [event, setEvent] = useState<MorseEvent | null>(null);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);
  const play = (morse: string) => {
    stopRef.current?.();
    setPlaying(true);
    stopRef.current = playMorse(morse, (e) => {
      setEvent(e);
      if (e === null) setPlaying(false);
    });
  };
  const stop = () => {
    stopRef.current?.();
    setPlaying(false);
  };
  return { event, playing, play, stop };
}

function Chart() {
  const { event, play } = usePlayer();
  const [current, setCurrent] = useState<string | null>(null);
  return (
    <div>
      <p className="mb-3 text-sm text-muted">Tap a letter to hear it. A dot is short, a dash is long.</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {CHARACTERS.map((letter) => [letter, MORSE[letter]] as const).map(([letter, code]) => (
          <button
            key={letter}
            type="button"
            onClick={() => {
              setCurrent(letter);
              play(code);
            }}
            className={cn(
              "flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-left transition",
              current === letter && event ? "ring-2 ring-amber-400" : "ring-1 ring-line hover:ring-brand-300",
            )}
          >
            <span className="w-5 text-lg font-black">{letter}</span>
            <MorseShapes code={code} active={current === letter && event?.on ? event.index : null} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Splits text into words of letters, each with where its code starts in toMorse(text). */
function layout(text: string) {
  let offset = 0;
  return text
    .toUpperCase()
    .split(/\s+/)
    .map((word) => [...word].filter((ch) => MORSE[ch]))
    .filter((letters) => letters.length)
    .map((letters) =>
      letters.map((ch, i) => {
        const item = { ch, code: MORSE[ch], start: offset };
        offset += MORSE[ch].length + (i === letters.length - 1 ? 3 : 1); // " " between letters, " / " between words
        return item;
      }),
    );
}

function Translate() {
  const [text, setText] = useState("");
  const { event, playing, play, stop } = usePlayer();
  const morse = toMorse(text);
  return (
    <div className="space-y-3">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message, e.g. HELLO" className={inputClass} />
      {morse && (
        <>
          <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl bg-white p-3 ring-1 ring-line">
            {layout(text).map((word, wi) => (
              <span key={wi} className="flex flex-wrap gap-x-3 gap-y-2">
                {word.map(({ ch, code, start }, ci) => (
                  <span key={ci} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black text-muted">{ch}</span>
                    <MorseShapes code={code} active={event?.on ? event.index : null} offset={start} />
                  </span>
                ))}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <code className="prose-code flex-1 py-1.5 text-base">{morse}</code>
            {playing ? (
              <button type="button" onClick={stop} className={buttonClass("secondary", "sm")}>
                <Square className="size-4" /> Stop
              </button>
            ) : (
              <button type="button" onClick={() => play(morse)} className={buttonClass("primary", "sm")}>
                <Play className="size-4" /> Play &amp; flash
              </button>
            )}
            <span
              aria-hidden
              className={cn(
                "grid size-10 place-items-center rounded-full transition",
                event?.on ? "bg-amber-300 shadow-[0_0_24px_8px_rgba(252,211,77,0.8)]" : "bg-zinc-200",
              )}
            >
              <Lightbulb className={cn("size-5", event?.on ? "text-amber-700" : "text-zinc-400")} />
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Decode() {
  const [code, setCode] = useState("");
  const text = code.trim() ? fromMorse(code) : "";
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Type dots and dashes. Put a space between letters and a / between words.
      </p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder=".... . .-.. .-.. ---"
        className={cn(inputClass, "font-mono tracking-wider")}
      />
      {text && (
        <div className="rounded-xl bg-white p-3 text-xl font-black tracking-wide ring-1 ring-line">
          {text}
          {text.includes("?") && <span className="ml-2 text-sm font-semibold text-muted">(? = I don&apos;t know that one)</span>}
        </div>
      )}
    </div>
  );
}

export function MorseTool() {
  return (
    <ToolFrame
      title="Morse code"
      icon={<Radio className="size-4" />}
      tabs={[
        { id: "chart", label: "Chart", content: <Chart /> },
        { id: "translate", label: "Text → Morse", content: <Translate /> },
        { id: "decode", label: "Morse → text", content: <Decode /> },
      ]}
    />
  );
}
