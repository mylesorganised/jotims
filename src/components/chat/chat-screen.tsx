"use client";

import { useState, type ReactNode } from "react";
import {
  AtSign,
  Bold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code,
  Hash,
  Home,
  Info,
  Italic,
  ListFilter,
  Mic,
  MoreVertical,
  Paperclip,
  Pin,
  Plus,
  Search,
  Smile,
  Strikethrough,
  Users,
  Video,
} from "lucide-react";
import { CHAT_SCREEN, type HotspotId } from "@/content/chat";
import { cn } from "@/components/ui";

const ORDER = (Object.keys(CHAT_SCREEN) as HotspotId[]).sort((a, b) => CHAT_SCREEN[a].n - CHAT_SCREEN[b].n);

const SAMPLE = [
  { who: "1st Ottawa Scouts", letter: "1", color: "bg-violet-600", time: "12:11 PM", text: "Hi everyone, hello from Canada! 🇨🇦" },
  { who: "Nairobi Rovers", letter: "N", color: "bg-emerald-600", time: "12:11 PM", text: "Jambo! Greetings from Kenya 🇰🇪 What badges are you all doing?" },
  { who: "Troop 22 Manila", letter: "T", color: "bg-amber-600", time: "12:12 PM", text: "We're doing our communicator badge 📻" },
];

/**
 * A picture of the JOTA-JOTI chat (Rocket.Chat) where every numbered part can
 * be tapped to find out what it does. Nothing here connects to the real chat.
 */
export function ChatScreen() {
  const [active, setActive] = useState<HotspotId | null>(null);
  const index = active ? ORDER.indexOf(active) : -1;

  const spot = (id: HotspotId, children: ReactNode, className?: string) => (
    <button
      type="button"
      onClick={() => setActive(id)}
      className={cn(
        "relative rounded-md outline-none transition",
        active === id ? "z-10 ring-2 ring-amber-300 ring-offset-2 ring-offset-[#1f2329]" : "hover:ring-2 hover:ring-white/30",
        className,
      )}
      aria-label={`${CHAT_SCREEN[id].n}. ${CHAT_SCREEN[id].title}`}
    >
      {children}
      <span
        className={cn(
          "absolute grid size-5 place-items-center rounded-full text-[11px] font-black shadow",
          // full-width parts sit against the edge of the picture, so their number goes inside
          id === "banner" ? "right-1 top-1/2 -translate-y-1/2" : "-right-2 -top-2",
          active === id ? "bg-amber-300 text-zinc-900" : "bg-brand-500 text-white animate-pulse",
        )}
      >
        {CHAT_SCREEN[id].n}
      </span>
    </button>
  );

  const info = active ? CHAT_SCREEN[active] : null;

  return (
    <div className="space-y-3" data-tour="chat-screen">
      <div className="overflow-x-auto rounded-2xl ring-1 ring-line shadow-card">
        <div className="min-w-[640px] select-none bg-[#1f2329] text-[13px] text-zinc-200">
          {/* top bar */}
          <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
            {spot("home", <span className="grid size-8 place-items-center rounded-md bg-white/10"><Home className="size-4" /></span>)}
            {spot("directory", <span className="grid size-8 place-items-center rounded-md"><Hash className="size-4" /></span>)}
            <ListFilter className="size-4 text-zinc-400" />
            <Plus className="size-4 text-zinc-400" />
            {spot(
              "search",
              <span className="flex h-8 w-64 items-center justify-between rounded-md bg-white/5 px-3 text-zinc-400 ring-1 ring-white/10">
                Search rooms (⌘+K) <Search className="size-4" />
              </span>,
              "mx-auto",
            )}
            {spot(
              "avatar",
              <span className="relative grid size-8 place-items-center rounded-md bg-zinc-300 font-black text-zinc-800">
                S<span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[#1f2329]" />
              </span>,
            )}
          </div>

          <div className="flex min-h-[340px]">
            {/* sidebar */}
            <div className="w-44 shrink-0 border-r border-white/10 p-3">
              {spot(
                "sidebar",
                <span className="block space-y-3 p-1 text-left text-zinc-300">
                  <span className="flex items-center gap-1">Favorites <ChevronDown className="size-3.5" /></span>
                  <span className="flex items-center gap-1">Teams <ChevronDown className="size-3.5" /></span>
                  <span className="block">
                    <span className="flex items-center gap-1">Channels <ChevronDown className="size-3.5" /></span>
                    <span className="mt-1 block truncate rounded bg-white/10 px-1.5 py-1 text-xs"># Global_Meet_and…</span>
                  </span>
                  <span className="flex items-center gap-1">Direct messages <ChevronDown className="size-3.5" /></span>
                </span>,
                "w-full",
              )}
            </div>

            {/* room */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
                {spot("room", <span className="px-1 text-[15px] font-bold"># Global_Meet_and_Greet_English_Only 🌍</span>)}
                {spot(
                  "tools",
                  <span className="flex items-center gap-2.5 px-1 text-zinc-400">
                    <Video className="size-4" /> <Info className="size-4" /> <Search className="size-4" /> <AtSign className="size-4" />
                    <Users className="size-4" /> <Paperclip className="size-4" /> <Pin className="size-4" /> <MoreVertical className="size-4" />
                  </span>,
                  "ml-auto",
                )}
              </div>
              {spot(
                "banner",
                <span className="block bg-sky-200 py-1.5 pl-4 pr-8 text-left text-xs font-semibold text-zinc-900">
                  ⭐ English Only | No sharing of personal contacts, social media handles, and/or external links | No JID exchange here, use #JID_Exchange
                </span>,
                "w-full rounded-none",
              )}
              <div className="flex-1 space-y-3 px-4 py-3">
                {spot(
                  "message",
                  <span className="block space-y-3 text-left">
                    {SAMPLE.map((m) => (
                      <span key={m.who} className="flex gap-2.5">
                        <span className={cn("grid size-8 shrink-0 place-items-center rounded font-bold text-white", m.color)}>{m.letter}</span>
                        <span>
                          <span className="font-bold text-white">{m.who}</span> <span className="text-xs text-zinc-500">{m.time}</span>
                          <span className="block text-zinc-200">{m.text}</span>
                        </span>
                      </span>
                    ))}
                  </span>,
                  "w-full p-1",
                )}
              </div>
              {/* composer */}
              <div className="m-3 rounded-lg ring-1 ring-white/15">
                {spot("composer", <span className="block px-3 py-2.5 text-left text-zinc-500">Message #Global_Meet_and_Greet_English_Only</span>, "w-full")}
                <div className="flex items-center gap-3 border-t border-white/10 px-3 py-2 text-zinc-400">
                  {spot("emoji", <Smile className="size-4" />)}
                  <Bold className="size-4" /> <Italic className="size-4" /> <Strikethrough className="size-4" /> <Code className="size-4" />
                  <Mic className="size-4" /> <Paperclip className="size-4" /> <Plus className="size-4" />
                  {spot("join", <span className="rounded-md bg-blue-600 px-4 py-1.5 font-bold text-white">Join</span>, "ml-auto")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line" aria-live="polite">
        <div className="min-w-0 flex-1">
          {info ? (
            <>
              <p className="font-extrabold">
                <span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-amber-300 text-xs font-black text-zinc-900">{info.n}</span>
                {info.title}
              </p>
              <p className="mt-1 text-[15px]">{info.text}</p>
            </>
          ) : (
            <p className="text-[15px]">
              👆 <b>Tap a number</b> to find out what that part of the chat does, or press <b>Start</b> to go through them all.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <button type="button" onClick={() => setActive(ORDER[index - 1])} className="grid size-10 place-items-center rounded-xl ring-1 ring-line hover:bg-brand-50" aria-label="Previous">
              <ChevronLeft className="size-5" />
            </button>
          )}
          {index < ORDER.length - 1 && (
            <button
              type="button"
              onClick={() => setActive(ORDER[index + 1])}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-brand-500 px-4 font-bold text-white hover:bg-brand-600"
            >
              {index < 0 ? "Start" : "Next"} <ChevronRight className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
