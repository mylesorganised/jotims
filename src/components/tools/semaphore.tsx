"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { SEMAPHORE } from "@/lib/codes";
import { inputClass } from "../ui";
import { ToolFrame } from "./tool-frame";

const LEFT = new Set([7.5, 9, 10.5]);
const RIGHT = new Set([1.5, 3, 4.5]);
const SHOULDER = { L: { x: 41, y: 40 }, R: { x: 59, y: 40 } };
const ARM = 30;

function dir(clock: number) {
  const rad = ((clock % 12) * 30 * Math.PI) / 180;
  return { x: Math.sin(rad), y: -Math.cos(rad), deg: (clock % 12) * 30 };
}

/** Which shoulder holds each flag; flags on the same side cross the body. */
function assignArms([a, b]: [number, number]) {
  const side = (h: number) => (LEFT.has(h) ? "L" : RIGHT.has(h) ? "R" : "C");
  const sa = side(a);
  const sb = side(b);
  if (sa !== "C" && sb !== "C" && sa === sb) return [{ h: a, s: sa }, { h: b, s: sa === "L" ? "R" : "L" }] as const;
  if (sa === "C" && sb === "C") return [{ h: a, s: "L" }, { h: b, s: "R" }] as const;
  if (sa === "C") return [{ h: b, s: sb }, { h: a, s: sb === "L" ? "R" : "L" }] as const;
  if (sb === "C") return [{ h: a, s: sa }, { h: b, s: sa === "L" ? "R" : "L" }] as const;
  return [{ h: a, s: sa }, { h: b, s: sb }] as const;
}

export function SemaphoreFigure({ letter, size = 72 }: { letter: string; size?: number }) {
  const pos = SEMAPHORE[letter] ?? ([6, 6] as [number, number]);
  const arms = assignArms(pos);
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} role="img" aria-label={`Semaphore ${letter}`}>
      <circle cx="50" cy="22" r="9" fill="#f2c9a0" />
      <path d="M41 13 q9 -7 18 0 v3 h-18z" fill="#1e3a8a" />
      <rect x="40" y="33" width="20" height="40" rx="7" fill="#3b82f6" />
      <path d="M44 72 l-3 38 M56 72 l3 38" stroke="#1e40af" strokeWidth="6" strokeLinecap="round" />
      {arms.map(({ h, s }, i) => {
        const sh = SHOULDER[s as "L" | "R"];
        const d = dir(h);
        const end = { x: sh.x + d.x * ARM, y: sh.y + d.y * ARM };
        const flag = { x: end.x + d.x * 7, y: end.y + d.y * 7 };
        return (
          <g key={i}>
            <line x1={sh.x} y1={sh.y} x2={end.x} y2={end.y} stroke="#2563eb" strokeWidth="5.5" strokeLinecap="round" />
            <g transform={`translate(${flag.x} ${flag.y}) rotate(${d.deg + 45})`}>
              <rect x="-7" y="-7" width="14" height="14" fill="#facc15" stroke="#b45309" strokeWidth="0.6" />
              <path d="M-7 -7 L7 -7 L7 7 Z" fill="#ef4444" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function Chart() {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
      {Object.keys(SEMAPHORE).map((letter) => (
        <div key={letter} className="flex flex-col items-center rounded-xl bg-white pb-1.5 pt-1 ring-1 ring-line">
          <SemaphoreFigure letter={letter} size={58} />
          <span className="text-sm font-black">{letter}</span>
        </div>
      ))}
    </div>
  );
}

function Convert() {
  const [text, setText] = useState("");
  const words = text
    .toUpperCase()
    .split(/\s+/)
    .map((w) => [...w].filter((c) => SEMAPHORE[c]))
    .filter((w) => w.length);
  return (
    <div className="space-y-3">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a word, e.g. CUBS" className={inputClass} />
      {words.length > 0 && (
        <div className="space-y-3">
          {words.map((w, wi) => (
            <div key={wi} className="flex flex-wrap gap-1.5">
              {w.map((letter, i) => (
                <div key={i} className="flex flex-col items-center rounded-xl bg-white pb-1.5 pt-1 ring-1 ring-line">
                  <SemaphoreFigure letter={letter} size={64} />
                  <span className="text-sm font-black">{letter}</span>
                </div>
              ))}
            </div>
          ))}
          <p className="text-xs text-muted">The pictures show what the people watching you will see.</p>
        </div>
      )}
    </div>
  );
}

export function SemaphoreTool() {
  return (
    <ToolFrame
      title="Semaphore"
      icon={<Flag className="size-4" />}
      tabs={[
        { id: "chart", label: "Chart", content: <Chart /> },
        { id: "convert", label: "Word → flags", content: <Convert /> },
      ]}
    />
  );
}
