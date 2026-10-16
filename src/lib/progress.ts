import type { BadgeDef } from "@/content/types";
import type { TaskStatus } from "@/lib/db/schema";

export type TaskState = "todo" | TaskStatus;

export type BadgeState = "not-started" | "in-progress" | "ready" | "awarded";

export type OptionProgress = { id: string; done: number; total: number; complete: boolean; started: boolean };

export type BadgeProgress = {
  state: BadgeState;
  /** tasks that count towards the badge right now */
  requiredTaskIds: string[];
  done: number;
  required: number;
  percent: number;
  waiting: number;
  changes: number;
  options: Record<string, OptionProgress[]>;
};

export function badgeProgress(
  badge: BadgeDef,
  statuses: Record<string, TaskState | undefined>,
  awarded: boolean,
): BadgeProgress {
  const state = (taskId: string): TaskState => statuses[taskId] ?? "todo";
  const isDone = (taskId: string) => state(taskId) === "done";

  const required = new Set<string>();
  let partsComplete = true;
  const options: Record<string, OptionProgress[]> = {};

  for (const part of badge.parts) {
    if (part.kind === "task") {
      required.add(part.taskId);
      if (!isDone(part.taskId)) partsComplete = false;
      continue;
    }
    const opts = part.options.map((o) => {
      const done = o.taskIds.filter(isDone).length;
      return {
        id: o.id,
        done,
        total: o.taskIds.length,
        complete: done === o.taskIds.length,
        started: o.taskIds.some((t) => state(t) !== "todo"),
      };
    });
    options[part.id] = opts;
    // Count the options the scout is furthest through towards the badge.
    const chosen = [...opts]
      .sort((a, b) => b.done / b.total - a.done / a.total || Number(b.started) - Number(a.started))
      .slice(0, part.pick);
    for (const o of chosen) {
      for (const t of part.options.find((x) => x.id === o.id)!.taskIds) required.add(t);
    }
    if (opts.filter((o) => o.complete).length < part.pick) partsComplete = false;
  }

  const requiredTaskIds = [...required];
  const done = requiredTaskIds.filter(isDone).length;
  const anyStarted = badge.tasks.some((t) => state(t.id) !== "todo");

  return {
    state: awarded ? "awarded" : partsComplete ? "ready" : anyStarted ? "in-progress" : "not-started",
    requiredTaskIds,
    done,
    required: requiredTaskIds.length,
    percent: awarded ? 100 : requiredTaskIds.length ? Math.round((done / requiredTaskIds.length) * 100) : 0,
    waiting: badge.tasks.filter((t) => state(t.id) === "submitted").length,
    changes: badge.tasks.filter((t) => state(t.id) === "changes").length,
    options,
  };
}

export const TASK_STATE_LABEL: Record<TaskState, string> = {
  todo: "Not started",
  draft: "In progress",
  submitted: "Waiting for a leader",
  changes: "Leader asked for changes",
  done: "Done",
};

export const BADGE_STATE_LABEL: Record<BadgeState, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  ready: "Ready for sign-off",
  awarded: "Signed off",
};
