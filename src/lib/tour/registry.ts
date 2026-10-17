import { badgeName, getBadge, getTask } from "@/content";

// Places on screen that tours and the helper can point at. Each one matches a
// data-tour="…" attribute in the UI. Shared by the browser (to find and
// explain them) and the server (to tell the helper what it can point at).

export type TourScope = "scout" | "leader";

export type AnchorDef = {
  id: string;
  scope: TourScope;
  title: string;
  text: string;
  /** page it lives on; omitted when it's on every page or only on some pages */
  href?: string;
  /** where it appears, for the helper's benefit */
  where: string;
};

export const ANCHORS: AnchorDef[] = [
  // ---------------------------------------------------------------- scouts
  { id: "nav-home", scope: "scout", title: "My badges", text: "This takes you back to all your badges, any time.", where: "top of every page" },
  { id: "nav-toolbox", scope: "scout", title: "Code toolbox", text: "Morse code, the phonetic alphabet and semaphore: translators, charts and printable sheets.", where: "top of every page" },
  { id: "nav-chat", scope: "scout", title: "JOTI chat", text: "How to get into the JOTA-JOTI chat with Scouts around the world, a practice chat, and safety tips.", where: "top of every page" },
  { id: "chat-card", scope: "scout", title: "JOTI chat", text: "Chat with Scouts around the world: this guide shows you how.", href: "/home", where: "My badges, near the bottom" },
  { id: "chat-open", scope: "scout", title: "Open the chat", text: "Opens the real JOTA-JOTI chat in a new tab.", href: "/chat", where: "top of the JOTI chat page" },
  { id: "chat-age", scope: "scout", title: "How old are you?", text: "Pick your age to see how you get in. Under 13s chat with a leader.", href: "/chat", where: "JOTI chat page, Getting in" },
  { id: "chat-email", scope: "scout", title: "Get an email", text: "How to make a free email address (no phone needed) if you don't have one.", href: "/chat", where: "JOTI chat page, step 1 (13 or older)" },
  { id: "chat-scoutorg", scope: "scout", title: "Scout.org account", text: "What to type in each box of the Scout.org sign-up form.", href: "/chat", where: "JOTI chat page, step 2 (13 or older)" },
  { id: "chat-login", scope: "scout", title: "Log in", text: "How to log in to the chat with your Scout.org account.", href: "/chat", where: "JOTI chat page, step 3 (13 or older)" },
  { id: "chat-screen", scope: "scout", title: "How the chat works", text: "A picture of the chat. Tap the numbers to find out what each part does.", href: "/chat", where: "JOTI chat page, How the chat works" },
  { id: "chat-practice", scope: "scout", title: "Practice chat", text: "A pretend chat room to practise in. Nothing you type goes anywhere.", href: "/chat", where: "JOTI chat page, Practise here first" },
  { id: "chat-rooms", scope: "scout", title: "Rooms to try", text: "Links straight into the best rooms (log in first).", href: "/chat", where: "JOTI chat page, Rooms to try" },
  { id: "chat-starters", scope: "scout", title: "Things to say", text: "Ready-made messages you can copy and paste.", href: "/chat", where: "JOTI chat page, Not sure what to say?" },
  { id: "chat-safety", scope: "scout", title: "Stay safe", text: "The safety rules for the chat, and what to do if something worries you.", href: "/chat", where: "JOTI chat page, Stay safe" },
  { id: "notifications", scope: "scout", title: "Your messages", text: "When a leader (or the AI leader) checks your work or signs off a badge, a message pops up and the bell shows a number. Tap it to see them all.", where: "top right of every page" },
  { id: "helper-button", scope: "scout", title: "The helper", text: "Stuck or confused? Ask me here any time.", where: "bottom right of every page" },
  { id: "home-stats", scope: "scout", title: "Your progress", text: "How many tasks you've finished, how many are with a leader, and how many badges you've earned.", href: "/home", where: "top of My badges" },
  { id: "home-messages", scope: "scout", title: "Messages", text: "If a leader asks you to change something, or approves your work, it shows up here.", href: "/home", where: "My badges, under your progress (only when there are messages)" },
  { id: "badge-first", scope: "scout", title: "Your badges", text: "Each card is a badge. The bar shows how far through you are. Tap a card to see its tasks.", href: "/home", where: "My badges" },
  { id: "badge-locked", scope: "scout", title: "Locked stages", text: "Stages unlock in order. Finish the stage before and this one opens up.", href: "/home", where: "My badges (only if something is locked)" },
  { id: "toolbox-card", scope: "scout", title: "Code toolbox", text: "A shortcut to the Morse, phonetic and semaphore helpers.", href: "/home", where: "bottom of My badges" },
  { id: "badge-progress", scope: "scout", title: "Badge progress", text: "How much of this badge you've done. When every task is done, a leader signs it off.", where: "top right of a badge page" },
  { id: "badge-tasks", scope: "scout", title: "The tasks", text: "These are the tasks for this badge. Tap one to open its step-by-step guide. 'Leader checks this' means a leader will look at it.", where: "a badge page" },
  { id: "task-header", scope: "scout", title: "Your task", text: "What this task is, roughly how long it takes, and whether you tick it off yourself or a leader checks it.", where: "top of a task" },
  { id: "help-button", scope: "scout", title: "Ask for help", text: "Need a real person? Press this and a leader will come over.", where: "top right of a task" },
  { id: "save-indicator", scope: "scout", title: "Saving", text: "Your answers save automatically as you type, so you won't lose anything.", where: "top right of a task" },
  { id: "step-nav", scope: "scout", title: "The steps", text: "Every task is broken into small steps. You can jump to any step from here.", where: "a task: down the side, or along the top on phones" },
  { id: "step-content", scope: "scout", title: "This step", text: "Read what to do here. Pictures, tips and links help you along.", where: "middle of a task" },
  { id: "step-todo", scope: "scout", title: "To-do list", text: "Tap each one as you do it, to keep track.", where: "a task step (only some steps)" },
  { id: "step-answers", scope: "scout", title: "Your answers", text: "Type your answers here. Some answers can check themselves!", where: "a task step (only steps with questions)" },
  { id: "upload-box", scope: "scout", title: "Add a photo or file", text: "Tap here to add a screenshot, photo or file as evidence.", where: "a task step (only steps that need a file)" },
  { id: "next-step", scope: "scout", title: "Next step", text: "When you've finished this step, move on to the next one.", where: "bottom of a task" },
  { id: "finish-step", scope: "scout", title: "Check & finish", text: "The last step checks nothing is missing, then you finish the task or send it to a leader.", where: "a task: the last item in the step list" },

  // --------------------------------------------------------------- leaders
  { id: "admin-nav-dashboard", scope: "leader", title: "Dashboard", text: "Your home page: who needs help, what to review and what's ready to sign off.", where: "top navigation" },
  { id: "admin-nav-review", scope: "leader", title: "Review", text: "Everything waiting for a leader to check. The red number is how many are waiting.", where: "top navigation" },
  { id: "admin-nav-scouts", scope: "leader", title: "Young people", text: "Everyone's list: add people, import a list, and open anyone's page.", where: "top navigation" },
  { id: "admin-nav-badges", scope: "leader", title: "Badge tracker", text: "A grid of everyone and every badge, plus CSV export.", where: "top navigation" },
  { id: "admin-nav-library", scope: "leader", title: "Badge library", text: "Every badge and task, with a preview of exactly what young people see.", where: "top navigation" },
  { id: "admin-nav-leaders", scope: "leader", title: "Leaders", text: "Add other leaders, reset passwords and change your own.", where: "top navigation" },
  { id: "admin-nav-settings", scope: "leader", title: "Settings", text: "Event name, whether young people can add themselves, and an optional group code.", where: "top navigation" },
  { id: "helper-button", scope: "leader", title: "Leader helper", text: "Ask about the app or any badge requirement here.", where: "bottom right of every page" },
  { id: "admin-stats", scope: "leader", title: "At a glance", text: "Young people, work waiting, hands up, badges ready and badges signed off. Tap a tile to jump there.", href: "/admin", where: "top of the dashboard" },
  { id: "admin-hands-up", scope: "leader", title: "Hands up", text: "Young people asking for help (or flagged by the helper). Press Sorted once you've helped.", href: "/admin", where: "dashboard (only when someone needs help)" },
  { id: "admin-review-queue", scope: "leader", title: "Waiting for review", text: "The oldest submissions first. Open one to approve it or ask for changes.", href: "/admin", where: "dashboard" },
  { id: "admin-ready", scope: "leader", title: "Ready to sign off", text: "Badges where every task is done. Check the work, then Sign off.", href: "/admin", where: "dashboard" },
  { id: "admin-activity", scope: "leader", title: "Latest activity", text: "Everything that's happened, newest first. The page refreshes itself.", href: "/admin", where: "dashboard, right-hand side" },
  { id: "review-list", scope: "leader", title: "Submissions", text: "Each card is a task someone has sent. Open one to see their answers and files.", href: "/admin/review", where: "Review page" },
  { id: "review-look-for", scope: "leader", title: "What to look for", text: "A short note on what this task needs before you approve it.", where: "a submission page" },
  { id: "review-answers", scope: "leader", title: "Their answers", text: "Everything they typed and uploaded, step by step. Puzzle answers are auto-checked.", where: "a submission page" },
  { id: "review-ai", scope: "leader", title: "AI leader", text: "What the AI leader decided and why. Open 'How it decided' to see its scores and what it saw in each upload, or ask it to look.", where: "a submission page, right-hand side (when the AI leader is on)" },
  { id: "review-decision", scope: "leader", title: "Your decision", text: "Approve it, or ask for changes with a message they'll see.", where: "a submission page, right-hand side" },
  { id: "scouts-search", scope: "leader", title: "Search and filter", text: "Find someone by name or show one section.", href: "/admin/scouts", where: "Young people page" },
  { id: "scouts-table", scope: "leader", title: "Everyone", text: "Click a name to open their page with every badge and task.", href: "/admin/scouts", where: "Young people page" },
  { id: "scouts-add", scope: "leader", title: "Add one person", text: "First name, last name, date of birth and section. That's how they log in.", href: "/admin/scouts", where: "Young people page, bottom" },
  { id: "scouts-import", scope: "leader", title: "Add lots at once", text: "Paste a list from a spreadsheet or OSM: First, Last, DD/MM/YYYY, Section.", href: "/admin/scouts", where: "Young people page, bottom" },
  { id: "scouts-export", scope: "leader", title: "Export CSV", text: "Download everyone's badge progress, e.g. to update OSM.", href: "/admin/scouts", where: "Young people page, top right" },
  { id: "person-badge", scope: "leader", title: "Their badges", text: "Each badge with its tasks. Tick off tasks done on paper, reopen tasks, and see what's locked.", where: "a young person's page" },
  { id: "person-signoff", scope: "leader", title: "Sign off", text: "Award the badge. 'Sign off anyway' works even if not every task is done, e.g. a stage done last year, which also unlocks the next stage.", where: "a young person's page, on each badge" },
  { id: "person-chats", scope: "leader", title: "Helper chats", text: "What they've asked the AI helper. Flagged messages are highlighted in red.", where: "a young person's page, bottom" },
  { id: "tracker-grid", scope: "leader", title: "Badge tracker", text: "Green tick = signed off, blue = ready to sign off, ring = % done, amber dot = waiting for review.", href: "/admin/badges", where: "Badge tracker page" },
  { id: "settings-ai", scope: "leader", title: "AI leader", text: "Switch the AI leader's reviewing and badge sign-off on or off, and choose whether it may approve tasks a leader would normally see in person.", href: "/admin/settings", where: "Settings page, under the login options" },
  { id: "settings-signup", scope: "leader", title: "Self sign-up", text: "Turn this off once everyone's on your list, so only people you've added can log in.", href: "/admin/settings", where: "Settings page" },
];

export type TourStep = { target?: string; title: string; text: string; href?: string };

export type TourDef = { id: string; scope: TourScope; title: string; intro: string; steps: TourStep[] };

const a = (id: string, scope: TourScope = "scout"): TourStep => {
  const anchor = ANCHORS.find((x) => x.id === id && x.scope === scope)!;
  return { target: id, title: anchor.title, text: anchor.text, href: anchor.href };
};

export const TOURS: TourDef[] = [
  {
    id: "scout-start",
    scope: "scout",
    title: "Getting started",
    intro: "A quick look around: where your badges are and how to get help.",
    steps: [
      { title: "Welcome! 👋", text: "This is where you work through your JOTA-JOTI badges, one small step at a time. Let's have a quick look around.", href: "/home" },
      a("home-stats"),
      a("badge-first"),
      a("badge-locked"),
      a("nav-toolbox"),
      a("nav-chat"),
      a("nav-home"),
      a("notifications"),
      a("helper-button"),
      { title: "You're ready! 🎉", text: "Tap a badge to start. If you get stuck, ask the helper or press 'Ask for help' on any task." },
    ],
  },
  {
    id: "scout-chat",
    scope: "scout",
    title: "The JOTI chat",
    intro: "How to get into the JOTA-JOTI chat, practise, and stay safe.",
    steps: [
      { title: "Chat with the world 🌍", text: "This page shows you how to get into the JOTA-JOTI chat, where Scouts from every country talk to each other.", href: "/chat" },
      a("chat-age"),
      a("chat-screen"),
      a("chat-practice"),
      a("chat-rooms"),
      a("chat-starters"),
      a("chat-safety"),
      a("chat-open"),
      { title: "Have fun! 🎉", text: "Practise first, then open the real chat. If anything worries you, tell a leader straight away." },
    ],
  },
  {
    id: "scout-task",
    scope: "scout",
    title: "How tasks work",
    intro: "How to move through a task, save your answers and finish it.",
    steps: [
      { title: "Inside a task", text: "Every task is a step-by-step guide. Let's see how it works.", href: "/badges/digital-citizen-1/you-online" },
      a("task-header"),
      a("step-nav"),
      a("step-content"),
      a("step-todo"),
      a("step-answers"),
      a("upload-box"),
      a("save-indicator"),
      a("next-step"),
      a("finish-step"),
      a("help-button"),
      { title: "That's it! 🙌", text: "Work through the steps, then Check & finish. A leader will look at anything marked 'Leader checks this'." },
    ],
  },
  {
    id: "leader-start",
    scope: "leader",
    title: "Dashboard tour",
    intro: "The leaders' area at a glance.",
    steps: [
      { title: "Welcome to the leaders' area", text: "Here's where you keep track of everyone's badges during the event.", href: "/admin" },
      a("admin-stats", "leader"),
      a("admin-hands-up", "leader"),
      a("admin-review-queue", "leader"),
      a("admin-ready", "leader"),
      a("admin-activity", "leader"),
      a("admin-nav-review", "leader"),
      a("admin-nav-scouts", "leader"),
      a("admin-nav-badges", "leader"),
      a("admin-nav-library", "leader"),
      a("admin-nav-leaders", "leader"),
      a("admin-nav-settings", "leader"),
      a("helper-button", "leader"),
    ],
  },
  {
    id: "leader-people",
    scope: "leader",
    title: "Adding young people",
    intro: "Get your section on the list and find anyone quickly.",
    steps: [
      a("scouts-search", "leader"),
      a("scouts-table", "leader"),
      a("scouts-add", "leader"),
      a("scouts-import", "leader"),
      a("scouts-export", "leader"),
      a("settings-signup", "leader"),
    ],
  },
  {
    id: "leader-person",
    scope: "leader",
    title: "Signing off badges",
    intro: "On a young person's page: tick off tasks and sign off badges.",
    steps: [
      { title: "A young person's page", text: "Open anyone from the Young people list to see this page.", href: "/admin/scouts" },
      a("person-badge", "leader"),
      a("person-signoff", "leader"),
      a("person-chats", "leader"),
    ],
  },
];

export function getTour(id: string) {
  return TOURS.find((t) => t.id === id);
}

/**
 * Turns an anchor id into something the tour can show, including the dynamic
 * ones: badge:<badgeId> and task:<badgeId>/<taskId>.
 */
export function resolveAnchor(id: string, scope: TourScope): TourStep | null {
  const fixed = ANCHORS.find((x) => x.id === id && x.scope === scope);
  if (fixed) return { target: fixed.id, title: fixed.title, text: fixed.text, href: fixed.href };
  if (scope === "scout" && id.startsWith("badge:")) {
    const badge = getBadge(id.slice(6));
    if (badge) return { target: id, title: badgeName(badge), text: "Here's that badge. Tap it to see its tasks.", href: "/home" };
  }
  if (scope === "scout" && id.startsWith("task:")) {
    const [badgeId, taskId] = id.slice(5).split("/");
    const badge = getBadge(badgeId);
    const task = badge && getTask(badge, taskId);
    if (badge && task) return { target: id, title: task.title, text: "Here's that task. Tap it to open the step-by-step guide.", href: `/badges/${badge.id}` };
  }
  return null;
}
