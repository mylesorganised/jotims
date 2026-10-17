# PG Scouts · JOTA-JOTI badge tracker

A website for working through JOTA-JOTI badges. Young people log in with their
name and birthday, follow each badge task step by step, fill in answers and
upload evidence. Leaders review the work, tick things off and sign off badges.

Badges included (built from the group's own sheets):

| Badge | Who | How it's set up |
| --- | --- | --- |
| Communicator | Beavers, Cubs and Scouts each get their own version | Beavers: 5 tasks. Cubs: 4 tasks + 3 of 4 extras. Scouts: 3 of 4 subjects |
| Digital Citizen Stages 1–3 | Everyone | Every task in the stage |
| Digital Citizen Stage 4 | Scouts | 1 of 2 rights tasks, then a debate, Scout Law, online course and a team project |
| Digital Maker Stages 1–3 | Everyone | Every task in the stage |
| Digital Maker Stages 4–5 | Scouts | Open-ended build projects, all doable on a laptop with simulators (MakeCode, Wokwi) |

Stages unlock in order: Stage 2 opens once every Stage 1 task is done, and
Stage 3 once Stage 2 is. If someone did an earlier stage at another time, a
leader can tick it off or sign it off on their page, which unlocks the next one.

## What young people get

- **Easy login**: first name, last name and birthday. If they're not on the
  list yet they pick their section and join (you can turn this off).
- **Step-by-step walkthroughs** for every task: what to do, tick-off to-do
  lists, screenshots from the guides, tips, safety notes and links.
- **Built-in helpers**: Morse code (with sound and a flashing light), phonetic
  alphabet, semaphore, the digital persuasion game, a reaction emoji board,
  technology timeline cards, a password tester, fact-or-opinion quiz, leaf
  identifier, timers and a micro:bit LED designer.
- **Answers save automatically.** Some answers check themselves (e.g. decoding
  the secret messages). Photos and screenshots upload straight from a phone or
  laptop, and big photos are shrunk first.
- **"Ask for help"** puts their hand up on the leaders' dashboard.
- **Links never take them out of the app**: websites, printable sheets and
  uploaded files always open in a new tab.
- Tasks are either **"You tick this off"** (done when they finish) or **"Leader
  checks this"** (waits for a leader to approve).

## AI helper (optional)

A floating **"Ask the helper"** button lets young people ask questions about
the step they're on. Leaders get their own **"Leader helper"** in the admin
area for questions about the app and the badges. It uses **GLM 5.3 Flash**
through [OpenRouter](https://openrouter.ai) (about $0.03 per million tokens
in, so a typical question costs a tiny fraction of a penny).

- **What it knows**: how the app works, every badge and task, the exact step
  the young person is on (with its tips, links and "stuck" fixes), and the
  Morse, phonetic and semaphore charts. It's never given the answers to the
  auto-checked puzzles, and it's told to give hints, not do the work.
- **Safety**: written for ages 6–14; never asks for personal details; points
  to a leader, "Ask for help" or Childline if someone seems worried or
  unsafe. Messages that mention things like bullying or being hurt are
  flagged: the young person's hand goes up on the dashboard and the chat is
  highlighted. Every young person's chats are visible on their page in the
  leaders' area.
- **Privacy**: requests only go to OpenRouter providers that don't collect or
  train on prompts. Names are never sent, only their section and the page
  they're on.
- **Limits**: 40 questions per person per hour.

To switch it on, add an OpenRouter API key as `OPENROUTER_API_KEY`: in
`.env.local` for your computer, and in Vercel (Settings → Environment
Variables) for the live site, then redeploy. Without a key the button simply
doesn't appear. Optional: `OPENROUTER_MODEL` to use a different model, and
`OPENROUTER_ALLOW_DATA_COLLECTION=true` if no privacy-respecting provider is
available.

## What leaders get (`/admin`)

- **Dashboard**: who needs help, what's waiting for review, badges ready to
  sign off and the latest activity. It refreshes by itself.
- **Review**: every answer and upload, with "what to look for" notes. Approve
  or ask for changes with a message the young person sees.
- **Young people**: search and filter by section, add one person or paste a
  whole list, edit details and remove people. Each person's page shows every
  badge and task: tick off work done on paper, reopen tasks, sign off badges
  (with an optional note) or undo a sign-off.
- **Badge tracker**: a grid of everyone × every badge, plus **CSV export**.
- **Leaders**: proper accounts with a username and password. Add leaders,
  reset passwords and change your own.
- **Settings**: event name, allow self sign-up, and an optional **group code**
  (e.g. written on the wall) that young people need to log in.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20.9 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open <http://localhost:3000> for the young people's side and
<http://localhost:3000/admin> for leaders. The first time you open `/admin`
it asks you to create your leader account.

Nothing else to set up. Locally the app uses an embedded Postgres database
(PGlite) and keeps uploads on disk, all inside the `.data/` folder. To start
again from empty, stop the server and run:

```bash
npm run reset-local
```

Other handy commands: `npm run build` (production build), `npm run lint`,
`npm run typecheck`.

## Put it live on Vercel

1. **Put the code on GitHub** and import the repository in
   [Vercel](https://vercel.com/new). It's detected as Next.js; the default
   settings are fine.
2. **Add a database.** In the Vercel project go to *Storage → Create Database →
   Neon (Postgres)* and connect it to the project. That sets `DATABASE_URL`.
3. **Add file storage.** *Storage → Create → Blob*, choose a **private** store
   and connect it. That sets `BLOB_READ_WRITE_TOKEN`. (Made a public store
   instead? Also add `BLOB_ACCESS=public`.)
4. **Add environment variables** under *Settings → Environment Variables*:
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD`: your first leader login (and
     optionally `ADMIN_NAME`, e.g. `Akela`). These are only used to create the
     first account; after that, manage leaders and passwords in the app.
   - `SESSION_SECRET`: a long random string, e.g. from `openssl rand -base64 32`.
5. **Deploy** (or redeploy after adding storage and variables). The database
   tables are created automatically on the first visit.
6. Go to `https://your-site.vercel.app/admin`, log in, then add your young
   people under **Young people** (paste a list from a spreadsheet or OSM).

To try the live database from your computer, run `vercel env pull .env.local`
and then `npm run dev`. Be careful: you're then editing real data.

## Safeguarding and privacy

- Name + birthday is a convenience login, not a strong one: anyone who knows a
  young person's name and birthday could log in as them. To tighten it, turn
  off self sign-up once everyone's added and set a **group code** in Settings.
- Uploaded files are stored privately and are only ever served through the app,
  to the young person who uploaded them or a leader.
- The app never asks young people to type phone numbers or addresses, and the
  safety steps remind them not to.
- Deleting a young person deletes all their answers and uploaded files.
- After the event, export the CSV for your records (e.g. to update OSM), then
  consider deleting people you no longer need to keep.

## Changing the badge content

Everything young people see lives in `src/content/`:

- `communicator.ts`, `digital-citizen.ts`, `digital-maker.ts`: each badge, its
  tasks and their steps.
- `links.ts`: every external link in one place.
- `types.ts`: what a step can contain (`body`, `todo`, `bullets`, `images`,
  `tip`, `warning`, `links`, `tools`, `fields`…) and the field types
  (`text`, `list`, `table`, `choice`, `checklist`, `upload`, `led`).

Set `review: "leader"` on a task to make it wait for a leader, or
`review: "self"` to let young people tick it off. A badge's `parts` list says
what's needed: single tasks, or a `choice` like "pick 3 of these 4". Saved
answers are keyed by field `id`, so keep ids stable once people have started.

The printable sheets are in `public/resources/` and the guide screenshots in
`public/guides/`.

## How it's built

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Cache
  Components), React 19, Tailwind CSS 4.
- [Drizzle ORM](https://orm.drizzle.team) on Postgres: PGlite locally, Neon (or
  any Postgres via `DATABASE_URL`) in production. Tables are created on first
  connection (`src/lib/db/schema.ts`).
- Uploads: local disk in development, [Vercel Blob](https://vercel.com/docs/vercel-blob)
  (direct browser uploads, private access) in production.
- Sessions are signed cookies (`jose`). Leader passwords are hashed with scrypt.

```
src/
  app/(scout)/      young people's pages: /home, /badges/…, /toolbox
  app/admin/        leaders' area
  app/actions/      server actions (scout.ts, leader.ts)
  app/api/          uploads, file serving, CSV export
  components/       UI, the task walkthrough, tools
  content/          badge definitions
  lib/              database, auth, progress rules, validation
```
