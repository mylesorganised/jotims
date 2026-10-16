import { Award, CircleCheck, Clock, MessageSquare, Pencil } from "lucide-react";
import { SECTIONS } from "@/content";
import type { Section } from "@/lib/db/schema";
import { BADGE_STATE_LABEL, TASK_STATE_LABEL, type BadgeState, type TaskState } from "@/lib/progress";
import { Pill } from "./ui";

export function TaskStatusPill({ state, short = false }: { state: TaskState; short?: boolean }) {
  switch (state) {
    case "done":
      return (
        <Pill tone="green">
          <CircleCheck className="size-3.5" /> Done
        </Pill>
      );
    case "submitted":
      return (
        <Pill tone="amber">
          <Clock className="size-3.5" /> {short ? "Waiting" : TASK_STATE_LABEL.submitted}
        </Pill>
      );
    case "changes":
      return (
        <Pill tone="red">
          <MessageSquare className="size-3.5" /> {short ? "Changes" : "Needs changes"}
        </Pill>
      );
    case "draft":
      return (
        <Pill tone="brand">
          <Pencil className="size-3.5" /> {TASK_STATE_LABEL.draft}
        </Pill>
      );
    default:
      return <Pill>{TASK_STATE_LABEL.todo}</Pill>;
  }
}

export function BadgeStatusPill({ state }: { state: BadgeState }) {
  if (state === "awarded")
    return (
      <Pill tone="green">
        <Award className="size-3.5" /> {BADGE_STATE_LABEL.awarded}
      </Pill>
    );
  if (state === "ready")
    return (
      <Pill tone="blue">
        <CircleCheck className="size-3.5" /> {BADGE_STATE_LABEL.ready}
      </Pill>
    );
  if (state === "in-progress") return <Pill tone="brand">{BADGE_STATE_LABEL["in-progress"]}</Pill>;
  return <Pill>{BADGE_STATE_LABEL["not-started"]}</Pill>;
}

export function SectionPill({ section }: { section: Section }) {
  const s = SECTIONS.find((x) => x.id === section)!;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
      style={{ background: s.color }}
    >
      {s.name}
    </span>
  );
}
