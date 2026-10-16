import { eq } from "drizzle-orm";
import { getCurrentScout, getLeader } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { openStoredFile } from "@/lib/storage";

// Evidence is only ever served through here, to its owner or a leader.
export async function GET(request: Request, { params }: RouteContext<"/api/files/[id]">) {
  const { id } = await params;
  const db = await getDb();
  const [upload] = await db.select().from(schema.uploads).where(eq(schema.uploads.id, id));
  if (!upload) return new Response("Not found", { status: 404 });

  const leader = await getLeader();
  if (!leader) {
    const scout = await getCurrentScout();
    if (!scout || scout.id !== upload.scoutId) return new Response("Not allowed", { status: 403 });
  }

  const stream = await openStoredFile(upload);
  if (!stream) return new Response("File missing", { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  const inline = !download && /^(image|video|audio)\/|^application\/pdf$/.test(upload.contentType);
  const name = encodeURIComponent(upload.fileName);
  return new Response(stream, {
    headers: {
      "Content-Type": upload.contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${name}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
