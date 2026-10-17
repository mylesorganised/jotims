"use client";

import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  Excalidraw,
  exportToBlob,
  FONT_FAMILY,
  MainMenu,
  serializeAsJSON,
  WelcomeScreen,
} from "@excalidraw/excalidraw";
import type { ExcalidrawElement, ExcalidrawFrameElement, NonDeleted } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { Check, Lightbulb, LoaderCircle, Plus, RotateCcw, X } from "lucide-react";
import type { StudioMode } from "@/content/types";
import { cn } from "@/components/ui";

// Fonts are copied into public/ at build time (scripts/copy-excalidraw-assets.mjs).
if (typeof window !== "undefined") {
  (window as unknown as { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = "/excalidraw-assets/";
}

const POSTER = { w: 794, h: 1123 }; // A4 portrait
const SLIDE = { w: 1280, h: 720 }; // 16:9
const GAP = 140;
const STICKERS = ["⭐", "🌍", "📻", "💻", "🔒", "🛡️", "❤️", "🎉", "👍", "✅", "⚠️", "💡", "📱", "🙂", "🏕️", "⚜️"];

export const STUDIO_LABEL: Record<StudioMode, { button: string; title: string; emoji: string; tip: string }> = {
  drawing: {
    emoji: "🎨",
    button: "Draw it here",
    title: "Drawing",
    tip: "Pick the pencil ✏️ at the top and draw with your mouse or finger. Use shapes, colours and text too.",
  },
  poster: {
    emoji: "🖼️",
    button: "Make a poster here",
    title: "Poster",
    tip: "Click the title to change it. Add words with the T tool, shapes, pictures (the picture tool) and stickers. Only what's inside the poster page is used.",
  },
  slides: {
    emoji: "📊",
    button: "Make slides here",
    title: "Slides",
    tip: "Each white box is a slide. Click a title to change it, add words, pictures and stickers, and press “Add slide” for more. Empty slides are left out.",
  },
};

type Frame = NonDeleted<ExcalidrawFrameElement>;

const FAMILY_NAME: Record<number, string> = {
  [FONT_FAMILY.Excalifont]: "Excalifont",
  [FONT_FAMILY.Nunito]: "Nunito",
  [FONT_FAMILY["Lilita One"]]: "Lilita One",
  [FONT_FAMILY["Comic Shanns"]]: "Comic Shanns",
};

/**
 * Text made in code is measured before Excalidraw can use the web fonts, so
 * it comes out too narrow and gets cut off. Measure it ourselves once the
 * fonts are loaded. (Text typed in the editor is measured properly.)
 */
function fitText<T extends ExcalidrawElement>(elements: readonly T[]): T[] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [...elements];
  return elements.map((e) => {
    if (e.type !== "text") return e;
    ctx.font = `${e.fontSize}px "${FAMILY_NAME[e.fontFamily] ?? "Nunito"}", Xiaolai, "Segoe UI Emoji"`;
    const width = Math.max(...e.text.split("\n").map((line) => ctx.measureText(line).width));
    return { ...e, width: Math.ceil(width) + 2 };
  });
}

function slideSkeleton(n: number) {
  const x = (n - 1) * (SLIDE.w + GAP);
  const title = n === 1 ? "My presentation" : `Slide ${n} title`;
  const body = n === 1 ? "By …" : "Write your ideas here";
  return [
    {
      type: "text" as const,
      id: `slide-${n}-title`,
      x: x + 64,
      y: 56,
      text: title,
      fontSize: 60,
      fontFamily: FONT_FAMILY["Lilita One"],
      strokeColor: "#7413dc",
      // remembered so an untouched slide can be left out
      customData: { template: title },
    },
    {
      type: "text" as const,
      id: `slide-${n}-body`,
      x: x + 64,
      y: 170,
      text: body,
      fontSize: 34,
      fontFamily: FONT_FAMILY.Nunito,
      strokeColor: "#3f3f46",
      customData: { template: body },
    },
    {
      type: "frame" as const,
      id: `slide-${n}`,
      x,
      y: 0,
      width: SLIDE.w,
      height: SLIDE.h,
      name: `Slide ${n}`,
      children: [`slide-${n}-title`, `slide-${n}-body`],
    },
  ];
}

function startingScene(mode: StudioMode): ExcalidrawInitialDataState {
  const common = { viewBackgroundColor: "#ffffff", currentItemFontFamily: FONT_FAMILY.Nunito } as Partial<AppState>;
  if (mode === "drawing") return { elements: [], appState: { ...common, currentItemStrokeWidth: 2 } };
  if (mode === "poster") {
    return {
      elements: convertToExcalidrawElements(
        [
          {
            type: "text",
            id: "poster-title",
            x: 56,
            y: 56,
            text: "My poster title",
            fontSize: 64,
            fontFamily: FONT_FAMILY["Lilita One"],
            strokeColor: "#7413dc",
          },
          {
            type: "text",
            id: "poster-sub",
            x: 56,
            y: 150,
            text: "Add words, pictures and stickers",
            fontSize: 30,
            fontFamily: FONT_FAMILY.Nunito,
            strokeColor: "#52525b",
          },
          { type: "frame", id: "poster", x: 0, y: 0, width: POSTER.w, height: POSTER.h, name: "Poster", children: ["poster-title", "poster-sub"] },
        ],
        { regenerateIds: false },
      ),
      appState: { ...common, currentItemRoughness: 0 },
    };
  }
  return {
    elements: convertToExcalidrawElements([...slideSkeleton(1), ...slideSkeleton(2), ...slideSkeleton(3)], { regenerateIds: false }),
    appState: { ...common, currentItemRoughness: 0 },
  };
}

function framesOf(elements: readonly ExcalidrawElement[]) {
  return elements.filter((e): e is Frame => e.type === "frame" && !e.isDeleted).sort((a, b) => a.x - b.x || a.y - b.y);
}

/**
 * A drawing / poster / slides maker (Excalidraw underneath) that opens over
 * the task. "Add to my answer" turns the work into pictures and hands them to
 * the upload box. Work in progress is kept on this device until they finish.
 */
export default function Studio({
  mode,
  draftKey,
  onDone,
  onClose,
  preview,
}: {
  mode: StudioMode;
  /** where to keep the work in progress on this device */
  draftKey: string;
  onDone: (files: File[]) => Promise<void> | void;
  onClose: () => void;
  /** leaders trying it out in the badge library: nothing is uploaded */
  preview?: boolean;
}) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** don't save until the starting template is in place */
  const ready = useRef(false);
  const label = STUDIO_LABEL[mode];

  // A saved draft if there is one; otherwise the template is added once the
  // fonts have loaded, so its text is measured with the right font.
  const draft = useMemo<ExcalidrawInitialDataState | null>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      const parsed = saved ? (JSON.parse(saved) as ExcalidrawInitialDataState) : null;
      if (parsed?.elements?.some((e) => !e.isDeleted)) return parsed;
    } catch {}
    return null;
  }, [draftKey]);
  const initialData = useMemo<ExcalidrawInitialDataState>(() => draft ?? { elements: [], appState: startingScene(mode).appState }, [draft, mode]);

  const fit = useCallback(
    (target: ExcalidrawImperativeAPI) => {
      const all = framesOf(target.getSceneElements());
      if (all.length) target.scrollToContent(mode === "slides" ? all[0] : all, { fitToViewport: true, viewportZoomFactor: 0.85 });
      else target.setActiveTool({ type: "freedraw" });
    },
    [mode],
  );

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    (async () => {
      if (!draft && mode !== "drawing") {
        // Excalidraw only loads a font once something uses it, and measures
        // text when it's created. So: add the template, wait for its fonts,
        // then add it again so the words are measured with the real fonts.
        api.updateScene({ elements: startingScene(mode).elements ?? [], captureUpdate: CaptureUpdateAction.NEVER });
        // Each font is split into several files; load the ones these words need.
        const registered = (family: string) => [...document.fonts].some((f) => f.family.replace(/["']/g, "") === family);
        for (let i = 0; i < 40 && !(registered("Lilita One") && registered("Nunito")); i++) {
          await new Promise((r) => setTimeout(r, 100));
        }
        await Promise.all([
          document.fonts.load('64px "Lilita One"', "My poster title Slide 123 presentation"),
          document.fonts.load('30px "Nunito"', "Add words, pictures and stickers. Write your ideas here By …"),
        ]).catch(() => {});
        if (cancelled) return;
        api.updateScene({ elements: fitText(startingScene(mode).elements ?? []), captureUpdate: CaptureUpdateAction.NEVER });
      }
      ready.current = true;
      setTimeout(() => {
        if (cancelled) return;
        api.refresh();
        fit(api);
      }, 60);
    })();
    return () => {
      cancelled = true;
    };
  }, [api, draft, mode, fit]);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // The bars above the canvas change height (tips, errors), so let Excalidraw re-measure where it is.
  useEffect(() => {
    if (!api) return;
    const raf = requestAnimationFrame(() => api.refresh());
    return () => cancelAnimationFrame(raf);
  }, [api, tip, error, frames.length]);

  const onChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      const now = framesOf(elements);
      setFrames((prev) => (prev.length === now.length && prev.every((f, i) => f.id === now[i].id) ? prev : now));
      if (!ready.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, serializeAsJSON(elements, appState, files, "local"));
        } catch {
          // Too big with pictures in it: keep the drawing at least.
          try {
            localStorage.setItem(draftKey, serializeAsJSON(elements, appState, {}, "local"));
          } catch {}
        }
      }, 700);
    },
    [draftKey],
  );

  function addSticker(emoji: string) {
    if (!api) return;
    const s = api.getAppState();
    const x = -s.scrollX + s.width / 2 / s.zoom.value - 40;
    const y = -s.scrollY + s.height / 2 / s.zoom.value - 40;
    const inside = framesOf(api.getSceneElements()).find((f) => x >= f.x && x <= f.x + f.width && y >= f.y && y <= f.y + f.height);
    const [sticker] = fitText(convertToExcalidrawElements([{ type: "text", text: emoji, x, y, fontSize: 80, frameId: inside?.id ?? null }]));
    api.updateScene({
      elements: [...api.getSceneElementsIncludingDeleted(), sticker],
      appState: { selectedElementIds: { [sticker.id]: true } },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  }

  function addSlide() {
    if (!api) return;
    const n = framesOf(api.getSceneElements()).length + 1;
    const fresh = fitText(convertToExcalidrawElements(slideSkeleton(n), { regenerateIds: true }));
    // regenerateIds gives the frame new ids, so point its children at it again
    const frame = fresh.find((e) => e.type === "frame")!;
    const placed = fresh.map((e) => (e.type === "frame" ? e : { ...e, frameId: frame.id }));
    api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), ...placed], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    setTimeout(() => api.scrollToContent(frame, { fitToViewport: true, viewportZoomFactor: 0.85, animate: true }), 30);
  }

  function startAgain() {
    if (!api || !window.confirm("Start again? This clears everything you've made here.")) return;
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    api.updateScene({ elements: fitText(startingScene(mode).elements ?? []), captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    api.history.clear();
    setTimeout(() => fit(api), 30);
  }

  async function finish() {
    if (!api) return;
    setError(null);
    const elements = api.getSceneElements();
    const files = api.getFiles();
    const appState = { ...api.getAppState(), exportBackground: true, exportWithDarkMode: false, viewBackgroundColor: "#ffffff" };
    const getDimensions = (w: number, h: number) => {
      const scale = Math.min(2, 2400 / Math.max(w, h));
      return { width: Math.round(w * scale), height: Math.round(h * scale), scale };
    };
    const pages = framesOf(elements);
    const out: File[] = [];
    setBusy(true);
    try {
      if (!pages.length) {
        if (!elements.some((e) => e.type !== "frame")) throw new Error("Draw something first! ✏️");
        const blob = await exportToBlob({ elements, appState, files, mimeType: "image/png", exportPadding: 32, getDimensions });
        out.push(new File([blob], `${mode}.png`, { type: "image/png" }));
      } else {
        for (const [i, frame] of pages.entries()) {
          // A slide counts once something on it isn't the untouched template text.
          const used = elements.some(
            (e) => e.frameId === frame.id && !(e.type === "text" && e.customData?.template === e.text),
          );
          if (mode === "slides" && !used) continue;
          const blob = await exportToBlob({ elements, appState, files, exportingFrame: frame, mimeType: "image/png", exportPadding: 0, getDimensions });
          out.push(new File([blob], mode === "slides" ? `slide-${i + 1}.png` : `${mode}.png`, { type: "image/png" }));
        }
        if (!out.length) throw new Error("Your slides are empty. Add something first!");
      }
      if (preview) {
        window.alert(`Preview: this would add ${out.length} picture${out.length > 1 ? "s" : ""} to the answer. Nothing is saved.`);
        return;
      }
      await onDone(out);
      onClose();
    } catch (e) {
      setError((e as Error).message || "That didn't work. Try again?");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={`${label.title} maker`}>
      <style>{`
        .joti-studio .excalidraw .default-sidebar-trigger,
        .joti-studio .excalidraw .sidebar-trigger,
        .joti-studio .excalidraw .help-icon { display: none !important; }
      `}</style>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-2 text-white">
        <p className="mr-auto font-extrabold">
          {label.emoji} {label.title} maker{preview && <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">Preview</span>}
        </p>
        <button type="button" onClick={() => setTip((t) => !t)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold hover:bg-white/15">
          <Lightbulb className="size-4" /> Tips
        </button>
        <button type="button" onClick={startAgain} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold hover:bg-white/15">
          <RotateCcw className="size-4" /> Start again
        </button>
        <button
          type="button"
          onClick={finish}
          disabled={busy || !api}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-sm font-extrabold text-brand-700 shadow-sm hover:bg-brand-50 disabled:opacity-60"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} Add to my answer
        </button>
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg hover:bg-white/15" aria-label="Close (your work is kept)" title="Close (your work is kept)">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-canvas px-3 py-1.5">
        <span className="mr-1 text-xs font-bold text-muted">Stickers:</span>
        {STICKERS.map((s) => (
          <button key={s} type="button" onClick={() => addSticker(s)} className="grid size-8 place-items-center rounded-lg text-xl hover:bg-white hover:shadow-sm" aria-label={`Add ${s} sticker`}>
            {s}
          </button>
        ))}
        {mode === "slides" && (
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {frames.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => api?.scrollToContent(f, { fitToViewport: true, viewportZoomFactor: 0.85, animate: true })}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold ring-1 ring-line hover:ring-brand-300"
              >
                {i + 1}
              </button>
            ))}
            <button type="button" onClick={addSlide} className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-600">
              <Plus className="size-3.5" /> Add slide
            </button>
          </div>
        )}
      </div>

      {(tip || error) && (
        <div className={cn("flex items-start gap-2 px-4 py-2 text-sm", error ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900")}>
          <span className="flex-1">{error ?? label.tip} {!error && "Your work saves itself on this device, so you can close this and come back."}</span>
          {!error && (
            <button type="button" onClick={() => setTip(false)} className="font-bold underline">
              Got it
            </button>
          )}
        </div>
      )}

      <div className="joti-studio relative min-h-0 flex-1">
        <Excalidraw
          excalidrawAPI={setApi}
          initialData={initialData}
          onChange={onChange}
          langCode="en"
          theme="light"
          aiEnabled={false}
          validateEmbeddable={false}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              export: false,
              saveAsImage: false,
              toggleTheme: false,
              changeViewBackgroundColor: true,
              clearCanvas: false,
            },
            tools: { image: true },
          }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
          {mode === "drawing" && (
            <WelcomeScreen>
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Center>
                <WelcomeScreen.Center.Heading>Draw anything! Pick the pencil and start. ✏️</WelcomeScreen.Center.Heading>
              </WelcomeScreen.Center>
            </WelcomeScreen>
          )}
        </Excalidraw>
      </div>
    </div>,
    document.body,
  );
}
