import "server-only";
import { BADGES, badgeName, getBadge, getTask, sectionName, type BadgeDef, type FieldDef, type StepDef, type TaskDef } from "@/content";
import type { Section } from "@/lib/db/schema";
import { CHARACTERS, MORSE, PHONETIC, SEMAPHORE } from "@/lib/codes";
import { badgeProgress, lockedBy, TASK_STATE_LABEL, type TaskState } from "@/lib/progress";
import { ANCHORS, TOURS, type TourScope } from "@/lib/tour/registry";

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
- Sometimes the "AI leader" checks work or signs off a badge instead of a person, usually within a minute. It's a computer helper the leaders have switched on; real leaders can see everything it does.
- "JOTI chat" (top of every page, /chat) is a guide to the official JOTA-JOTI chat at chat.jotajoti.info (it runs on Rocket.Chat and always opens in a new tab; it can't appear inside this site). It has: an age question (the chat is for 13 and over; under-13s chat with a leader or grown-up who logs in and sits with them, which is the worldwide JOTA-JOTI rule, so never help an under-13 make their own account); for 13+: step 1 get an email (free Proton Mail at account.proton.me/mail/signup?plan=free with no phone number, or use the Google/Microsoft/Apple buttons if they already have one, with a grown-up's OK), step 2 make a Scout.org account (chat → "Login with Scout.org" → "NOT A MEMBER YET? REGISTER", fill in username, password, email, first name, last-name initial, country United Kingdom, tick "I'm scout" and choose The Scout Association, language, date of birth, the robot check and terms, then REGISTER and confirm the email if asked), step 3 log in ("Login with Scout.org" → username/email and password → LOGIN), step 4 check their profile shows no surname or face photo. Then a clickable picture explaining the chat screen, a practice chat, links to rooms, copy-and-paste starter messages, what a JID is (swap them only in the JID Exchange room) and the safety rules (stay in public rooms, never share personal details or socials, don't reply to private messages from strangers: report them with the message's ⋮ menu and tell a leader; Safe From Harm email safejotajoti@scout.org).
- In the chat: Home (house icon) lists the main rooms; Directory shows all rooms; press the blue Join button at the bottom of a room before typing; read the rules banner; use @name to reply to someone; hover over a message for reactions, replies and ⋮ → Report.
- The bell (🔔) at the top shows messages: work approved, a leader (or the AI leader) asking for changes, or a badge signed off. A pop-up appears too, and the page updates by itself. Tapping "Tell me even when I'm on another tab" in the bell lets the browser alert them while they're in Scratch or MakeCode.
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
- Badge library: every badge and task with "what to look for" notes, and a Preview of each task exactly as young people see it (nothing is saved in a preview).
- Settings: event name, "Let new young people add themselves" (turn off once everyone is added), an optional group code young people must type to log in, and the AI leader switches.
- Helper chats (/admin/chats, top menu): every conversation with the AI helper, from young people and leaders, newest first. Filter by All / Young people / Leaders / Flagged, search questions, answers or names, open a conversation to read the full transcript (with the page or task it was asked on), or "Download all (CSV)". A young person's page links to just their chats. Flagged chats are ones the safeguarding check thought a leader should follow up.
- Uploaded PowerPoint files (.pptx) open in a slide viewer in the browser: press "View slides" on the file (no PowerPoint needed; arrow keys move between slides; the file never leaves the app). The AI leader also reads the words on each slide when reviewing.
- JOTI chat guide (/chat, linked in the young people's menu): how to get into the official JOTA-JOTI chat (chat.jotajoti.info, Rocket.Chat, Scout.org login). Scout.org accounts are 13+, so under-13s are shown a "chat with a leader" route; 13+ get steps for a free no-phone Proton Mail address, the Scout.org sign-up form, logging in and a privacy check, plus a practice chat, room links, starter messages and safety rules. Set the group's JID in Settings to show it there. The chat can't be embedded in this site (chat.jotajoti.info blocks being framed and only allows logins on its own site).
- AI leader (when switched on): checks work sent to a leader within seconds. It approves work that clearly meets the "what to look for" note, sends back work that clearly isn't finished with a kind, specific note, and leaves anything unclear, worrying or containing personal details in the Review queue with a note saying why. For tasks a leader has to see or receive in person (phone calls, chats, signing, emails to a leader) it only checks the written part unless "Also approve tasks a leader would normally see or receive" is on. When every task for a badge is done it checks the self-check tasks and signs the badge off (or reopens one that clearly wasn't done). Its decisions show on the Review page ("How it decided") and in the activity feed as "AI leader". Leaders can always reopen a task or undo a sign-off, and can press "Ask the AI leader" on a submission or "AI review … waiting" on the Review page.
- Young people get a bell in their header: when work is approved, sent back or a badge is signed off (by a leader or the AI), a message pops up within seconds and their page updates.
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

export function describeBadge(badge: BadgeDef, statuses?: Record<string, TaskState | undefined>, withIds = false) {
  const status = (id: string) =>
    `${statuses ? ` [${TASK_STATE_LABEL[statuses[id] ?? "todo"]}]` : ""}${withIds ? ` [task:${badge.id}/${id}]` : ""}`;
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

function pointingGuide(scope: TourScope, path?: string) {
  const places = ANCHORS.filter((a) => a.scope === scope)
    .map((a) => `- ${a.id}: ${a.title} (${a.where})`)
    .join("\n");
  const tours = TOURS.filter((t) => t.scope === scope)
    .map((t) => `- ${t.id}: "${t.title}" (${t.intro})`)
    .join("\n");
  const dynamic =
    scope === "scout"
      ? "\n- badge:<badge id>: a badge's card on My badges (badge ids are shown as [badge:…] in their progress)\n- task:<badge id>/<task id>: a task on its badge page (shown as [task:…] in the badge details)"
      : "";
  return `POINTING AT THINGS ON SCREEN
You can show them exactly where things are in the app:
- Put [[show:ID]] straight after the words that mention a place. It becomes a "Show me" button that highlights it (and opens the right page).
- If you describe 2 or more places in order, add ONE [[tour:ID1,ID2,ID3]] at the very end. It becomes a "Walk me through it" button that highlights each place in turn.
- To offer a full guided tour, add [[tour:TOUR_ID]] using a tour below.
- Use these whenever you explain where something is or how to do something in the app. Only use IDs listed here; never make one up, and never write the IDs anywhere else.
${path ? `They are on the page ${path}.\n` : ""}PLACES:
${places}${dynamic}
GUIDED TOURS:
${tours}`;
}

// ------------------------------------------------------------ system prompts

type Statuses = Record<string, Record<string, TaskState | undefined>>;

/** What this young person has finished, started, and has left, badge by badge. */
export function progressSummary(section: Section, statuses: Statuses, awarded: Set<string>) {
  const lines: string[] = [];
  for (const badge of BADGES.filter((b) => b.sections.includes(section))) {
    const name = `${badgeName(badge)} [badge:${badge.id}]`;
    if (awarded.has(badge.id)) {
      lines.push(`- ${name}: FINISHED AND SIGNED OFF by a leader. Don't suggest it again.`);
      continue;
    }
    const before = lockedBy(badge, statuses, (id) => awarded.has(id));
    if (before) {
      lines.push(`- ${name}: LOCKED until they finish ${badgeName(before)}.`);
      continue;
    }
    const mine = statuses[badge.id] ?? {};
    const p = badgeProgress(badge, mine, false);
    const titles = (ids: string[]) => ids.map((id) => getTask(badge, id)!.title).join("; ");
    const by = (state: TaskState) => badge.tasks.filter((t) => (mine[t.id] ?? "todo") === state).map((t) => t.id);
    if (p.state === "ready") {
      lines.push(`- ${name}: ALL TASKS DONE, waiting for a leader to sign off the badge.`);
      continue;
    }
    if (p.state === "not-started") {
      lines.push(`- ${name}: not started (${p.required} tasks).`);
      continue;
    }
    const parts = [`- ${name}: in progress, ${p.done} of ${p.required} tasks done.`];
    const done = by("done");
    const waiting = by("submitted");
    const changes = by("changes");
    const draft = by("draft");
    const todo = p.requiredTaskIds.filter((id) => (mine[id] ?? "todo") === "todo");
    if (done.length) parts.push(`Done: ${titles(done)}.`);
    if (changes.length) parts.push(`A LEADER ASKED FOR CHANGES on: ${titles(changes)}.`);
    if (waiting.length) parts.push(`Waiting for a leader to check: ${titles(waiting)}.`);
    if (draft.length) parts.push(`Started but not finished: ${titles(draft)}.`);
    if (todo.length) parts.push(`Not started yet: ${titles(todo)}.`);
    lines.push(parts.join(" "));
  }
  return lines.join("\n");
}

export function scoutSystemPrompt(input: {
  section: Section;
  badgeId?: string;
  taskId?: string;
  step?: number;
  statuses: Statuses;
  awardedBadgeIds: string[];
  path?: string;
}) {
  const badge = input.badgeId ? getBadge(input.badgeId) : undefined;
  const task = badge && input.taskId ? getTask(badge, input.taskId) : undefined;
  const tools = new Set((task?.steps ?? []).flatMap((s) => s.tools ?? []));
  const awarded = new Set(input.awardedBadgeIds);

  const where = task
    ? `They are working on the task "${task.title}" in ${badgeName(badge!)}${input.step !== undefined ? `, on step ${input.step + 1}` : ""}.`
    : badge
      ? `They are looking at the ${badgeName(badge)} badge page.`
      : "They are on their badges overview page.";

  return [
    "You are the friendly helper inside the PG Scouts JOTA-JOTI badge app. JOTA-JOTI is Jamboree On The Air and Jamboree On The Internet, when Scouts around the world chat by radio and online.",
    SAFETY_RULES,
    `THE YOUNG PERSON: a ${sectionName(input.section)} (${input.section === "beavers" ? "about 6 to 8, keep it very simple" : input.section === "cubs" ? "about 8 to 10" : "about 10 to 14"}). ${where}`,
    `THEIR PROGRESS (use this whenever they ask what to do next or where to start; never suggest something they've already finished; a leader's requested changes come first, then tasks they've started, then new ones; locked stages can't be started yet):\n${progressSummary(input.section, input.statuses, awarded)}`,
    SCOUT_APP_GUIDE,
    task ? describeTask(task, input.step) : "",
    badge ? describeBadge(badge, input.statuses[badge.id], true) : "",
    `ALL BADGES AVAILABLE TO THEM:\n${catalogue(input.section)}`,
    pointingGuide("scout", input.path),
    codesReference(tools),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function leaderSystemPrompt(path?: string) {
  const detail = BADGES.map((b) =>
    [
      describeBadge(b),
      ...b.tasks.map(
        (t) =>
          `  * ${t.title}: ${t.summary} ${t.review === "leader" ? `Leader checks. Look for: ${t.leaderCheck ?? "the task done as described"}` : "Self check."}${t.minutes ? ` About ${t.minutes} min.` : ""} Steps: ${t.steps.map((s) => s.title).join(" → ")}`,
      ),
    ].join("\n"),
  ).join("\n\n");
  return [LEADER_RULES, LEADER_APP_GUIDE, SCOUT_APP_GUIDE, pointingGuide("leader", path), `ALL BADGES IN THE APP:\n\n${detail}`].join("\n\n");
}

/** Messages that suggest a young person may need an adult to check in. */
const WORRY = /\b(kill (my)?self|suicid|self[- ]?harm|cut(ting)? myself|want to die|hurt(s|ing)? me|hit(s|ting)? me|abus|touch(ed|es|ing) me|scared|frightened|unsafe|bull(y|ied|ying)|groom|send (me )?(nudes?|pics|photos)|keep (it|this) (a )?secret|run(ning)? away)/i;

export function needsLeaderAttention(text: string) {
  return WORRY.test(text);
}
