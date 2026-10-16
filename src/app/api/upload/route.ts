import { NextResponse } from "next/server";
import { getCurrentScout } from "@/lib/auth";
import { getTaskRecord } from "@/lib/data";
import { badgeLockFor, lockMessage } from "@/lib/locks";
import {
  ensureProgressRow,
  MAX_UPLOAD_BYTES,
  recordUpload,
  safeFileName,
  uploadDir,
  uploadMode,
  validUploadTarget,
} from "@/lib/uploads";

// Local development uploads: files are written to ./.data/uploads.
// On Vercel, the browser uploads straight to Blob via /api/upload/blob instead.
export async function POST(request: Request) {
  if (uploadMode() !== "local") {
    return NextResponse.json({ error: "Local uploads are disabled here." }, { status: 400 });
  }
  const scout = await getCurrentScout();
  if (!scout) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const badgeId = String(form.get("badgeId") ?? "");
  const taskId = String(form.get("taskId") ?? "");
  const fieldId = String(form.get("fieldId") ?? "");

  const target = validUploadTarget(badgeId, taskId, fieldId);
  if (!target) return NextResponse.json({ error: "Unknown upload field." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "That file is too big (50 MB max)." }, { status: 413 });

  const before = await badgeLockFor(scout.id, target.badge);
  if (before) return NextResponse.json({ error: lockMessage(before) }, { status: 409 });

  const record = await getTaskRecord(scout.id, badgeId, taskId);
  if (record?.status === "submitted" || (record?.status === "done" && target.task.review === "leader")) {
    return NextResponse.json({ error: "This task is locked while a leader looks at it." }, { status: 409 });
  }

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const id = crypto.randomUUID();
  const storageKey = `${id}-${safeFileName(file.name)}`;
  await fs.mkdir(uploadDir(), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), storageKey), Buffer.from(await file.arrayBuffer()));

  const upload = {
    id,
    scoutId: scout.id,
    badgeId,
    taskId,
    fieldId,
    storage: "local" as const,
    storageKey,
    fileName: file.name.slice(0, 200) || "file",
    contentType: file.type || "application/octet-stream",
    size: file.size,
  };
  await ensureProgressRow(scout.id, badgeId, taskId);
  await recordUpload(upload);
  return NextResponse.json({
    upload: { id, fileName: upload.fileName, contentType: upload.contentType, size: upload.size },
  });
}
