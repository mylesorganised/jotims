import "server-only";
import { BADGES, badgeName, getBadge, getTask, sectionName, type BadgeDef, type FieldDef, type StepDef, type TaskDef } from "@/content";
import type { Section } from "@/lib/db/schema";
import { CHARACTERS, MORSE, PHONETIC, SEMAPHORE } from "@/lib/codes";
import { TASK_STATE_LABEL, type TaskState } from "@/lib/progress";

// Everything the AI helper is told. Built from the same content the app shows,
// so it never drifts out of date. Answers to auto-checked puzzles are left out
// on purpose so the helper can't give them away.

const SCOUT_APP_GUIDE = `
HOW THE APP WORKS (for young people)
- They log in with first name, last name and birthday. "My badges" lists their badges with progress bars.
- Each badge has tasks. Each task is a walkthrough of steps. The step list is down the side (or a bar on phones); "Next step" and "Back" move between steps.
- Answers save automatically as they type ("Saved" at the top).
- To-do lists in a step can be tapped to tick them off as they go.
- Photos, screenshots and files are added with the "Add a photo or screenshot" box in a step. Big photos are shrunk automatically.
- Screenshots: Windows = Windows + Shift + S. Mac = Cmd + Shift + 4. Chromebook = Ctrl + Shift + Show windows. iPad = top button + volume up.
- The last step is "Check & finish". It lists anything still missing (with a button to jump to it).
- Tasks marked "You tick this off" are done when they press "I've finished!".
- Tasks marked "Leader checks this" are sent to a leader. A leader approves them or asks for changes with a message; changes show at the top of the task and on "My badges".
- When every task in a badge is done, a leader signs off the badge.
- Staged badges unlock in order: Stage 2 opens when every Stage 1 task is done (or a leader signs Stage 1 off).
- "Ask for help" (top of each task) puts their hand up so a real leader comes over.
- The "Code toolbox" page has Morse code, phonetic alphabet and semaphore translators and charts, plus printable sheets.
- Links to other websites open in a new tab.
`.trim();

const LEADER_APP_GUIDE = `
HOW THE LEADERS' AREA WORKS (/admin)
- Leaders log in with a username and password. Add or remove leaders and reset passwords on the "Leaders" page; change your own password there too.
- Dashboard: "Hands up" (young people asking for help, press "Sorted" when done), "Waiting for review", "Ready to sign off" (with a one-click Sign off), stats per section, and latest activity. It refreshes itself every 20 seconds.
- Review: the queue of "Leader checks this" tasks, oldest first, and an "All recent work" tab. Each submission shows every answer and upload, a "What to look for" note, and auto-check results for puzzles. Approve (optionally with a message) or "Ask for changes" (with a message the young person sees). "Next waiting" jumps to the next one.
- Young people: search, filter by section, add one person, or paste a list (First, Last, DD/MM/YYYY, Section, one per line, straight from a spreadsheet or OSM). Each person's page shows every badge and task: "Tick off" marks a task done (e.g. done on paper), the reopen arrow puts it back to in progress, "Sign off badge" (or "Sign off anyway" if tasks aren't all done) awards it, "Undo" removes a sign-off. Signing off an earlier stage unlocks the next stage for that person. Their helper chats are shown there too. Edit details or delete the person (deletes their work and files).
- Badge tracker: a grid of everyone × every badge (green tick = signed off, blue = ready to sign off, ring = % done, amber dot = waiting for review), filter by section, and "Export CSV".
- Settings: event name, "Let new young people add themselves" (turn off once everyone is added), and an optional group code young people must type to log in.
- Young people log in with first name, last name and date of birth. If a login doesn't work, check spelling and birthday on their page.
- Uploaded evidence is private and only visible to the young person and leaders.
`.trim();

const SAFETY_RULES = `
RULES YOU MUST ALWAYS FOLLOW
- You are talking to a young person aged about 6 to 14 at a Scout group (PG Scouts, Berkshire, UK). Use short sentences, simple words, British English, and a warm, encouraging tone. A few emojis are fine.
- Help them learn. Explain, give hints, and break things into small steps. Don't write their answers, posters, reports or stories for them; help them come up with their own ideas instead. Never give the answer to a puzzle, code or secret message: give a hint or show how to work out one letter.
- Never ask for, and tell them not to share, personal information: full name, address, school, phone number, email, passwords, photos of themselves, or where they are.
- If they seem worried, upset, unsafe, or mention bullying, someone hurting them, or something online that made them uncomfortable: be kind, tell them to talk to a leader or a trusted adult straight away, suggest pressing "Ask for help", and mention Childline (0800 1111, childline.org.uk). Don't try to handle it yourself.
- Stay on topic: their badges, Scouting, JOTA-JOTI, the tools in the app, and digital skills. Politely steer anything else back.
- Only recommend websites that appear in the badge content below, or very well-known safe ones (BBC, Scratch, MakeCode).
- If you don't know, say so and suggest asking a leader. Never make up badge requirements.
- Keep replies short (usually under 120 words). Use bullet points for steps.
`.trim();

const LEADER_RULES = `
You are helping an adult Scout leader use this badge tracker and run JOTA-JOTI badge activities. Be concise and practical, in British English. Answer questions about how to use the app, what each badge and task requires, what to look for when reviewing, and how to run the activities. If something isn't covered, say so rather than guessing.
`.trim();

// ------------------------------------------------------------- formatting

function fieldLine(f: FieldDef) {
  const req = f.required ? "" : " (optional)";
  const hint = f.hint ? ` (${f.hint})` : "";
  switch (f.kind) {
    case "choice":
      return `- Answer: ${f.label}${req}. Choices: ${f.options.join(" / ")}`;
    case "checklist":
      return `- Tick list: ${f.label}${req}: ${f.items.join("; ")}${f.min && f.min > 1 ? ` (tick at least ${f.min})` : ""}`;
    case "table":
      return `- Table: ${f.label}${req} with columns ${f.columns.map((c) => c.label).join(" | ")}${f.minRows ? `, at least ${f.minRows} rows` : ""}`;
    case "list":
      return `- List: ${f.label}${req}${f.min ? `, at least ${f.min}` : ""}${hint}`;
    case "upload":
      return `- Upload: ${f.label}${f.required ? "" : " (optional)"}`;
    case "led":
      return `- LED design: ${f.label} (tap the 5×5 lights to design an icon)`;
    case "text":
      return `- Answer: ${f.label}${req}${hint}${f.minWords ? ` (at least ${f.minWords} words)` : ""}${f.check ? " (this is auto-checked; do NOT reveal the answer)" : ""}`;
  }
}

function stepText(step: StepDef, index: number, current: boolean) {
  const lines = [`### Step ${index + 1}: ${step.title}${current ? "   <-- THE YOUNG PERSON IS ON THIS STEP" : ""}`];
  if (step.withLeader) lines.push("(Done with a leader watching or listening.)");
  step.body?.forEach((b) => lines.push(b));
  step.todo?.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  step.bullets?.forEach((b) => lines.push(`- ${b}`));
  step.images?.forEach((img) => lines.push(`[Picture: ${img.alt}${img.caption ? ` (${img.caption})` : ""}]`));
  if (step.spoiler) lines.push("[A 'peek at the answer' button shows the finished code. Encourage trying first.]");
  if (step.tip) lines.push(`Tip: ${step.tip}`);
  if (step.warning) lines.push(`Safety: ${step.warning}`);
  step.links?.forEach((l) => lines.push(`Link: ${l.label} ${l.url.startsWith("/") ? "(printable sheet in the app)" : l.url}${l.note ? ` (${l.note})` : ""}`));
  step.tools?.forEach((t) => lines.push(`Built-in tool on this step: ${toolName(t)}`));
  step.stuck?.forEach((s) => lines.push(`If stuck, "${s.problem}": ${s.fix}`));
  step.fields?.forEach((f) => lines.push(fieldLine(f)));
  return lines.join("\n");
}

function toolName(id: string) {
  const names: Record<string, string> = {
    morse: "Morse code chart, translator (with sound and flashing light) and decoder",
    phonetic: "Phonetic alphabet chart and converter (can read aloud)",
    semaphore: "Semaphore flag chart and word-to-flags converter",
    persuasion: "Digital persuasion matching game",
    emoji: "Emoji reaction board",
    timeline: "Technology timeline picture cards",
    password: "Password strength tester (use a pretend password)",
    "fact-opinion": "Fact or opinion quiz",
    "leaf-guide": "Interactive leaf identification guide",
    "timer-10": "10 minute timer",
    "timer-2": "2 minute timer",
  };
  return names[id] ?? id;
}

export function describeTask(task: TaskDef, currentStep?: number) {
  return [
    `## Task: ${task.emoji} ${task.title}`,
    task.summary,
    task.review === "leader"
      ? `A leader checks this task when it's sent.${task.leaderCheck ? ` Leaders look for: ${task.leaderCheck}` : ""}`
      : "The young person ticks this off themselves when finished.",
    task.minutes ? `Takes about ${task.minutes} minutes.` : "",
    task.note ?? "",
    ...task.steps.map((s, i) => stepText(s, i, i === currentStep)),
    `### Final step: Check & ${task.review === "leader" ? "send to a leader" : "finish"}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function describeBadge(badge: BadgeDef, statuses?: Record<string, TaskState | undefined>) {
  const status = (id: string) => (statuses ? ` [${TASK_STATE_LABEL[statuses[id] ?? "todo"]}]` : "");
  const lines = [`# Badge: ${badgeName(badge)}`, badge.tagline, badge.intro];
  if (badge.prerequisite) lines.push(`Unlocks after ${badgeName(getBadge(badge.prerequisite)!)} is finished.`);
  for (const part of badge.parts) {
    if (part.kind === "task") {
      const t = getTask(badge, part.taskId)!;
      lines.push(`- Task: ${t.title}: ${t.summary} (${t.review === "leader" ? "leader checks" : "self check"})${status(t.id)}`);
    } else {
      lines.push(`- ${part.title} (${part.description}):`);
      for (const o of part.options) {
        lines.push(`  - Option "${o.title}": ${o.summary}`);
        for (const id of o.taskIds) {
          const t = getTask(badge, id)!;
          lines.push(`    - Task: ${t.title}${status(t.id)}`);
        }
      }
    }
  }
  return lines.join("\n");
}

function catalogue(section?: Section) {
  return BADGES.filter((b) => !section || b.sections.includes(section))
    .map((b) => `- ${badgeName(b)} (${b.sections.map(sectionName).join(", ")}): ${b.tagline} Tasks: ${b.tasks.map((t) => t.title).join("; ")}`)
    .join("\n");
}

function codesReference(tools: Set<string>) {
  const parts: string[] = [];
  if (tools.has("morse")) {
    parts.push(
      `MORSE CODE (dot = short, dash = long; letters separated by a space, words by /):\n${CHARACTERS.map((c) => `${c} ${MORSE[c]}`).join(", ")}`,
    );
  }
  if (tools.has("phonetic")) {
    parts.push(`PHONETIC ALPHABET:\n${CHARACTERS.map((c) => `${c} ${PHONETIC[c]}`).join(", ")}`);
  }
  if (tools.has("semaphore")) {
    parts.push(
      `SEMAPHORE (flag positions as clock directions seen by the person watching: 6 = down, 7.5 = low left, 9 = left, 10.5 = high left, 12 = up, 1.5 = high right, 3 = right, 4.5 = low right):\n${Object.entries(
        SEMAPHORE,
      )
        .map(([c, [a, b]]) => `${c} ${a}&${b}`)
        .join(", ")}`,
    );
  }
  return parts.join("\n\n");
}

// ------------------------------------------------------------ system prompts

export function scoutSystemPrompt(input: {
  section: Section;
  badgeId?: string;
  taskId?: string;
  step?: number;
  statuses: Record<string, Record<string, TaskState | undefined>>;
  lockedBadgeIds: string[];
}) {
  const badge = input.badgeId ? getBadge(input.badgeId) : undefined;
  const task = badge && input.taskId ? getTask(badge, input.taskId) : undefined;
  const tools = new Set((task?.steps ?? []).flatMap((s) => s.tools ?? []));

  const where = task
    ? `They are working on the task "${task.title}" in ${badgeName(badge!)}${input.step !== undefined ? `, on step ${input.step + 1}` : ""}.`
    : badge
      ? `They are looking at the ${badgeName(badge)} badge page.`
      : "They are on their badges overview page.";

  return [
    "You are the friendly helper inside the PG Scouts JOTA-JOTI badge app. JOTA-JOTI is Jamboree On The Air and Jamboree On The Internet, when Scouts around the world chat by radio and online.",
    SAFETY_RULES,
    `THE YOUNG PERSON: a ${sectionName(input.section)} (${input.section === "beavers" ? "about 6 to 8, keep it very simple" : input.section === "cubs" ? "about 8 to 10" : "about 10 to 14"}). ${where}`,
    input.lockedBadgeIds.length
      ? `Locked for them right now (they must finish the previous stage first): ${input.lockedBadgeIds.map((id) => badgeName(getBadge(id)!)).join(", ")}.`
      : "",
    SCOUT_APP_GUIDE,
    task ? describeTask(task, input.step) : "",
    badge ? describeBadge(badge, input.statuses[badge.id]) : "",
    `BADGES AVAILABLE TO THEM:\n${catalogue(input.section)}`,
    codesReference(tools),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function leaderSystemPrompt() {
  const detail = BADGES.map((b) =>
    [
      describeBadge(b),
      ...b.tasks.map(
        (t) =>
          `  * ${t.title}: ${t.summary} ${t.review === "leader" ? `Leader checks. Look for: ${t.leaderCheck ?? "the task done as described"}` : "Self check."}${t.minutes ? ` About ${t.minutes} min.` : ""} Steps: ${t.steps.map((s) => s.title).join(" → ")}`,
      ),
    ].join("\n"),
  ).join("\n\n");
  return [LEADER_RULES, LEADER_APP_GUIDE, SCOUT_APP_GUIDE, `ALL BADGES IN THE APP:\n\n${detail}`].join("\n\n");
}

/** Messages that suggest a young person may need an adult to check in. */
const WORRY = /\b(kill (my)?self|suicid|self[- ]?harm|cut(ting)? myself|want to die|hurt(s|ing)? me|hit(s|ting)? me|abus|touch(ed|es|ing) me|scared|frightened|unsafe|bull(y|ied|ying)|groom|send (me )?(nudes?|pics|photos)|keep (it|this) (a )?secret|run(ning)? away)/i;

export function needsLeaderAttention(text: string) {
  return WORRY.test(text);
}
