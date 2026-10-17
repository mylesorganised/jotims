import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type Section = "beavers" | "cubs" | "scouts";

/** draft = started, submitted = waiting for a leader, changes = leader asked for changes, done = complete */
export type TaskStatus = "draft" | "submitted" | "changes" | "done";

export type AnswerValue = string | string[] | string[][] | boolean[];
export type Answers = Record<string, AnswerValue>;

export const scouts = pgTable(
  "scouts",
  {
    id: text("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    /** YYYY-MM-DD */
    dob: text("dob").notNull(),
    section: text("section").$type<Section>().notNull(),
    /** lower-cased first|last|dob, used to match logins */
    nameKey: text("name_key").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("scouts_name_key_idx").on(t.nameKey)],
);

export const taskProgress = pgTable(
  "task_progress",
  {
    id: text("id").primaryKey(),
    scoutId: text("scout_id")
      .notNull()
      .references(() => scouts.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(),
    taskId: text("task_id").notNull(),
    status: text("status").$type<TaskStatus>().notNull().default("draft"),
    answers: jsonb("answers").$type<Answers>().notNull().default({}),
    /** index of the furthest walkthrough step the scout has reached */
    stepReached: integer("step_reached").notNull().default(0),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by"),
    feedback: text("feedback"),
    helpRequestedAt: timestamp("help_requested_at", { withTimezone: true }),
    helpMessage: text("help_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("task_progress_scout_task_idx").on(t.scoutId, t.badgeId, t.taskId)],
);

export const uploads = pgTable("uploads", {
  id: text("id").primaryKey(),
  scoutId: text("scout_id")
    .notNull()
    .references(() => scouts.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull(),
  taskId: text("task_id").notNull(),
  fieldId: text("field_id").notNull(),
  /** "local" = file in .data/uploads, "blob" = Vercel Blob */
  storage: text("storage").$type<"local" | "blob">().notNull(),
  /** local file name, or the blob pathname */
  storageKey: text("storage_key").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const badgeAwards = pgTable(
  "badge_awards",
  {
    scoutId: text("scout_id")
      .notNull()
      .references(() => scouts.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(),
    signedOffBy: text("signed_off_by").notNull(),
    signedOffAt: timestamp("signed_off_at", { withTimezone: true }).notNull().defaultNow(),
    note: text("note"),
  },
  (t) => [primaryKey({ columns: [t.scoutId, t.badgeId] })],
);

export const leaders = pgTable(
  "leaders",
  {
    id: text("id").primaryKey(),
    /** lower-case login name */
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    /** scrypt hash, see lib/passwords.ts */
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("leaders_username_idx").on(t.username)],
);

/** Conversations with the AI helper (young people's and leaders'), kept so leaders can read them. */
export const helperMessages = pgTable("helper_messages", {
  id: serial("id").primaryKey(),
  /** set for a young person's chat */
  scoutId: text("scout_id").references(() => scouts.id, { onDelete: "cascade" }),
  /** set for a leader's chat (kept if the leader is later removed) */
  leaderId: text("leader_id"),
  leaderName: text("leader_name"),
  /** one chat from opening the helper to "start again"; null for chats logged before this existed */
  conversationId: text("conversation_id"),
  /** the page they were on */
  page: text("page"),
  badgeId: text("badge_id"),
  taskId: text("task_id"),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  flagged: integer("flagged").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Messages for young people: approvals, changes requested, badges signed off. */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  scoutId: text("scout_id")
    .notNull()
    .references(() => scouts.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"approved" | "changes" | "awarded" | "help">().notNull(),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** What the AI reviewer decided for a submission, and why (for leaders to audit). */
export const aiReviews = pgTable("ai_reviews", {
  id: serial("id").primaryKey(),
  progressId: text("progress_id")
    .notNull()
    .references(() => taskProgress.id, { onDelete: "cascade" }),
  scoutId: text("scout_id")
    .notNull()
    .references(() => scouts.id, { onDelete: "cascade" }),
  /** see Decision in lib/ai/reviewer.ts */
  decision: text("decision").notNull(),
  reason: text("reason").notNull(),
  scores: jsonb("scores").$type<Record<string, number>>().notNull().default({}),
  evidence: jsonb("evidence").$type<Record<string, string[]>>().notNull().default({}),
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const activity = pgTable("activity", {
  id: serial("id").primaryKey(),
  scoutId: text("scout_id").references(() => scouts.id, { onDelete: "cascade" }),
  badgeId: text("badge_id"),
  taskId: text("task_id"),
  kind: text("kind").notNull(),
  actor: text("actor").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Hand-written DDL run on first connection, so there is no migration step to
 * remember locally or on Vercel. Keep it in sync with the tables above.
 */
export const bootstrapSql = [
  `CREATE TABLE IF NOT EXISTS scouts (
    id text PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dob text NOT NULL,
    section text NOT NULL,
    name_key text NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS scouts_name_key_idx ON scouts (name_key)`,
  `CREATE TABLE IF NOT EXISTS task_progress (
    id text PRIMARY KEY,
    scout_id text NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    badge_id text NOT NULL,
    task_id text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    step_reached integer NOT NULL DEFAULT 0,
    submitted_at timestamptz,
    reviewed_at timestamptz,
    reviewed_by text,
    feedback text,
    help_requested_at timestamptz,
    help_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS task_progress_scout_task_idx ON task_progress (scout_id, badge_id, task_id)`,
  `CREATE TABLE IF NOT EXISTS uploads (
    id text PRIMARY KEY,
    scout_id text NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    badge_id text NOT NULL,
    task_id text NOT NULL,
    field_id text NOT NULL,
    storage text NOT NULL,
    storage_key text NOT NULL,
    file_name text NOT NULL,
    content_type text NOT NULL,
    size integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS uploads_scout_task_idx ON uploads (scout_id, badge_id, task_id)`,
  `CREATE TABLE IF NOT EXISTS badge_awards (
    scout_id text NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    badge_id text NOT NULL,
    signed_off_by text NOT NULL,
    signed_off_at timestamptz NOT NULL DEFAULT now(),
    note text,
    PRIMARY KEY (scout_id, badge_id)
  )`,
  `CREATE TABLE IF NOT EXISTS leaders (
    id text PRIMARY KEY,
    username text NOT NULL,
    display_name text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS leaders_username_idx ON leaders (username)`,
  `CREATE TABLE IF NOT EXISTS helper_messages (
    id serial PRIMARY KEY,
    scout_id text NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    badge_id text,
    task_id text,
    role text NOT NULL,
    content text NOT NULL,
    flagged integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS helper_messages_scout_idx ON helper_messages (scout_id, created_at DESC)`,
  `ALTER TABLE helper_messages ALTER COLUMN scout_id DROP NOT NULL`,
  `ALTER TABLE helper_messages ADD COLUMN IF NOT EXISTS leader_id text`,
  `ALTER TABLE helper_messages ADD COLUMN IF NOT EXISTS leader_name text`,
  `ALTER TABLE helper_messages ADD COLUMN IF NOT EXISTS conversation_id text`,
  `ALTER TABLE helper_messages ADD COLUMN IF NOT EXISTS page text`,
  `CREATE INDEX IF NOT EXISTS helper_messages_conversation_idx ON helper_messages (conversation_id, id)`,
  `CREATE INDEX IF NOT EXISTS helper_messages_created_idx ON helper_messages (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id serial PRIMARY KEY,
    scout_id text NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    kind text NOT NULL,
    title text NOT NULL,
    body text,
    href text,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS notifications_scout_idx ON notifications (scout_id, id DESC)`,
  `CREATE TABLE IF NOT EXISTS ai_reviews (
    id serial PRIMARY KEY,
    progress_id text NOT NULL REFERENCES task_progress(id) ON DELETE CASCADE,
    scout_id text NOT NULL REFERENCES scouts(id) ON DELETE CASCADE,
    decision text NOT NULL,
    reason text NOT NULL,
    scores jsonb NOT NULL DEFAULT '{}'::jsonb,
    evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
    feedback text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ai_reviews_progress_idx ON ai_reviews (progress_id, id DESC)`,
  `CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS activity (
    id serial PRIMARY KEY,
    scout_id text REFERENCES scouts(id) ON DELETE CASCADE,
    badge_id text,
    task_id text,
    kind text NOT NULL,
    actor text NOT NULL,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS activity_created_idx ON activity (created_at DESC)`,
];
