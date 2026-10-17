"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/components/ui";

/** A ready-made message they can copy and paste into the chat. */
export function CopyMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-left text-[15px] ring-1 ring-line transition hover:ring-brand-300",
        copied && "ring-2 ring-emerald-400",
      )}
    >
      <span className="min-w-0 flex-1">{text}</span>
      <span className={cn("mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-bold", copied ? "text-emerald-600" : "text-brand-600")}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied!" : "Copy"}
      </span>
    </button>
  );
}

/**
 * "How old are you?" The JOTA-JOTI chat is for 13 and over, so younger
 * children get the "a leader logs in with you" route instead of sign-up steps.
 */
export function AgePath({ initial, older, younger }: { initial: "older" | "younger" | null; older: ReactNode; younger: ReactNode }) {
  const [age, setAge] = useState(initial);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-line" data-tour="chat-age">
        <span className="px-1 font-bold">How old are you?</span>
        {(
          [
            ["younger", "12 or younger"],
            ["older", "13 or older"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAge(id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold ring-1 transition",
              age === id ? "bg-brand-500 text-white ring-brand-500" : "bg-white ring-line hover:bg-brand-50",
            )}
            aria-pressed={age === id}
          >
            {label}
          </button>
        ))}
      </div>
      {age === "older" && older}
      {age === "younger" && younger}
      {age === null && <p className="px-1 text-muted">Pick one and we&apos;ll show you how to get in. 👆</p>}
    </div>
  );
}
