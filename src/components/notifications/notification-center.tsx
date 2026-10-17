"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Bell, BellRing, CheckCircle2, PencilLine, X } from "lucide-react";
import { cn } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import { confetti } from "./confetti";

type Item = {
  id: number;
  kind: "approved" | "changes" | "awarded" | "help";
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const LOOK: Record<Item["kind"], { icon: typeof Bell; tone: string; ring: string }> = {
  approved: { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-200" },
  changes: { icon: PencilLine, tone: "bg-amber-100 text-amber-700", ring: "ring-amber-200" },
  awarded: { icon: Award, tone: "bg-brand-100 text-brand-700", ring: "ring-brand-200" },
  help: { icon: Bell, tone: "bg-sky-100 text-sky-700", ring: "ring-sky-200" },
};

const FAST = 8_000; // while the page is on screen
const SLOW = 30_000; // while they're on another tab (e.g. Scratch)

function storageKey(scoutId: string) {
  return `joti-notified-${scoutId}`;
}

/**
 * The bell in the header. Polls for news (approvals, changes, badges), pops up
 * a message, refreshes the page so ticks update, throws confetti for badges,
 * and can send a browser alert when they're working in another tab.
 */
export function NotificationCenter({ scoutId }: { scoutId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Item[]>([]);
  const [now, setNow] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const latest = useRef(0);
  const primed = useRef(false);
  const panel = useRef<HTMLDivElement>(null);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const announce = useCallback(
    (fresh: Item[]) => {
      setToasts((t) => [...fresh.slice(0, 3), ...t].slice(0, 3));
      for (const item of fresh) setTimeout(() => dismiss(item.id), item.kind === "awarded" ? 14_000 : 9_000);
      if (fresh.some((i) => i.kind === "awarded")) confetti();
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        for (const item of fresh.slice(0, 3)) {
          const alert = new Notification(item.title, { body: item.body ?? undefined, icon: "/favicon.ico", tag: `joti-${item.id}` });
          alert.onclick = () => {
            window.focus();
            if (item.href) router.push(item.href);
            alert.close();
          };
        }
      }
      router.refresh();
    },
    [dismiss, router],
  );

  const poll = useCallback(async () => {
    const res = await fetch(`/api/notifications?after=${latest.current}`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const data = (await res.json()) as { items: Item[]; unread: number };
    setNow(Date.now());
    setUnread(data.unread);
    if (!data.items.length) {
      primed.current = true;
      return;
    }
    latest.current = Math.max(latest.current, ...data.items.map((i) => i.id));
    setItems((prev) => [...data.items, ...prev.filter((p) => !data.items.some((d) => d.id === p.id))].slice(0, 30));

    // Pop up anything we haven't shown on this device yet (including news
    // that arrived while they were logged out or reloading).
    let shown = 0;
    try {
      shown = Number(localStorage.getItem(storageKey(scoutId))) || 0;
    } catch {}
    const fresh = data.items.filter((i) => i.id > shown && !i.readAt);
    try {
      localStorage.setItem(storageKey(scoutId), String(latest.current));
    } catch {}
    // On first load only pop up recent news, not a backlog.
    const recent = primed.current ? fresh : fresh.filter((i) => Date.now() - new Date(i.createdAt).getTime() < 30 * 60_000);
    primed.current = true;
    if (recent.length) announce(recent);
  }, [announce, scoutId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const loop = async () => {
      await poll();
      if (!stopped) timer = setTimeout(loop, document.hidden ? SLOW : FAST);
    };
    const onVisible = () => {
      if (document.hidden) return;
      clearTimeout(timer);
      loop();
    };
    loop();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  useEffect(() => {
    // Read once on the client; the server can't know the browser's permission.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !panel.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function markAllRead() {
    setUnread(0);
    setItems((prev) => prev.map((i) => (i.readAt ? i : { ...i, readAt: new Date().toISOString() })));
    await fetch("/api/notifications", { method: "POST", body: JSON.stringify({ all: true }) }).catch(() => {});
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    setNow(Date.now());
    if (next && unread) markAllRead();
  }

  function go(item: Item) {
    setOpen(false);
    dismiss(item.id);
    if (!item.readAt) {
      fetch("/api/notifications", { method: "POST", body: JSON.stringify({ ids: [item.id] }) }).catch(() => {});
    }
    if (item.href) router.push(item.href);
  }

  async function askPermission() {
    if (!("Notification" in window)) return;
    setPermission(await Notification.requestPermission());
  }

  return (
    <>
      <div ref={panel} className="relative">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "relative grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand-700",
            open && "bg-brand-50 text-brand-700",
          )}
          aria-label={unread ? `Messages: ${unread} new` : "Messages"}
          aria-expanded={open}
          data-tour="notifications"
        >
          {unread ? <BellRing className="size-5 text-brand-600" /> : <Bell className="size-5" />}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white ring-2 ring-white animate-pop">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-line animate-fade-up">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-extrabold">Messages from leaders</p>
              {items.some((i) => !i.readAt) && (
                <button type="button" onClick={markAllRead} className="text-xs font-bold text-brand-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-muted">
                  Nothing yet. When a leader checks your work, you&apos;ll see it here. 📬
                </li>
              )}
              {items.map((item) => {
                const look = LOOK[item.kind];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item)}
                      className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-canvas", !item.readAt && "bg-brand-50/50")}
                    >
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", look.tone)}>
                        <look.icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-snug">{item.title}</span>
                        {item.body && <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{item.body}</span>}
                        <span className="mt-1 block text-xs text-muted">{now ? timeAgo(item.createdAt, now) : ""}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {permission === "default" && (
              <div className="border-t border-line bg-canvas px-4 py-3 text-sm">
                <button type="button" onClick={askPermission} className="font-bold text-brand-600 hover:underline">
                  🔔 Tell me even when I&apos;m on another tab
                </button>
                <p className="text-xs text-muted">Handy when you&apos;re in Scratch or MakeCode. Your browser will ask first.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-4 top-20 z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-96" aria-live="polite">
        {toasts.map((item) => {
          const look = LOOK[item.kind];
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex w-full gap-3 rounded-2xl bg-white p-4 shadow-lift ring-2 animate-pop",
                look.ring,
                item.kind === "awarded" && "bg-gradient-to-br from-white to-brand-50",
              )}
              role="status"
            >
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", look.tone)}>
                <look.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold leading-snug">{item.title}</p>
                {item.body && <p className="mt-1 line-clamp-4 text-sm text-zinc-700">{item.body}</p>}
                {item.href && (
                  <button type="button" onClick={() => go(item)} className="mt-2 text-sm font-bold text-brand-600 hover:underline">
                    {item.kind === "changes" ? "Have another go →" : "Take a look →"}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-zinc-100"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
