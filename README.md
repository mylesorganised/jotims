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

## JOTI chat guide (`/chat`)

A "JOTI chat" page (in the menu, and on the login page) walks young people
into the official JOTA-JOTI chat at
[chat.jotajoti.info](https://chat.jotajoti.info/home), which runs on
Rocket.Chat and logs in with a Scout.org account:

- **Age first.** Scout.org accounts are for 13 and over, so younger children
  (all Beavers and Cubs, and younger Scouts) are told to chat with a leader
  or grown-up who logs in and stays with them. That's the worldwide
  JOTA-JOTI rule. Logged-in young people skip the question (it uses their
  birthday).
- **13 and over:** how to get a free email with no phone number (Proton
  Mail), or use the Google, Microsoft or Apple buttons; what to type in each
  box of the Scout.org sign-up form (with a last-name initial, so their name
  in the chat stays short); logging in; and checking their profile.
- **How the chat works:** a clickable picture of the chat screen with
  numbered parts, a **practice chat** (join, send messages, react, and a
  pretend stranger's private message to practise the safe response), links
  into the main rooms, copy-and-paste starter messages, what a JID is, chat
  words and the safety rules (including how to report and the Safe From Harm
  email).
- Set your group's **JID** in Settings to show it on the page.

The chat can't be shown inside this site: chat.jotajoti.info blocks being
framed by other sites, and its logins only work on its own site. So the
guide opens it in a new tab.

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
  unsafe. Messages that suggest a young person might be unsafe, upset or
  bullied are flagged (by Jev when `JEV_API_KEY` is set, otherwise by a
  keyword list): their hand goes up on the dashboard and the chat is
  highlighted. Every chat is saved and readable in **Helper chats** (young
  people are told leaders can read them).
- **Privacy**: requests only go to OpenRouter providers that don't collect or
  train on prompts. Names are never sent, only their section and the page
  they're on.
- **Knows their progress**: what each young person has finished, what's
  waiting for a leader, what needs changes and what's left, so it suggests the
  right next task.
- **Points at things**: its replies include 👉 **Show me** buttons that
  spotlight the place on screen (opening the right page first), and
  **Walk me through it** buttons for step-by-step guidance.
- **Limits**: 40 questions per person per hour.

To switch it on, add an OpenRouter API key as `OPENROUTER_API_KEY`: in
`.env.local` for your computer, and in Vercel (Settings → Environment
Variables) for the live site, then redeploy. Without a key the button simply
doesn't appear. Optional: `OPENROUTER_MODEL` to use a different model, and
`OPENROUTER_ALLOW_DATA_COLLECTION=true` if no privacy-respecting provider is
available.

## AI leader (optional)

An AI leader can check work as it comes in, so young people hear back in
seconds instead of waiting for a leader to get to the queue. It's built from
two models, each doing what it's good at:

- **[Jev](https://typesafe.ai)** (TypeSafe) makes the judgments: does the work
  meet the task's "what to look for" note, is every question genuinely
  answered, how much effort for their age, and is there anything worrying,
  any personal details, or any attempt to trick the marker. It returns
  calibrated probabilities in about a quarter of a second for a tiny fraction
  of a penny, and fixed thresholds in `src/lib/ai/reviewer.ts` turn those into
  decisions.
- **GLM 5.3 Flash** (the helper's model) reads uploaded screenshots so Jev can
  judge them (the words on each slide of a PowerPoint are read directly), and writes the kind, specific note the young person gets. Jev
  checks that note before it's sent.

What it does:

- **Work sent to a leader**: approves it when it clearly meets the
  requirement, sends it back with feedback when it clearly isn't done, and
  otherwise leaves it in the Review queue with a note saying why (not sure,
  personal details, or something worrying, which also puts the young person's
  hand up). After three send-backs it stops and leaves it for a person.
- **In-person tasks**: Jev decides per task whether only a leader who saw it
  (a phone call, a chat, signing) or received it (an email or video) can
  confirm it. For those it only checks the written part, unless you switch on
  "Also approve tasks a leader would normally see or receive" in Settings.
- **Badge sign-off**: when every task for a badge is done, it checks the
  self-check tasks weren't rushed and signs the badge off. If one clearly
  wasn't done, it reopens it with feedback; if it's unsure, it leaves the
  badge for a leader. Tasks a leader already ticked off are trusted.
- Every decision is in the activity feed and on the Review page ("How it
  decided" shows the scores and what it saw in each upload). Leaders can
  reopen anything or undo a sign-off, and can ask the AI to review a
  submission (or everything waiting) from the Review page.

**Notifications**: young people get a 🔔 in the header. When a leader or the
AI approves work, asks for changes or signs off a badge, a message pops up
within a few seconds (with confetti for badges), the page updates itself, and,
if they allow it, their browser alerts them while they're in another tab
(e.g. Scratch).

To switch it on, add a TypeSafe API key as `JEV_API_KEY` (in `.env.local` and
in Vercel), plus `OPENROUTER_API_KEY` for feedback notes and reading
screenshots. Each part can be turned off in Settings.

## Guided tours

Spotlight walkthroughs dim the page and explain each part in turn: "Getting
started" and "How tasks work" for young people; a dashboard tour, "Adding
young people" and "Signing off badges" for leaders. They're offered on the
first visit and can be rerun from the helper. Tours find things on the page
by their `data-tour` tags; the places and tours are listed in
`src/lib/tour/registry.ts`.

## What leaders get (`/admin`)

- **Dashboard**: who needs help, what's waiting for review, badges ready to
  sign off and the latest activity. It refreshes by itself.
- **Review**: every answer and upload, with "what to look for" notes. Approve
  or ask for changes with a message the young person sees (they're notified
  straight away). With the AI leader on, each submission shows what it
  decided and why. PowerPoint files (.pptx) open in a **slide viewer** in the
  browser ("View slides"), so you don't need PowerPoint; PDFs, pictures and
  videos open in the browser too.
- **Helper chats**: every conversation anyone has had with the AI helper
  (young people and leaders), newest first, with the full transcript, the
  page or task it was asked on, and anything flagged. Filter by young people,
  leaders or flagged, search questions, answers and names, or download them
  all as a CSV. Each young person's page links to just their chats.
- **Young people**: search and filter by section, add one person or paste a
  whole list, edit details and remove people. Each person's page shows every
  badge and task: tick off work done on paper, reopen tasks, sign off badges
  (with an optional note) or undo a sign-off.
- **Badge tracker**: a grid of everyone × every badge, plus **CSV export**.
- **Badge library**: every badge and task with its "what to look for" note,
  and a **Preview** of each task exactly as young people see it (tools,
  pictures and all; nothing is saved).
- **Leaders**: proper accounts with a username and password. Add leaders,
  reset passwords and change your own.
- **Settings**: event name, allow self sign-up, an optional **group code**
  (e.g. written on the wall) that young people need to log in, your group's
  JOTA-JOTI **JID** (shown in the chat guide), and the AI leader switches.

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
- The AI leader sees a young person's section, age and answers (never their
  name) and descriptions of their uploaded images. It never approves work
  containing personal details or anything worrying; those go to a leader.
- Deleting a young person deletes all their answers, uploaded files, messages
  and AI reviews.
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
