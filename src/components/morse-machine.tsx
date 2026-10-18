"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Play, Radio, RotateCcw, Space, Square, Undo2, Volume2, VolumeX } from "lucide-react";
import type { MachineSpeed, MorseMachineDef } from "@/content/types";
import { MORSE } from "@/lib/codes";
import {
  checkMessage,
  formatTime,
  heardText,
  lettersOf,
  machineSummary,
  morseOf,
  plannedWords,
  SPEEDS,
  type MachineCheck,
  type Press,
  type SentLetter,
} from "@/lib/morse-machine";
import { RichText } from "./rich-text";
import { keyTone, playMorse, type MorseEvent } from "./tools/audio";
import { MorseShapes } from "./tools/morse";
import { buttonClass, cn } from "./ui";

type Phase = "send" | "read" | "done";

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const say = new SpeechSynthesisUtterance(text);
    say.lang = "en-GB";
    say.rate = 0.95;
    synth.speak(say);
  } catch {}
}

function readBack(heard: string, check: MachineCheck | null) {
  const words = heard.replace(/\?/g, "").toLowerCase().trim();
  const unsure = heard.includes("?") ? " And some letters I couldn't read." : "";
  const verdict = !check ? "" : check.perfect ? " That's exactly right!" : check.passed ? " That's right!" : " Nearly! Have a look at the red letters.";
  return `I heard: ${words || "nothing I could read"}.${unsure}${verdict}`;
}

/**
 * A pretend Morse machine. They tap their message out on the key (mouse,
 * finger or space bar) and hear it as they go; the paper tape shows what the
 * machine is reading. When they've finished, it reads the message back,
 * checks every letter against the message they planned and helps with the
 * ones that went wrong. A good enough try fills in the step's answer.
 */
export function MorseMachine({
  def,
  planned,
  plannedStep,
  go,
  value,
  onFill,
  locked,
}: {
  def: MorseMachineDef;
  /** the message they planned to send ("" if they haven't written it yet) */
  planned: string;
  /** the step where they write it, to send them back there */
  plannedStep: number | null;
  go: (step: number) => void;
  /** what the machine filled in last time */
  value: string;
  onFill: (summary: string) => void;
  locked: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(value ? "done" : "send");
  const [speed, setSpeed] = useState<MachineSpeed>(def.speed ?? "medium");
  const [sound, setSound] = useState(true);
  const [hints, setHints] = useState(true);
  const [presses, setPresses] = useState<Press[]>([]);
  const [down, setDown] = useState(false);
  const [pressedAt, setPressedAt] = useState(0);
  const [releasedAt, setReleasedAt] = useState(0);
  const [now, setNow] = useState(0);
  /** the gap the next press gets, whatever the clock says (after "New word" or undo) */
  const [nextGap, setNextGap] = useState<Press["gap"] | null>(null);
  const [liveGap, setLiveGap] = useState<Press["gap"]>("none");
  const [check, setCheck] = useState<MachineCheck | null>(null);
  const [heardLetters, setHeardLetters] = useState<SentLetter[]>([]);
  const [tries, setTries] = useState(0);
  const [best, setBest] = useState<{ check: MachineCheck; letters: SentLetter[] } | null>(null);
  const [playing, setPlaying] = useState<MorseEvent | null>(null);
  /** how long their recent dots and dashes were, so the machine can get used to them */
  const [taps, setTaps] = useState<{ dots: number[]; dashes: number[] }>({ dots: [], dashes: [] });

  const isDown = useRef(false);
  const downAt = useRef(0);
  const firstDown = useRef(0);
  const lastUp = useRef(0);
  const tone = useRef<ReturnType<typeof keyTone> | null>(null);
  const stopPlay = useRef<(() => void) | null>(null);
  const tape = useRef<HTMLDivElement>(null);

  const sp = SPEEDS[speed];
  const words = useMemo(() => plannedWords(planned), [planned]);
  const flat = words.flat();
  const letters = useMemo(() => lettersOf(presses), [presses]);

  useEffect(
    () => () => {
      tone.current?.close();
      stopPlay.current?.();
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    },
    [],
  );

  // Keep the meters moving while a key is held, or a gap is still being timed.
  useEffect(() => {
    if (phase !== "send" || (!down && !presses.length)) return;
    let frame = 0;
    const tick = () => {
      const t = performance.now();
      setNow(t);
      if (isDown.current || t - lastUp.current < sp.wordGap + 150) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [down, presses, phase, sp.wordGap]);

  useEffect(() => {
    tape.current?.scrollTo({ top: tape.current.scrollHeight });
  }, [presses, down]);

  /** Dots vs dashes: starts from the speed setting, then settles on how this person taps. */
  const dashAt = () => {
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    if (taps.dots.length < 2 || taps.dashes.length < 2) return sp.dashAt;
    return Math.min(sp.dashAt * 1.6, Math.max(sp.dashAt * 0.6, Math.sqrt(avg(taps.dots) * avg(taps.dashes))));
  };

  const press = () => {
    if (locked || phase !== "send" || isDown.current) return;
    stopPlay.current?.();
    const t = performance.now();
    isDown.current = true;
    downAt.current = t;
    if (!presses.length) firstDown.current = t;
    const since = t - lastUp.current;
    const gap: Press["gap"] = !presses.length ? "none" : nextGap ?? (since >= sp.wordGap ? "word" : since >= sp.letterGap ? "letter" : "none");
    setLiveGap(gap);
    setPressedAt(t);
    setNow(t);
    setDown(true);
    if (sound) {
      tone.current ??= keyTone();
      tone.current.down();
    }
  };

  const release = () => {
    if (!isDown.current) return;
    isDown.current = false;
    tone.current?.up();
    setDown(false);
    const t = performance.now();
    const ms = t - downAt.current;
    if (ms < 15) return;
    const sym = ms >= dashAt() ? "-" : ".";
    setTaps(sym === "." ? { ...taps, dots: [...taps.dots.slice(-5), ms] } : { ...taps, dashes: [...taps.dashes.slice(-5), ms] });
    lastUp.current = t;
    setReleasedAt(t);
    setNow(t);
    setNextGap(null);
    setPresses([...presses, { sym, gap: presses.length ? liveGap : "none", ms: Math.round(ms) }]);
  };

  // Let go if the window loses focus mid-press, so the tone never gets stuck on.
  const releaseRef = useRef(release);
  useEffect(() => {
    releaseRef.current = release;
  });
  useEffect(() => {
    const onBlur = () => releaseRef.current();
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const undo = () => {
    if (!presses.length) return;
    let start = presses.length - 1;
    while (start > 0 && presses[start].gap === "none") start--;
    const removed = presses[start].gap;
    setPresses(presses.slice(0, start));
    setNextGap(start === 0 ? null : removed === "none" ? "letter" : removed);
  };

  const restart = () => {
    stopPlay.current?.();
    setPresses([]);
    setNextGap(null);
    setCheck(null);
    setPhase("send");
  };

  const changeSpeed = (s: MachineSpeed) => {
    setSpeed(s);
    setTaps({ dots: [], dashes: [] });
  };

  const finish = () => {
    if (!letters.length) return;
    const seconds = (lastUp.current - firstDown.current) / 1000;
    const result = flat.length ? checkMessage({ planned, letters, seconds, minWpm: def.minWpm }) : null;
    setHeardLetters(letters);
    setCheck(result);
    setPhase("read");
    if (result) {
      setTries((n) => n + 1);
      if (!best || result.right > best.check.right) setBest({ check: result, letters });
      if (result.passed) onFill(machineSummary(result, letters));
    }
    if (sound) speak(readBack(heardText(letters), result));
  };

  const keepBest = () => {
    if (!best) return;
    onFill(machineSummary(best.check, best.letters, { best: tries }));
    setPhase("done");
  };

  const playBack = (list: SentLetter[]) => {
    stopPlay.current?.();
    const unit = taps.dots.length ? taps.dots.reduce((a, b) => a + b, 0) / taps.dots.length : 120;
    stopPlay.current = playMorse(morseOf(list), setPlaying, Math.min(200, Math.max(70, unit)));
  };

  // ---------------------------------------------------------------- derived

  const holdMs = down ? Math.max(0, now - pressedAt) : 0;
  const gapMs = !down && presses.length ? Math.max(0, now - releasedAt) : 0;
  const threshold = dashAt();
  const trailing: Press["gap"] = down || !presses.length ? "none" : nextGap ?? (gapMs >= sp.wordGap ? "word" : gapMs >= sp.letterGap ? "letter" : "none");
  const shown = down ? lettersOf([...presses, { sym: holdMs >= threshold ? "-" : ".", gap: presses.length ? liveGap : "none", ms: holdMs }]) : letters;
  const building = down || (presses.length > 0 && trailing === "none");
  const pointer = building ? shown.length - 1 : shown.length;
  const lampOn = down || Boolean(playing?.on);

  if (phase === "done" || (locked && value)) {
    const [heardLine, resultLine] = value.split("\n");
    return (
      <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
        <p className="flex items-center gap-2 font-extrabold text-emerald-900">
          <CheckCircle2 className="size-5" /> Sent on the Morse machine
        </p>
        <p className="mt-1 text-lg font-black tracking-wide text-emerald-950">{heardLine?.replace(/^Heard: /, "")}</p>
        {resultLine && <p className="text-sm text-emerald-900">{resultLine}</p>}
        {!locked && (
          <button type="button" onClick={restart} className={buttonClass("secondary", "sm", "mt-3")}>
            <RotateCcw className="size-4" /> Send it again
          </button>
        )}
      </div>
    );
  }
  if (locked) return null;

  return (
    <div className="space-y-4" data-tour="morse-machine">
      {/* The message they planned, big enough to read while they tap. */}
      {flat.length > 0 ? (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-widest text-amber-800">Your message</p>
            <button
              type="button"
              onClick={() => setHints((h) => !h)}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline"
            >
              {hints ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              {hints ? "Hide the dots and dashes (harder!)" : "Show the dots and dashes"}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {words.map((word, wi) => {
              const offset = words.slice(0, wi).flat().length;
              return (
                <span key={wi} className="flex flex-wrap gap-0.5 rounded-xl bg-white/70 p-1 ring-1 ring-amber-200">
                  {word.map((ch, ci) => {
                    const at = offset + ci;
                    return (
                      <span
                        key={ci}
                        className={cn(
                          "flex min-w-9 flex-col items-center gap-1.5 rounded-lg px-1.5 py-1 transition",
                          phase === "send" && at === pointer && "bg-white ring-2 ring-amber-400",
                          phase === "send" && at < pointer && "opacity-40",
                        )}
                      >
                        <span className="text-2xl font-black leading-none">{ch}</span>
                        {hints && <MorseShapes code={MORSE[ch]} />}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p>
            <b>Write your message first</b>, then come back and send it here. You can still have a practice on the machine.
          </p>
          {plannedStep !== null && (
            <button type="button" onClick={() => go(plannedStep)} className={buttonClass("secondary", "sm", "mt-2")}>
              <ArrowLeft className="size-4" /> Go to step {plannedStep + 1}
            </button>
          )}
        </div>
      )}

      {/* The machine. */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-800 to-zinc-900 text-white shadow-card ring-1 ring-black/20">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <Radio className="size-5 text-amber-300" />
          <p className="font-extrabold">Morse machine</p>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-white/10 p-0.5" role="radiogroup" aria-label="Machine speed">
            {(Object.keys(SPEEDS) as MachineSpeed[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={speed === s}
                onClick={() => changeSpeed(s)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold transition",
                  speed === s ? "bg-amber-300 text-zinc-900" : "text-white/80 hover:bg-white/10",
                )}
              >
                {SPEEDS[s].emoji} {SPEEDS[s].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSound((v) => !v)}
            className="grid size-8 place-items-center rounded-full text-white/80 hover:bg-white/10"
            aria-label={sound ? "Turn the sound off" : "Turn the sound on"}
          >
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
        </div>

        {phase === "send" && (
          <div className="space-y-4 p-4">
            {/* Paper tape: what the machine is reading, letter by letter. */}
            <div
              ref={tape}
              className="max-h-44 min-h-[5.5rem] overflow-y-auto rounded-xl bg-[#fbf6e9] px-3 py-2.5 text-ink shadow-inner ring-1 ring-amber-900/20"
              aria-live="polite"
              aria-label="What the machine has read so far"
            >
              {shown.length === 0 ? (
                <p className="py-5 text-center text-sm text-zinc-500">The machine is listening… press the key to start.</p>
              ) : (
                <div className="flex flex-wrap items-end gap-x-2 gap-y-3">
                  {shown.map((l, i) => {
                    const live = building && i === shown.length - 1;
                    return (
                      <Fragment key={i}>
                        {i > 0 && l.word !== shown[i - 1].word && <span className="w-4 self-stretch border-b-2 border-dashed border-zinc-300" aria-label="space" />}
                        <span className={cn("flex min-w-7 flex-col items-center gap-1.5 rounded-md px-1 py-0.5", live && "bg-amber-100")}>
                          <span className={cn("text-lg font-black leading-none", live ? "text-zinc-400" : l.ch ? "text-ink" : "text-rose-600")}>
                            {l.ch ?? (live ? "…" : "?")}
                          </span>
                          <MorseShapes code={l.code} active={down && i === shown.length - 1 ? l.code.length - 1 : null} />
                        </span>
                      </Fragment>
                    );
                  })}
                  {!down && trailing === "word" && <span className="w-4 self-stretch border-b-2 border-dashed border-amber-400" aria-label="new word" />}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5">
              <span
                aria-hidden
                className={cn(
                  "size-10 shrink-0 rounded-full ring-4 transition-colors duration-75",
                  lampOn ? "bg-amber-300 shadow-[0_0_28px_10px_rgba(252,211,77,0.75)] ring-amber-200" : "bg-zinc-600 ring-zinc-700",
                )}
              />
              <button
                type="button"
                onPointerDown={(e) => {
                  if (e.pointerType === "mouse" && e.button !== 0) return;
                  e.preventDefault();
                  e.currentTarget.focus();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  press();
                }}
                onPointerUp={release}
                onPointerCancel={release}
                onLostPointerCapture={release}
                onKeyDown={(e) => {
                  if (e.key !== " " && e.key !== "Enter") return;
                  e.preventDefault();
                  if (!e.repeat) press();
                }}
                onKeyUp={(e) => {
                  if (e.key !== " " && e.key !== "Enter") return;
                  e.preventDefault();
                  release();
                }}
                onBlur={release}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: "none" }}
                className={cn(
                  "relative grid size-32 shrink-0 select-none place-items-center rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 text-amber-950 transition-transform duration-75",
                  "focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-200",
                  down ? "translate-y-1 shadow-[0_2px_0_#78350f]" : "shadow-[0_8px_0_#78350f] hover:brightness-105",
                )}
                aria-label="Morse key: press and hold. A quick tap is a dot, a longer press is a dash."
              >
                <span className="pointer-events-none flex flex-col items-center gap-1">
                  <span className="text-sm font-black uppercase tracking-wider">{down ? (holdMs >= threshold ? "Dash" : "Dot") : "Press"}</span>
                  {down ? (
                    <span className={cn("rounded-full bg-amber-950", holdMs >= threshold ? "h-3 w-10" : "size-3")} />
                  ) : (
                    <span className="text-[11px] font-bold opacity-80">and hold</span>
                  )}
                </span>
              </button>
              <div className="flex flex-wrap justify-center gap-1.5 sm:flex-col">
                <button type="button" onClick={undo} disabled={!presses.length} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white/90 hover:bg-white/10 disabled:opacity-40">
                  <Undo2 className="size-4" /> Undo letter
                </button>
                <button
                  type="button"
                  onClick={() => setNextGap("word")}
                  disabled={!presses.length || trailing === "word"}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white/90 hover:bg-white/10 disabled:opacity-40"
                >
                  <Space className="size-4" /> New word
                </button>
                <button type="button" onClick={restart} disabled={!presses.length} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white/90 hover:bg-white/10 disabled:opacity-40">
                  <RotateCcw className="size-4" /> Start again
                </button>
              </div>
            </div>

            {/* How long they've held the key, or how long since they let go. */}
            <div className="mx-auto max-w-sm" aria-hidden>
              {down ? (
                <Meter fill={Math.min(holdMs / (threshold * 1.6), 1)} marks={[{ at: 1 / 1.6, label: "dash" }]} start="dot" />
              ) : presses.length ? (
                <Meter fill={Math.min(gapMs / sp.wordGap, 1)} marks={[{ at: sp.letterGap / sp.wordGap, label: "next letter" }, { at: 1, label: "new word" }]} start="same letter" />
              ) : (
                <p className="text-center text-xs text-white/70">Click or tap the key, or use the space bar. Quick tap = dot · longer press = dash</p>
              )}
            </div>

            <div className="flex justify-center">
              <button type="button" onClick={finish} disabled={!presses.length || down} className={buttonClass("success", "lg")}>
                <CheckCircle2 className="size-5" /> I&apos;ve finished: read it back
              </button>
            </div>
          </div>
        )}

        {phase === "read" && (
          <ReadBack
            letters={heardLetters}
            check={check}
            words={words}
            minWpm={def.minWpm}
            playing={playing}
            onPlay={() => playBack(heardLetters)}
            onStop={() => stopPlay.current?.()}
            onSpeak={() => speak(readBack(heardText(heardLetters), check))}
            tries={tries}
            onAgain={restart}
            onKeepBest={best && !check?.passed && tries >= 3 ? keepBest : undefined}
          />
        )}
      </div>
    </div>
  );
}

function Meter({ fill, marks, start }: { fill: number; marks: { at: number; label: string }[]; start: string }) {
  return (
    <div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-amber-300" style={{ width: `${fill * 100}%` }} />
        {marks.map((m) => (
          <span key={m.label} className="absolute top-0 h-full w-0.5 bg-white/60" style={{ left: `calc(${m.at * 100}% - 1px)` }} />
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[11px] font-bold text-white/70">
        <span className="absolute left-0">{start}</span>
        {marks.map((m) => (
          <span key={m.label} className="absolute -translate-x-full whitespace-nowrap" style={{ left: `${m.at * 100}%` }}>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReadBack({
  letters,
  check,
  words,
  minWpm,
  playing,
  onPlay,
  onStop,
  onSpeak,
  tries,
  onAgain,
  onKeepBest,
}: {
  letters: SentLetter[];
  check: MachineCheck | null;
  words: string[][];
  minWpm?: number;
  playing: MorseEvent | null;
  onPlay: () => void;
  onStop: () => void;
  onSpeak: () => void;
  tries: number;
  onAgain: () => void;
  onKeepBest?: () => void;
}) {
  const heard = heardText(letters);
  const wordStarts = new Set(words.map((_, wi) => words.slice(0, wi).flat().length).filter((n) => n > 0));
  const wrong = check?.results.filter((r) => r.kind === "wrong").slice(0, 4) ?? [];

  return (
    <div className="space-y-4 bg-[#fbf6e9] p-4 text-ink">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-amber-800">The machine heard</p>
        <p className="mt-1 break-words text-3xl font-black tracking-wide">{heard}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={onSpeak} className={buttonClass("secondary", "sm")}>
            <Volume2 className="size-4" /> Read it out
          </button>
          {playing ? (
            <button type="button" onClick={onStop} className={buttonClass("secondary", "sm")}>
              <Square className="size-4" /> Stop
            </button>
          ) : (
            <button type="button" onClick={onPlay} className={buttonClass("secondary", "sm")}>
              <Play className="size-4" /> Play my Morse
            </button>
          )}
        </div>
      </div>

      {check ? (
        <>
          <div>
            <p className="mb-1.5 text-xs font-black uppercase tracking-widest text-amber-800">Letter by letter</p>
            <div className="flex flex-wrap items-start gap-1.5">
              {check.results.map((r, i) => (
                <Fragment key={i}>
                  {r.kind !== "extra" && wordStarts.has(r.at) && <span className="w-3" />}
                  <span
                    className={cn(
                      "flex min-w-9 flex-col items-center rounded-lg px-1.5 py-1 text-center",
                      r.kind === "right" && "bg-emerald-100 text-emerald-900",
                      r.kind === "wrong" && "bg-rose-100 text-rose-900 ring-1 ring-rose-300",
                      r.kind === "missed" && "border border-dashed border-zinc-400 text-zinc-500",
                      r.kind === "extra" && "bg-amber-100 text-amber-900",
                    )}
                    title={r.kind === "wrong" ? `Heard ${r.heard ?? "?"}` : r.kind}
                  >
                    <span className="text-lg font-black leading-tight">{r.kind === "extra" ? `+${r.heard ?? "?"}` : r.want}</span>
                    <span className="text-[10px] font-bold leading-tight">
                      {r.kind === "right" ? "✓" : r.kind === "wrong" ? `heard ${r.heard ?? "?"}` : r.kind === "missed" ? "missed" : "extra"}
                    </span>
                  </span>
                </Fragment>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl p-3 ring-1",
              check.passed ? "bg-emerald-50 text-emerald-950 ring-emerald-200" : "bg-amber-50 text-amber-950 ring-amber-200",
            )}
          >
            <p className="font-extrabold">
              {check.perfect
                ? "🎉 Perfect! Every letter was right."
                : check.passed
                  ? `✅ Brilliant! The machine understood your message (${check.right} of ${check.total} letters right).`
                  : `Nearly! ${check.right} of ${check.total} letters right. Have a look at the tips, then try again.`}
            </p>
            <p className="mt-0.5 text-sm">
              Sent in {formatTime(check.seconds)} · about {check.wpm} words a minute{minWpm ? ` (aim for about ${minWpm})` : ""}
            </p>
            {check.passed && <p className="mt-1 text-sm font-semibold">That&apos;s this step done. Carry on to the next one!</p>}
          </div>

          {(wrong.length > 0 || check.tips.length > 0) && (
            <div className="space-y-2 text-[15px]">
              <p className="text-xs font-black uppercase tracking-widest text-amber-800">Tips from the machine</p>
              <ul className="space-y-1.5">
                {wrong.map(
                  (r, i) =>
                    r.kind === "wrong" && (
                      <li key={`w${i}`} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <b>{r.want}</b> is <MorseShapes code={MORSE[r.want]} /> but the machine heard <MorseShapes code={r.sent} />
                        <span className="text-sm text-muted">{r.heard ? `(that's ${r.heard})` : "(that's not a letter)"}</span>
                      </li>
                    ),
                )}
                {check.tips.map((tip) => (
                  <li key={tip}>
                    💡 <RichText text={tip} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">Write your message first, and the machine will check every letter for you.</p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-amber-900/10 pt-3">
        <button type="button" onClick={onAgain} className={buttonClass(check?.passed ? "secondary" : "primary", "md")}>
          <RotateCcw className="size-4" /> {check?.passed ? "Send it again" : "Try again"}
        </button>
        {onKeepBest && (
          <button type="button" onClick={onKeepBest} className={buttonClass("secondary", "md")}>
            Keep my best try and carry on
          </button>
        )}
      </div>
      {onKeepBest && (
        <p className="text-xs text-muted">
          That&apos;s {tries} tries. You can keep your best one and a leader will take a look, or ask for help.
        </p>
      )}
    </div>
  );
}
