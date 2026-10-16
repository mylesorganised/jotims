import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskWizard } from "@/components/task-wizard";
import { badgeName, getBadge, getTask } from "@/content";
import { requireScout } from "@/lib/auth";
import { getScoutOverview, getTaskRecord, getTaskUploads, touchScout } from "@/lib/data";
import { blobAccess, uploadMode } from "@/lib/uploads";

export async function generateMetadata({ params }: PageProps<"/badges/[badgeId]/[taskId]">): Promise<Metadata> {
  const { badgeId, taskId } = await params;
  const badge = getBadge(badgeId);
  const task = badge && getTask(badge, taskId);
  return { title: task?.title ?? "Task" };
}

export default async function TaskPage({ params }: PageProps<"/badges/[badgeId]/[taskId]">) {
  const { badgeId, taskId } = await params;
  const badge = getBadge(badgeId);
  const task = badge && getTask(badge, taskId);
  if (!badge || !task) notFound();

  const scout = await requireScout();
  const [record, uploads, overview] = await Promise.all([
    getTaskRecord(scout.id, badge.id, task.id),
    getTaskUploads(scout.id, badge.id, task.id),
    getScoutOverview(scout.id),
    touchScout(scout.id),
  ]);

  // Suggest the next task in this badge that isn't finished yet.
  const statuses = overview.statuses[badge.id] ?? {};
  const order = badge.tasks.map((t) => t.id);
  const after = [...order.slice(order.indexOf(task.id) + 1), ...order.slice(0, order.indexOf(task.id))];
  const nextId = after.find((id) => statuses[id] !== "done" && statuses[id] !== "submitted");
  const next = nextId ? getTask(badge, nextId) : undefined;

  return (
    <TaskWizard
      key={`${badge.id}/${task.id}`}
      badge={{ id: badge.id, name: badgeName(badge), color: badge.color, ring: badge.ring }}
      task={task}
      nextTask={next ? { id: next.id, title: next.title, emoji: next.emoji } : null}
      record={
        record
          ? {
              status: record.status,
              answers: record.answers,
              stepReached: record.stepReached,
              feedback: record.feedback,
              reviewedBy: record.reviewedBy,
              helpRequestedAt: record.helpRequestedAt?.toISOString() ?? null,
            }
          : null
      }
      uploads={uploads.map((u) => ({ id: u.id, fileName: u.fileName, contentType: u.contentType, size: u.size, fieldId: u.fieldId }))}
      scout={{ id: scout.id, firstName: scout.firstName }}
      uploadMode={uploadMode()}
      blobAccess={blobAccess()}
    />
  );
}
