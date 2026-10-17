"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";
import { getTour, resolveAnchor, type TourScope, type TourStep } from "@/lib/tour/registry";
import { buttonClass, cn } from "../ui";

type StartOptions = { title?: string; onEnd?: () => void };

type TourApi = {
  /** run a built-in tour by id */
  startTour: (id: string, options?: StartOptions) => void;
  /** run an ad-hoc walkthrough of anchor ids, in order */
  walkthrough: (anchorIds: string[], options?: StartOptions) => void;
  /** spotlight one place */
  highlight: (anchorId: string, options?: StartOptions) => void;
  scope: TourScope;
};

const Ctx = createContext<TourApi | null>(null);

export function useTour() {
  return use(Ctx);
}

type Running = { steps: TourStep[]; index: number; title?: string; single: boolean; onEnd?: () => void };

function findVisible(target: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour~="${CSS.escape(target)}"]`);
  for (const node of nodes) {
    const r = node.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return node;
  }
  return null;
}

async function waitFor(target: string, ms: number) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const el = findVisible(target);
    if (el) return el;
    await new Promise((r) => setTimeout(r, 120));
  }
  return null;
}

export function TourProvider({ scope, children }: { scope: TourScope; children: ReactNode }) {
  const router = useRouter();
  const [run, setRunState] = useState<Running | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [missing, setMissing] = useState(false);
  const element = useRef<HTMLElement | null>(null);
  const direction = useRef<1 | -1>(1);
  const runRef = useRef<Running | null>(null);

  // Every change of step starts with no spotlight until the new target is found.
  const setRun = useCallback((next: Running | null) => {
    runRef.current = next;
    setRunState(next);
    setRect(null);
    setMissing(false);
  }, []);

  const end = useCallback(() => {
    const finished = runRef.current;
    setRun(null);
    setRect(null);
    element.current = null;
    finished?.onEnd?.();
  }, [setRun]);

  const go = useCallback(
    (delta: 1 | -1) => {
      const r = runRef.current;
      if (!r) return;
      direction.current = delta;
      const index = r.index + delta;
      if (index < 0) return;
      if (index >= r.steps.length) return end();
      setRun({ ...r, index });
    },
    [end, setRun],
  );

  // Find (and if needed, navigate to) the current step's target.
  const step = run?.steps[run.index];
  useEffect(() => {
    if (!run || !step) return;
    let cancelled = false;
    element.current = null;

    (async () => {
      const next = run.steps[run.index + 1];
      if (!step.target) {
        // An intro card. Only change page if the next step isn't already here.
        if (step.href && step.href !== window.location.pathname && !(next?.target && findVisible(next.target))) router.push(step.href);
        return;
      }
      // Let the page bring the target into view if it can (e.g. a task jumping to a step that has a to-do list).
      window.dispatchEvent(new CustomEvent("joti-tour-target", { detail: step.target }));
      let el = findVisible(step.target);
      if (!el && step.href && step.href !== window.location.pathname) {
        router.push(step.href);
        el = await waitFor(step.target, 6000);
      } else if (!el) {
        el = await waitFor(step.target, 1200);
      }
      if (cancelled) return;
      if (!el) {
        // Not on this page (e.g. nobody has their hand up): skip it in a tour, explain it for a single highlight.
        if (run.single) setMissing(true);
        else go(direction.current);
        return;
      }
      element.current = el;
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      setTimeout(() => !cancelled && setRect(el.getBoundingClientRect()), 350);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.steps, run?.index]);

  // Keep the spotlight on the element while scrolling and resizing.
  useEffect(() => {
    if (!run) return;
    const update = () => element.current && setRect(element.current.getBoundingClientRect());
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.removeEventListener("keydown", onKey);
    };
  }, [run, end, go]);

  const api: TourApi = {
    scope,
    startTour: (id, options) => {
      const tour = getTour(id);
      if (!tour) return;
      direction.current = 1;
      setRun({ steps: tour.steps, index: 0, title: options?.title ?? tour.title, single: false, onEnd: options?.onEnd });
    },
    walkthrough: (ids, options) => {
      const steps = ids.map((id) => resolveAnchor(id, scope)).filter((s): s is TourStep => s !== null);
      if (!steps.length) return options?.onEnd?.();
      direction.current = 1;
      setRun({ steps, index: 0, title: options?.title ?? "Walkthrough", single: false, onEnd: options?.onEnd });
    },
    highlight: (id, options) => {
      const s = resolveAnchor(id, scope);
      if (!s) return options?.onEnd?.();
      direction.current = 1;
      setRun({ steps: [s], index: 0, single: true, onEnd: options?.onEnd });
    },
  };

  return (
    <Ctx value={api}>
      {children}
      {run && step && (
        <Spotlight
          step={step}
          rect={step.target ? rect : null}
          waiting={Boolean(step.target) && !rect && !missing}
          missing={missing}
          index={run.index}
          total={run.steps.length}
          title={run.title}
          single={run.single}
          onNext={() => go(1)}
          onBack={() => go(-1)}
          onClose={end}
        />
      )}
    </Ctx>
  );
}

function Spotlight({
  step,
  rect,
  waiting,
  missing,
  index,
  total,
  title,
  single,
  onNext,
  onBack,
  onClose,
}: {
  step: TourStep;
  rect: DOMRect | null;
  waiting: boolean;
  missing: boolean;
  index: number;
  total: number;
  title?: string;
  single: boolean;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const pad = 8;

  // Put the card below the spotlight if there's room, otherwise above; centred if there's no target.
  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!rect) {
      setPos({ top: Math.max(16, (vh - h) / 2), left: Math.max(16, (vw - w) / 2) });
      return;
    }
    const below = rect.bottom + pad + 12;
    const above = rect.top - pad - 12 - h;
    const top = below + h < vh - 8 ? below : above > 8 ? above : Math.max(8, vh - h - 8);
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - w / 2), vw - w - 12);
    setPos({ top, left });
  }, [rect, step, missing]);

  const last = index === total - 1;

  return (
    <div className="fixed inset-0 z-[60]" aria-live="polite">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-2xl ring-4 ring-amber-300 transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(20, 12, 40, 0.62)",
          }}
        >
          <span className="absolute -inset-1 animate-pulse rounded-[1.1rem] ring-4 ring-amber-200/70" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[rgba(20,12,40,0.62)]" onClick={onClose} />
      )}

      {!waiting && (
        <div
          ref={card}
          role="dialog"
          aria-label={step.title}
          className="absolute w-[min(22rem,calc(100vw-1.5rem))] animate-pop rounded-2xl bg-white p-4 shadow-lift ring-1 ring-line"
          style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-amber-100 text-amber-700">
              <Compass className="size-4" />
            </span>
            <p className="flex-1 text-xs font-black uppercase tracking-wider text-brand-500">
              {single ? "Here it is" : `${title ?? "Tour"} · ${index + 1} of ${total}`}
            </p>
            <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-lg text-muted hover:bg-zinc-100" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <p className="text-lg font-extrabold leading-snug">{step.title}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-zinc-700">
            {missing ? `${step.text} (It's not on this page right now, so open the right page and try again.)` : step.text}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            {single ? (
              <span />
            ) : (
              <button type="button" onClick={onBack} disabled={index === 0} className={buttonClass("ghost", "sm")}>
                <ArrowLeft className="size-4" /> Back
              </button>
            )}
            <button type="button" onClick={single ? onClose : onNext} className={buttonClass("primary", "sm")}>
              {single ? "Got it" : last ? "Done 🎉" : (
                <>
                  Next <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
          {!single && (
            <div className="mt-3 flex justify-center gap-1">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-brand-500" : "w-1.5 bg-zinc-200")} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
