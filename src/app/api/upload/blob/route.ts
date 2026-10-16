import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentScout } from "@/lib/auth";
import { badgeLockFor, lockMessage } from "@/lib/locks";
import { MAX_UPLOAD_BYTES, uploadMode, validUploadTarget } from "@/lib/uploads";

// Issues short-lived tokens so the browser can upload evidence straight to
// Vercel Blob (this avoids Vercel's 4.5 MB request limit). The upload is
// recorded afterwards by recordBlobUploadAction.
export async function POST(request: Request) {
  if (uploadMode() !== "blob") return NextResponse.json({ error: "Blob uploads are not enabled." }, { status: 400 });
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const scout = await getCurrentScout();
        if (!scout) throw new Error("Please log in again.");
        const payload = JSON.parse(clientPayload ?? "{}") as { badgeId?: string; taskId?: string; fieldId?: string };
        const target = validUploadTarget(payload.badgeId ?? "", payload.taskId ?? "", payload.fieldId ?? "");
        if (!target) throw new Error("Unknown upload field.");
        const before = await badgeLockFor(scout.id, target.badge);
        if (before) throw new Error(lockMessage(before));
        if (!pathname.startsWith(`evidence/${scout.id}/`)) throw new Error("Invalid file path.");
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          tokenPayload: JSON.stringify({ scoutId: scout.id }),
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
