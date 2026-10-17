"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, Loader2, Minus, Plus, X } from "lucide-react";
import type { PptxViewer } from "@aiden0z/pptx-renderer";
import type { ViewerKind } from "@/lib/file-kinds";

// Word draws bullets with private characters from the Symbol and Wingdings
// fonts, which browsers don't have, so swap them for ordinary ones.
const BULLETS: Record<number, string> = {
  0xf0b7: "•",
  0xf0a7: "▪",
  0xf0a8: "◆",
  0xf0d8: "➢",
  0xf076: "❖",
  0xf0fc: "✔",
  0xf06e: "■",
  0xf071: "❑",
  0xf0e0: "➔",
};

function fixWordBullets(root: HTMLElement) {
  for (const style of root.querySelectorAll("style")) {
    style.textContent = (style.textContent ?? "")
      .replace(/[\uF000-\uF0FF]/g, (c) => BULLETS[c.codePointAt(0)!] ?? "•")
      .replace(/font-family:\s*(Symbol|Wingdings[^;]*);/g, "font-family: inherit;");
  }
}

/**
 * Full-screen viewer for an uploaded PowerPoint or Word file. The file is
 * fetched through the app's own (permission-checked) file route and drawn in
 * the browser, so it never goes to Microsoft, Google or anyone else.
 */
export function FileViewer({
  fileId,
  fileName,
  kind,
  onClose,
}: {
  fileId: string;
  fileName: string;
  kind: ViewerKind;
  onClose: () => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slides = useRef<PptxViewer | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/files/${fileId}`, { signal: abort.signal });
        if (!res.ok) throw new Error(`File request failed (${res.status})`);
        const buffer = await res.arrayBuffer();
        if (abort.signal.aborted || !stage.current) return;

        if (kind === "slides") {
          const lib = await import("@aiden0z/pptx-renderer");
          if (abort.signal.aborted || !stage.current) return;
          const v = await lib.PptxViewer.open(buffer, stage.current, {
            zipLimits: lib.RECOMMENDED_ZIP_LIMITS,
            fitMode: "contain",
            scrollContainer: scroller.current ?? undefined,
            lazyMedia: true,
            lazySlides: true,
            pdfjs: false,
            signal: abort.signal,
            listOptions: { windowed: true, initialSlides: 3, batchSize: 4, showSlideLabels: true },
            onSlideChange: (i) => setIndex(i),
          });
          if (abort.signal.aborted) return v.destroy();
          slides.current = v;
          setCount(v.slideCount);
        } else {
          const { renderAsync } = await import("docx-preview");
          if (abort.signal.aborted || !stage.current) return;
          await renderAsync(buffer, stage.current, undefined, {
            className: "docx",
            inWrapper: true,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderComments: false,
            renderChanges: false,
            useBase64URL: true,
            experimental: false,
          });
          if (abort.signal.aborted || !stage.current) return;
          fixWordBullets(stage.current);
          const pages = stage.current.querySelectorAll<HTMLElement>("section.docx");
          setCount(pages.length);
          // Start zoomed so a whole page width fits on screen.
          const pageWidth = pages[0]?.offsetWidth ?? 0;
          const room = (scroller.current?.clientWidth ?? 0) - 24;
          if (pageWidth && room > 0 && room < pageWidth) setZoom(Math.max(40, Math.floor((room / pageWidth) * 20) * 5));
        }
        setState("ready");
      } catch (error) {
        if (abort.signal.aborted) return;
        console.error("Could not show file", error);
        setState("error");
      }
    })();
    return () => {
      abort.abort();
      slides.current?.destroy();
      slides.current = null;
    };
  }, [fileId, kind]);

  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  const go = useCallback((i: number) => {
    const v = slides.current;
    if (!v) return;
    const next = Math.max(0, Math.min(v.slideCount - 1, i));
    setIndex(next);
    void v.goToSlide(next, { behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (!slides.current) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(slides.current.currentSlideIndex + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(slides.current.currentSlideIndex - 1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go]);

  function changeZoom(delta: number) {
    const next = Math.max(50, Math.min(200, zoom + delta));
    setZoom(next);
    if (kind === "slides") void slides.current?.setZoom(next);
  }

  const button = "grid size-9 place-items-center rounded-lg text-zinc-200 hover:bg-white/10 disabled:opacity-30";
  const what = kind === "slides" ? "slides" : "document";

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-zinc-900/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${kind === "slides" ? "Slides" : "Document"}: ${fileName}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 text-sm text-zinc-200 sm:px-5">
        <p className="min-w-0 flex-1 truncate font-bold text-white">{fileName}</p>
        {state === "ready" && kind === "slides" && (
          <>
            <button type="button" className={button} onClick={() => go(index - 1)} disabled={index <= 0} aria-label="Previous slide">
              <ChevronLeft className="size-5" />
            </button>
            <span className="tabular-nums">
              Slide {index + 1} of {count}
            </span>
            <button type="button" className={button} onClick={() => go(index + 1)} disabled={index >= count - 1} aria-label="Next slide">
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
        {state === "ready" && kind === "document" && count > 0 && (
          <span className="tabular-nums">
            {count} page{count === 1 ? "" : "s"}
          </span>
        )}
        {state === "ready" && (
          <>
            <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
            <button type="button" className={button} onClick={() => changeZoom(-25)} aria-label="Zoom out">
              <Minus className="size-4" />
            </button>
            <span className="w-11 text-center tabular-nums">{zoom}%</span>
            <button type="button" className={button} onClick={() => changeZoom(25)} aria-label="Zoom in">
              <Plus className="size-4" />
            </button>
          </>
        )}
        <a href={`/api/files/${fileId}?download`} className={button} aria-label="Download" title="Download">
          <Download className="size-4" />
        </a>
        <button type="button" className={button} onClick={onClose} aria-label="Close" title="Close (Esc)">
          <X className="size-5" />
        </button>
      </div>

      <div ref={scroller} className="relative flex-1 overflow-auto px-3 py-6 sm:px-8">
        {state === "loading" && (
          <p className="absolute inset-0 grid place-items-center text-zinc-300">
            <span className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" /> Opening the {what}…
            </span>
          </p>
        )}
        {state === "error" && (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-6 text-center">
            <p className="font-extrabold">We couldn&apos;t show this {what}</p>
            <p className="mt-1 text-sm text-muted">The file might be damaged or use something we can&apos;t draw. You can still download it.</p>
            <a href={`/api/files/${fileId}?download`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 font-bold text-white hover:bg-brand-600">
              <Download className="size-4" /> Download
            </a>
          </div>
        )}
        <div
          ref={stage}
          className={kind === "slides" ? "mx-auto max-w-5xl" : "mx-auto w-fit [&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-0"}
          style={kind === "document" ? { zoom: zoom / 100 } : undefined}
        />
      </div>
    </div>,
    document.body,
  );
}
