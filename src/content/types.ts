import type { Section } from "@/lib/db/schema";

export type { Section };

export type LinkRef = {
  label: string;
  url: string;
  /** one short line shown under the link */
  note?: string;
};

/** Interactive helpers that can be dropped into a walkthrough step. */
export type ToolId =
  | "morse"
  | "phonetic"
  | "semaphore"
  | "persuasion"
  | "emoji"
  | "timeline"
  | "password"
  | "fact-opinion"
  | "leaf-guide"
  | "timer-10"
  | "timer-2";

/**
 * A simple auto-check on a text answer. The scout sees instant feedback; it
 * never blocks submitting.
 */
export type AnswerCheck =
  | { kind: "equals"; answer: string; success: string }
  | { kind: "morse-of-name"; success: string };

type FieldBase = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
};

export type FieldDef =
  | (FieldBase & {
      kind: "text";
      placeholder?: string;
      long?: boolean;
      minWords?: number;
      check?: AnswerCheck;
      /** render answers in a monospace font (Morse code etc.) */
      mono?: boolean;
    })
  | (FieldBase & { kind: "list"; count: number; min?: number; placeholder?: string })
  | (FieldBase & {
      kind: "table";
      columns: { id: string; label: string; placeholder?: string }[];
      rows: number;
      minRows?: number;
    })
  | (FieldBase & { kind: "choice"; options: string[] })
  | (FieldBase & { kind: "checklist"; items: string[]; requireAll?: boolean; /** at least this many ticked (default 1) */ min?: number })
  | (FieldBase & {
      kind: "upload";
      accept?: string;
      multiple?: boolean;
      /** offer the in-app studio to make it here (first = the main button) */
      studio?: StudioMode[];
    })
  | (FieldBase & { kind: "led" });

/** What the in-app studio makes: a free drawing, a one-page poster, or slides. */
export type StudioMode = "drawing" | "poster" | "slides";

export type StepImage = { src: string; alt: string; caption?: string };

export type StepDef = {
  title: string;
  /** paragraphs; **bold** is supported */
  body?: string[];
  /** a numbered list of things to do */
  todo?: string[];
  /** a bulleted list (ideas, questions to think about) */
  bullets?: string[];
  images?: StepImage[];
  /** images hidden behind a "peek" button, e.g. finished code */
  spoiler?: StepImage[];
  tip?: string;
  warning?: string;
  links?: LinkRef[];
  tools?: ToolId[];
  fields?: FieldDef[];
  /** this step happens with a leader watching or listening */
  withLeader?: boolean;
  /** shown as a "Stuck?" panel */
  stuck?: { problem: string; fix: string }[];
  /** they can explain this to the AI leader in a chat instead of a real leader */
  explain?: ExplainDef;
  /** a pretend email inbox or phone, where they send a message to the AI leader */
  simulate?: SimulateDef;
};

/**
 * Send a message to "Akela" (the AI leader) in a pretend email inbox or phone.
 * Once a message does everything in `points`, the answers in `fills` are filled
 * in from it, and when every simulated step is done the task is sent and the
 * AI leader ticks it off.
 */
export type SimulateDef = {
  /** email inbox, phone texting, let them choose, or a video message recorded on the pretend phone */
  kind: "email" | "sms" | "either" | "video";
  /** what their message has to do (used to judge it and to explain what's missing) */
  points: string[];
  /** answers to fill in from what they sent (field ids) */
  fills?: {
    subject?: string;
    body?: string;
    /** a choice field recording which they used, and its option for each */
    how?: { field: string; email: string; sms: string };
  };
  /** a texting test: at least this many words, typed at least this fast; pasting is blocked */
  speedTest?: { minWords: number; minWpm: number };
  /** a video message: the upload field it's saved to, and the longest recording allowed */
  video?: { field: string; maxSeconds: number };
};

/** An "explain it to a leader" step that can be done as a chat with the AI leader. */
export type ExplainDef = {
  /** finishes the sentence "Can you explain …" */
  topic: string;
  /**
   * What a good explanation covers. `idea` is used to judge it (never shown);
   * `ask` is a question that prompts for it without giving the answer away.
   */
  points: { idea: string; ask: string }[];
  /** how many of the points they need (default: all) */
  need?: number;
};

export type TaskDef = {
  id: string;
  title: string;
  /** one line for lists */
  summary: string;
  emoji: string;
  minutes?: number;
  /** self = done when the scout finishes it; leader = waits for a leader to approve */
  review: "self" | "leader";
  /** what the leader should look for before approving */
  leaderCheck?: string;
  /** shown on the first screen, e.g. "Already done this in Radio? It counts here too." */
  note?: string;
  steps: StepDef[];
};

export type ChoiceOption = {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  taskIds: string[];
};

export type PartDef =
  | { kind: "task"; taskId: string }
  | {
      kind: "choice";
      id: string;
      title: string;
      description: string;
      pick: number;
      options: ChoiceOption[];
    };

export type BadgeFamily = "communicator" | "digital-citizen" | "digital-maker";

export type BadgeDef = {
  id: string;
  title: string;
  family: BadgeFamily;
  stage?: number;
  /** sections this badge appears for */
  sections: Section[];
  /** sections we suggest this badge to */
  recommendedFor: Section[];
  /** badge colours: main fill + ring */
  color: string;
  ring: string;
  /** text colour that reads on `color` */
  ink: string;
  tagline: string;
  intro: string;
  /** the printable sheet this badge is based on */
  sheet?: LinkRef;
  officialUrl: string;
  /** badge id that must be finished (all tasks done) before this one can be started */
  prerequisite?: string;
  tasks: TaskDef[];
  parts: PartDef[];
};
