import { beaversCommunicator, cubsCommunicator, scoutsCommunicator } from "./communicator";
import { digitalCitizen1, digitalCitizen2, digitalCitizen3 } from "./digital-citizen";
import { digitalMaker1, digitalMaker2, digitalMaker3 } from "./digital-maker";
import type { BadgeDef, FieldDef, PartDef, Section, TaskDef } from "./types";

export * from "./types";

export const BADGES: BadgeDef[] = [
  beaversCommunicator,
  cubsCommunicator,
  scoutsCommunicator,
  digitalCitizen1,
  digitalCitizen2,
  digitalCitizen3,
  digitalMaker1,
  digitalMaker2,
  digitalMaker3,
];

export const SECTIONS: { id: Section; name: string; ages: string; color: string; emoji: string }[] = [
  { id: "beavers", name: "Beavers", ages: "6–8", color: "#006ddf", emoji: "🦫" },
  { id: "cubs", name: "Cubs", ages: "8–10½", color: "#23a950", emoji: "🐺" },
  { id: "scouts", name: "Scouts", ages: "10½–14", color: "#004851", emoji: "⚜️" },
];

export function sectionName(section: Section) {
  return SECTIONS.find((s) => s.id === section)?.name ?? section;
}

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

export function getTask(badge: BadgeDef, taskId: string): TaskDef | undefined {
  return badge.tasks.find((t) => t.id === taskId);
}

export function badgesForSection(section: Section): BadgeDef[] {
  return BADGES.filter((b) => b.sections.includes(section));
}

export function badgeName(badge: BadgeDef) {
  return badge.stage ? `${badge.title} Stage ${badge.stage}` : badge.title;
}

export function allFields(task: TaskDef): FieldDef[] {
  return task.steps.flatMap((s) => s.fields ?? []);
}

/** Runs of single tasks are shown together as one list. */
export function groupParts(parts: PartDef[]) {
  const out: (Extract<PartDef, { kind: "choice" }> | { kind: "tasks"; taskIds: string[] })[] = [];
  for (const part of parts) {
    const last = out[out.length - 1];
    if (part.kind === "task") {
      if (last?.kind === "tasks") last.taskIds.push(part.taskId);
      else out.push({ kind: "tasks", taskIds: [part.taskId] });
    } else out.push(part);
  }
  return out;
}
