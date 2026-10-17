import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { TaskWizard } from "@/components/task-wizard";
import { badgeName, getBadge, getTask } from "@/content";
import { requireLeader } from "@/lib/auth";

export const metadata: Metadata = { title: "Task preview" };
// Signed-in page: allowed to block on the session (see the panel layout).
export const instant = false;

export default async function LibraryTaskPage({ params }: PageProps<"/admin/library/[badgeId]/[taskId]">) {
  await requireLeader();
  const { badgeId, taskId } = await params;
  const badge = getBadge(badgeId);
  const task = badge && getTask(badge, taskId);
  if (!badge || !task) notFound();

  const index = badge.tasks.findIndex((t) => t.id === task.id);
  const next = badge.tasks[index + 1];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <Eye className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <p>
          <b>Preview.</b> This is exactly what a young person sees. You can click through the steps, try the tools and type
          answers, but nothing is saved or sent.
        </p>
      </div>
      <TaskWizard
        key={`${badge.id}/${task.id}`}
        badge={{ id: badge.id, name: badgeName(badge), color: badge.color, ring: badge.ring }}
        task={task}
        nextTask={next ? { id: next.id, title: next.title, emoji: next.emoji } : null}
        record={null}
        uploads={[]}
        scout={{ id: "preview", firstName: "Sam" }}
        uploadMode="preview"
        blobAccess="private"
        preview
        basePath="/admin/library"
      />
    </div>
  );
}
