"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { CHARACTERS, PHONETIC, toPhonetic } from "@/lib/codes";
import { inputClass } from "../ui";
import { ToolFrame } from "./tool-frame";

function say(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function Chart() {
  return (
    <div>
      <p className="mb-3 text-sm text-muted">Tap a word to hear it.</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {CHARACTERS.map((k) => [k, PHONETIC[k]] as const).map(([k, word]) => (
          <button
            key={k}
            type="button"
            onClick={() => say(word)}
            className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-line transition hover:ring-brand-300"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-brand-500 text-sm font-black text-white">{k}</span>
            <span className="font-bold">{word}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Convert() {
  const [text, setText] = useState("");
  const out = toPhonetic(text);
  return (
    <div className="space-y-3">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message, e.g. PG SCOUTS" className={inputClass} />
      {out && (
        <div className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-line">
          <p className="flex-1 text-lg font-bold leading-relaxed">{out}</p>
          <button
            type="button"
            onClick={() => say(out.replace(/ – /g, ". "))}
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100"
            aria-label="Read it out"
          >
            <Volume2 className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function PhoneticTool() {
  return (
    <ToolFrame
      title="Phonetic alphabet"
      icon={<Volume2 className="size-4" />}
      tabs={[
        { id: "chart", label: "Chart", content: <Chart /> },
        { id: "convert", label: "Converter", content: <Convert /> },
      ]}
    />
  );
}
