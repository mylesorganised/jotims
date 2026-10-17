"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, FileText, LoaderCircle, Presentation, ScrollText, Upload, X } from "lucide-react";
import { deleteUploadAction, recordBlobUploadAction, type RecordedUpload } from "@/app/actions/scout";
import type { StudioMode } from "@/content/types";
import { viewerKind } from "@/lib/file-kinds";
import { fileSize } from "@/lib/format";
import { FileViewer } from "./slides/file-viewer";
import { Callout, cn } from "./ui";

// The drawing studio is big, so it only loads when someone opens it.
const Studio = dynamic(() => import("./studio/studio"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-white/90">
      <LoaderCircle className="size-8 animate-spin text-brand-500" />
    </div>
  ),
});

const STUDIO_BUTTON: Record<StudioMode, string> = {
  drawing: "🎨 Draw it here",
  poster: "🖼️ Make a poster here",
  slides: "📊 Make slides here",
};

function StudioButtons({
  modes,
  draftKey,
  onFiles,
  preview,
}: {
  modes: StudioMode[];
  draftKey: string;
  onFiles: (files: File[]) => Promise<void> | void;
  preview?: boolean;
}) {
  const [open, setOpen] = useState<StudioMode | null>(null);
  return (
    <div className="rounded-2xl bg-brand-50/60 p-3 ring-1 ring-brand-100" data-tour="studio-buttons">
      <p className="mb-2 text-sm font-bold text-brand-800">No paper? Make it right here:</p>
      <div className="flex flex-wrap gap-2">
        {modes.map((m, i) => (
          <button
            key={m}
            type="button"
            onClick={() => setOpen(m)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-extrabold transition",
              i === 0 ? "bg-brand-500 text-white shadow-sm hover:bg-brand-600" : "bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50",
            )}
          >
            {STUDIO_BUTTON[m]}
          </button>
        ))}
      </div>
      {open && <Studio mode={open} draftKey={`${draftKey}:${open}`} onDone={onFiles} onClose={() => setOpen(null)} preview={preview} />}
    </div>
  );
}

export type UploadConfig = {
  mode: "local" | "blob" | "none" | "preview";
  blobAccess: "private" | "public";
  scoutId: string;
  badgeId: string;
  taskId: string;
};

/** Phone photos can be 5–10 MB; shrink big images before uploading. */
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function sendFile(file: File, fieldId: string, config: UploadConfig): Promise<RecordedUpload> {
  if (config.mode === "blob") {
    const { upload } = await import("@vercel/blob/client");
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "file";
    const result = await upload(`evidence/${config.scoutId}/${config.badgeId}/${config.taskId}/${safe}`, file, {
      access: config.blobAccess,
      handleUploadUrl: "/api/upload/blob",
      clientPayload: JSON.stringify({ badgeId: config.badgeId, taskId: config.taskId, fieldId }),
      multipart: file.size > 8 * 1024 * 1024,
    });
    const recorded = await recordBlobUploadAction({
      pathname: result.pathname,
      fileName: file.name,
      badgeId: config.badgeId,
      taskId: config.taskId,
      fieldId,
    });
    if (!recorded.ok) throw new Error(recorded.error);
    return recorded.upload;
  }
  const form = new FormData();
  form.set("file", file);
  form.set("badgeId", config.badgeId);
  form.set("taskId", config.taskId);
  form.set("fieldId", fieldId);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json.upload;
}

export function FilePreview({ file, onRemove }: { file: RecordedUpload; onRemove?: () => void }) {
  const src = `/api/files/${file.id}`;
  const isImage = file.contentType.startsWith("image/");
  const isVideo = file.contentType.startsWith("video/");
  const kind = viewerKind(file);
  const [viewing, setViewing] = useState(false);
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white ring-1 ring-line">
      {kind ? (
        <>
          <button
            type="button"
            onClick={() => setViewing(true)}
            className={cn(
              "flex h-32 w-full flex-col items-center justify-center gap-2 p-3 text-center transition",
              kind === "slides" ? "bg-orange-50 hover:bg-orange-100" : "bg-sky-50 hover:bg-sky-100",
            )}
          >
            {kind === "slides" ? <Presentation className="size-8 text-orange-600" /> : <ScrollText className="size-8 text-sky-600" />}
            <span className="line-clamp-2 text-xs font-semibold break-all">{file.fileName}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white", kind === "slides" ? "bg-orange-600" : "bg-sky-600")}>
              {kind === "slides" ? "View slides" : "View document"}
            </span>
          </button>
          {viewing && <FileViewer fileId={file.id} fileName={file.fileName} kind={kind} onClose={() => setViewing(false)} />}
        </>
      ) : isVideo ? (
        <video src={src} controls preload="metadata" playsInline className="h-32 w-full bg-black object-contain" aria-label={file.fileName} />
      ) : isImage ? (
        <a href={src} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={file.fileName} className="h-32 w-full object-cover" loading="lazy" />
        </a>
      ) : (
        <a href={src} target="_blank" rel="noopener noreferrer" className="flex h-32 flex-col items-center justify-center gap-2 bg-zinc-50 p-3 text-center">
          <FileText className="size-8 text-brand-500" />
          <span className="line-clamp-2 text-xs font-semibold break-all">{file.fileName}</span>
        </a>
      )}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs text-muted">
        <span className="truncate">{fileSize(file.size)}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="grid size-6 place-items-center rounded-full hover:bg-rose-50 hover:text-rose-600"
            aria-label={`Remove ${file.fileName}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Uploader({
  fieldId,
  accept,
  multiple,
  studio,
  files,
  onChange,
  disabled,
  config,
}: {
  fieldId: string;
  accept?: string;
  multiple?: boolean;
  /** offer the in-app drawing / poster / slides maker */
  studio?: StudioMode[];
  files: RecordedUpload[];
  onChange: (files: RecordedUpload[]) => void;
  disabled?: boolean;
  config: UploadConfig;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const draftKey = `joti-studio:${config.scoutId}:${config.badgeId}:${config.taskId}:${fieldId}`;

  if (config.mode === "preview") {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-white px-4 py-6 text-center opacity-80" data-tour="upload-box">
          <Upload className="size-7 text-brand-500" />
          <span className="font-bold text-brand-700">{accept === "image/*" ? "Add a photo or screenshot" : "Add a file"}</span>
          <span className="text-xs text-muted">Young people tap here to upload. (Off in preview.)</span>
        </div>
        {studio?.length ? <StudioButtons modes={studio} draftKey={draftKey} onFiles={() => {}} preview /> : null}
      </div>
    );
  }

  if (config.mode === "none") {
    return (
      <Callout tone="info">
        File uploads aren&apos;t switched on yet. Show your work to a leader instead, and carry on.
      </Callout>
    );
  }

  const add = async (list: FileList | File[]) => {
    setError(null);
    const chosen = Array.from(list).slice(0, multiple ? 10 : 1);
    setBusy((b) => b + chosen.length);
    let current = multiple ? files : [];
    if (!multiple && files[0]) {
      await deleteUploadAction(files[0].id);
    }
    for (const raw of chosen) {
      try {
        const uploaded = await sendFile(await shrinkImage(raw), fieldId, config);
        current = [...current, uploaded];
        onChange(current);
      } catch (e) {
        setError((e as Error).message || "That didn't upload. Try again?");
      } finally {
        setBusy((b) => b - 1);
      }
    }
  };

  const remove = async (id: string) => {
    const result = await deleteUploadAction(id);
    if (result.ok) onChange(files.filter((f) => f.id !== id));
    else setError(result.error);
  };

  const canAdd = !disabled && (multiple || files.length === 0);
  const imageOnly = accept === "image/*";

  return (
    <div className="space-y-3">
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f) => (
            <FilePreview key={f.id} file={f} onRemove={disabled ? undefined : () => remove(f.id)} />
          ))}
        </div>
      )}
      {(canAdd || busy > 0) && (
        <button
          type="button"
          disabled={busy > 0}
          data-tour="upload-box"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) void add(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
            dragging ? "border-brand-400 bg-brand-50" : "border-brand-200 bg-white hover:border-brand-400 hover:bg-brand-50/50",
          )}
        >
          {busy > 0 ? (
            <>
              <LoaderCircle className="size-7 animate-spin text-brand-500" />
              <span className="font-bold text-brand-700">Uploading…</span>
            </>
          ) : (
            <>
              <span className="flex gap-2 text-brand-500">
                {imageOnly ? <Camera className="size-7" /> : <Upload className="size-7" />}
              </span>
              <span className="font-bold text-brand-700">
                {files.length ? "Add another" : imageOnly ? "Add a photo or screenshot" : "Add a file"}
              </span>
              <span className="text-xs text-muted">Tap to choose, or drag it here</span>
            </>
          )}
        </button>
      )}
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files?.length) void add(e.target.files);
          e.target.value = "";
        }}
      />
      {studio?.length && !disabled && busy === 0 ? <StudioButtons modes={studio} draftKey={draftKey} onFiles={add} /> : null}
      {error && <Callout tone="error">{error}</Callout>}
    </div>
  );
}
