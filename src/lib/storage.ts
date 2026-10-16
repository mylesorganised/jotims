import "server-only";
import type { UploadRow } from "@/lib/data";
import { blobAccess, uploadDir } from "@/lib/uploads";

/** Opens an uploaded file for streaming back to the browser. */
export async function openStoredFile(upload: UploadRow): Promise<ReadableStream<Uint8Array> | null> {
  if (upload.storage === "local") {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { Readable } = await import("node:stream");
    const file = path.join(uploadDir(), path.basename(upload.storageKey));
    if (!fs.existsSync(file)) return null;
    return Readable.toWeb(fs.createReadStream(file)) as ReadableStream<Uint8Array>;
  }
  const { get } = await import("@vercel/blob");
  const result = await get(upload.storageKey, { access: blobAccess() }).catch(() => null);
  return result?.statusCode === 200 ? result.stream : null;
}

export async function removeStoredFile(upload: Pick<UploadRow, "storage" | "storageKey">) {
  try {
    if (upload.storage === "local") {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      await fs.rm(path.join(uploadDir(), path.basename(upload.storageKey)), { force: true });
    } else {
      const { del } = await import("@vercel/blob");
      await del(upload.storageKey);
    }
  } catch (error) {
    console.error("Could not delete stored file", error);
  }
}
